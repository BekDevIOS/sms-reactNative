package com.smssender

import android.app.Application
import android.content.Context
import android.os.Process
import android.util.Log

data class RecordedCrash(val at: Long, val trace: String)

/**
 * Persists the last uncaught exception before delegating to Android's normal crash handler.
 * The next app launch can display it without adding a third-party telemetry service.
 */
object CrashDiagnostics {
  private const val PREFS = "tezkorsms_crash_diagnostics"
  private const val KEY_AT = "last_crash_at"
  private const val KEY_TRACE = "last_crash_trace"
  private const val MAX_TRACE_LENGTH = 12_000

  fun install(application: Application) {
    val previous = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
      try {
        val trace = Log.getStackTraceString(throwable).take(MAX_TRACE_LENGTH)
        application
          .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
          .edit()
          .putLong(KEY_AT, System.currentTimeMillis())
          .putString(KEY_TRACE, trace)
          .commit()
      } catch (_: Throwable) {
        // Diagnostics must never mask the original exception.
      } finally {
        if (previous != null) {
          previous.uncaughtException(thread, throwable)
        } else {
          Process.killProcess(Process.myPid())
        }
      }
    }
  }

  fun read(context: Context): RecordedCrash? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val at = prefs.getLong(KEY_AT, 0L)
    val trace = prefs.getString(KEY_TRACE, null)
    return if (at > 0L && !trace.isNullOrBlank()) RecordedCrash(at, trace) else null
  }

  fun clear(context: Context) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
  }
}
