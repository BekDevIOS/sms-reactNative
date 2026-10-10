package com.smssender

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.content.pm.PackageManager
import android.provider.Settings
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * Direct (no-UI) SMS sender wrapping Android [SmsManager].
 *
 * Exposes a single promise method [sendSms]. Long messages are split with
 * [SmsManager.divideMessage] and sent via [SmsManager.sendMultipartTextMessage];
 * delivery is confirmed through per-part "sent" PendingIntents captured by a
 * one-shot BroadcastReceiver, so the JS layer gets an accurate SENT/FAILED signal
 * plus a coarse failReason. Written as a legacy module — it runs fine through the
 * New Architecture interop layer (no codegen spec required).
 */
class DirectSmsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  /** Monotonic id used to keep broadcast actions and PendingIntent request codes unique. */
  private val counter = AtomicInteger(0)

  @Suppress("DEPRECATION")
  private fun getSmsManager(subscriptionId: Int?): SmsManager {
    if (subscriptionId != null && subscriptionId >= 0) {
      return SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
    }
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      reactContext.getSystemService(SmsManager::class.java)
    } else {
      SmsManager.getDefault()
    }
  }

  /** Returns active SIM subscriptions so the user can explicitly choose SIM 1 / SIM 2. */
  @ReactMethod
  fun getSimCards(promise: Promise) {
    if (reactContext.checkSelfPermission(Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("phone_permission_denied", "READ_PHONE_STATE permission is required")
      return
    }
    try {
      val manager = reactContext.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
      val result = Arguments.createArray()
      for (info in manager.activeSubscriptionInfoList.orEmpty().sortedBy { it.simSlotIndex }) {
        val item = Arguments.createMap()
        item.putInt("subscriptionId", info.subscriptionId)
        item.putInt("slotIndex", info.simSlotIndex)
        item.putString("carrierName", info.carrierName?.toString() ?: "")
        item.putString("displayName", info.displayName?.toString() ?: "")
        result.pushMap(item)
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("sim_read_error", "Unable to read active SIM cards: ${e.message}", e)
    }
  }

  private fun simAbsent(subscriptionId: Int?): Boolean =
      try {
        val base = reactContext.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        val tm = if (subscriptionId != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          base?.createForSubscriptionId(subscriptionId)
        } else {
          base
        }
        tm?.simState == TelephonyManager.SIM_STATE_ABSENT
      } catch (e: Exception) {
        // If we cannot read SIM state, don't block the send — let the radio report failure.
        false
      }

  /** Maps a non-OK SmsManager result code to a short, stable failReason for the backend. */
  private fun reasonForResult(code: Int): String =
      when (code) {
        SmsManager.RESULT_ERROR_RADIO_OFF -> "radio_off"
        SmsManager.RESULT_ERROR_NO_SERVICE -> "no_service"
        SmsManager.RESULT_ERROR_NULL_PDU -> "null_pdu"
        else -> "send_error"
      }

  @ReactMethod
  fun sendSms(phone: String, message: String, subscriptionId: Double?, promise: Promise) {
    if (phone.isBlank()) {
      promise.reject("invalid_number", "Empty phone number")
      return
    }
    if (simAbsent(subscriptionId?.toInt())) {
      promise.reject("no_sim", "No SIM card present")
      return
    }

    val sms: SmsManager =
        try {
          getSmsManager(subscriptionId?.toInt())
        } catch (e: Exception) {
          promise.reject("send_error", "Unable to obtain SmsManager: ${e.message}", e)
          return
        }

    val parts =
        try {
          sms.divideMessage(message)
        } catch (e: Exception) {
          promise.reject("send_error", "divideMessage failed: ${e.message}", e)
          return
        }
    val total = if (parts.isNullOrEmpty()) 1 else parts.size

    val action = ACTION_SENT + counter.incrementAndGet()
    val remaining = AtomicInteger(total)
    val firstErrorCode = AtomicInteger(NO_ERROR)
    val settled = AtomicBoolean(false)

    val mainHandler = Handler(Looper.getMainLooper())
    // Holder so the receiver can cancel the watchdog once all parts report back.
    val timeoutRunnableHolder = arrayOfNulls<Runnable>(1)

    val receiver =
        object : BroadcastReceiver() {
          override fun onReceive(ctx: Context?, intent: Intent?) {
            if (resultCode != Activity.RESULT_OK) {
              firstErrorCode.compareAndSet(NO_ERROR, resultCode)
            }
            if (remaining.decrementAndGet() <= 0) {
              safeUnregister(this)
              timeoutRunnableHolder[0]?.let { mainHandler.removeCallbacks(it) }
              if (settled.compareAndSet(false, true)) {
                val err = firstErrorCode.get()
                if (err == NO_ERROR) {
                  val map = Arguments.createMap()
                  map.putInt("resultCode", Activity.RESULT_OK)
                  map.putInt("parts", total)
                  promise.resolve(map)
                } else {
                  promise.reject(reasonForResult(err), "SMS send failed (result code $err)")
                }
              }
            }
          }
        }

    val filter = IntentFilter(action)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      reactContext.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      reactContext.registerReceiver(receiver, filter)
    }

    // Watchdog: if the platform never broadcasts a result, settle as a timeout so the
    // JS worker can still report the job (the backend also self-heals after 5 min).
    val timeoutRunnable = Runnable {
      safeUnregister(receiver)
      if (settled.compareAndSet(false, true)) {
        promise.reject("timeout", "No SMS sent confirmation within timeout")
      }
    }
    timeoutRunnableHolder[0] = timeoutRunnable
    mainHandler.postDelayed(timeoutRunnable, SEND_TIMEOUT_MS)

    val flags =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
          PendingIntent.FLAG_UPDATE_CURRENT
        }

    fun makePendingIntent(): PendingIntent {
      val intent = Intent(action).setPackage(reactContext.packageName)
      return PendingIntent.getBroadcast(reactContext, counter.incrementAndGet(), intent, flags)
    }

    try {
      if (total > 1) {
        val sentIntents = ArrayList<PendingIntent>(total)
        for (i in 0 until total) {
          sentIntents.add(makePendingIntent())
        }
        sms.sendMultipartTextMessage(phone, null, parts, sentIntents, null)
      } else {
        sms.sendTextMessage(phone, null, message, makePendingIntent(), null)
      }
    } catch (e: Exception) {
      safeUnregister(receiver)
      mainHandler.removeCallbacks(timeoutRunnable)
      if (settled.compareAndSet(false, true)) {
        promise.reject("send_error", "send threw: ${e.message}", e)
      }
    }
  }

  /** Whether this app is currently exempt from Doze/battery optimization. */
  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    try {
      val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
      promise.resolve(pm.isIgnoringBatteryOptimizations(reactContext.packageName))
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  /**
   * Opens the system prompt to exempt this app from battery optimization. Falls back to the
   * app-details settings page on OEMs that block the direct request intent.
   */
  @ReactMethod
  fun requestIgnoreBatteryOptimizations(promise: Promise) {
    val pkgUri = Uri.parse("package:" + reactContext.packageName)
    try {
      val intent =
          Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, pkgUri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
      (reactContext.currentActivity ?: reactContext).startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      try {
        val intent =
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkgUri).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        (reactContext.currentActivity ?: reactContext).startActivity(intent)
        promise.resolve(true)
      } catch (e2: Exception) {
        promise.reject("error", "Unable to open battery optimization settings", e2)
      }
    }
  }

  /** Exposes the previous fatal exception after the user reopens the app. */
  @ReactMethod
  fun getLastCrash(promise: Promise) {
    val crash = CrashDiagnostics.read(reactContext)
    if (crash == null) {
      promise.resolve(null)
      return
    }
    val map = Arguments.createMap()
    map.putDouble("at", crash.at.toDouble())
    map.putString("trace", crash.trace)
    promise.resolve(map)
  }

  @ReactMethod
  fun clearLastCrash(promise: Promise) {
    CrashDiagnostics.clear(reactContext)
    promise.resolve(true)
  }

  private fun safeUnregister(receiver: BroadcastReceiver) {
    try {
      reactContext.unregisterReceiver(receiver)
    } catch (_: Exception) {
      // Already unregistered — ignore.
    }
  }

  companion object {
    const val NAME = "DirectSms"
    private const val ACTION_SENT = "com.smssender.SMS_SENT_"
    private const val NO_ERROR = Int.MIN_VALUE
    private const val SEND_TIMEOUT_MS = 90_000L
  }
}
