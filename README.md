# SMS Sender — Android companion app

The **sender device** app for an SMS phone-farm. A NestJS backend orchestrates campaigns; physical
Android phones running this app do the actual sending. The app is a **headless background worker with
a thin status UI**: it pairs with the backend using a one-time code, stays `ONLINE` via heartbeats,
polls for assigned SMS jobs, sends each through the phone's native `SmsManager`, and reports the
result.

> **Android only.** iOS cannot auto-send SMS, so there is no iOS target.

- **React Native** 0.81.6 (bare workflow, TypeScript, New Architecture).
- **SMS engine:** custom Kotlin native module (`DirectSms`) wrapping `SmsManager` — multipart aware,
  with per-part delivery result codes.
- **Background worker:** `@notifee/react-native` foreground service with a persistent notification.
- **Storage:** AsyncStorage. **Device info:** `react-native-device-info` + `@react-native-community/netinfo`.

---

## Project layout

```
android/app/src/main/java/com/smssender/
  DirectSmsModule.kt      # SmsManager wrapper (sendSms + battery-optimization helpers)
  DirectSmsPackage.kt     # registers the module
  MainApplication.kt      # adds DirectSmsPackage to the package list
index.js                  # registers the notifee foreground-service task (outside React)
App.tsx                   # screen switch: Pairing | Dashboard | Log
src/
  api/        types.ts, client.ts        # exact backend contract + typed errors
  storage/    config.ts, log.ts          # token/config/counters + last-100 log
  sms/        DirectSms.ts               # typed wrapper over the native module
  worker/     worker.ts, foregroundService.ts   # the send loop + notifee FG service
  state/      AppState.tsx               # React context bridging UI <-> worker
  screens/    PairingScreen, DashboardScreen, LogScreen
  permissions.ts, device.ts, theme.ts
```

---

## Prerequisites

- **Node** ≥ 20, **npm**.
- **JDK 17** (required by RN 0.81 / AGP).
- **Android SDK** (Platform 36, build-tools 36) + platform-tools (`adb`) on your `PATH`.
  Set `ANDROID_HOME` (e.g. `C:\Users\<you>\AppData\Local\Android\Sdk`).
- A **physical Android phone** (API 26+) with an **active SIM** and a plan that allows SMS.
  Emulators cannot send real SMS.

Install JS dependencies:

```bash
npm install
```

---

## Run (debug)

1. Connect a phone with **USB debugging** enabled (`adb devices` should list it).
2. Start Metro and build:

   ```bash
   npm start            # terminal 1 — Metro bundler
   npm run android      # terminal 2 — builds & installs the debug APK
   ```

3. On first launch the app shows the **Pairing** screen.

---

## Permissions & battery setup (on device)

The app needs these to work as a 24/7 sender:

1. **SEND_SMS** — required to send. Pressing **START WORKER** requests it at runtime. If denied, the
   worker reports every job as `FAILED` with `failReason: "sms_permission_denied"` (it never silently
   drops jobs). Grant under **Settings → Apps → SMS Sender → Permissions → SMS**.
2. **READ_PHONE_STATE** — used to detect a missing SIM (`no_sim`). Requested with SEND_SMS.
3. **POST_NOTIFICATIONS** (Android 13+) — needed to show the foreground-service notification.
4. **Disable battery optimization** — Android will otherwise throttle/kill the background loop (Doze).
   The Dashboard shows a banner with a one-tap button; or do it manually under
   **Settings → Apps → SMS Sender → Battery → Unrestricted**.

> The foreground service is declared with `android:foregroundServiceType="specialUse"` because a
> continuous SMS worker fits no standard type (`dataSync` is time-capped on Android 15). This is fine
> for a **sideloaded** phone-farm device. If you ever publish to Play, the special-use subtype must be
> justified in the listing.

---

## Pairing & usage

1. In the web frontend, create a **device** to get a one-time **pairing code**.
2. On the **Pairing** screen, enter:
   - **Backend URL** — the NestJS server reachable from the phone, e.g. `http://192.168.1.10:4008`.
     (HTTP to a LAN IP works because the manifest allows cleartext in debug; for production HTTPS,
     point at your TLS endpoint.)
   - **Pairing code** — e.g. `ABC23XYZ`.
3. Tap **Pair device**. On success the token is persisted and the **Dashboard** appears.
4. Tap **START WORKER**. The persistent notification shows `Sending… / Idle`. The worker:
   - heartbeats every ~30s (`ONLINE`, battery, network, app version),
   - polls `GET /devices/jobs?limit=<sendLimitPerMinute>`,
   - sends each SMS sequentially, respecting the per-minute rate cap,
   - reports `SENT`/`FAILED` for every job.
5. **STOP WORKER** sends an `OFFLINE` heartbeat and tears down the service.
6. **Unpair** clears the token and returns to Pairing.

The worker auto-resumes on app relaunch if it was running, and the foreground service is restarted by
Android after a process kill. Any job left `PROCESSING` is reclaimed server-side after ~5 minutes
(max 3 attempts), so crashes self-heal.

---

## Building a release APK

1. Generate a keystore (once):

   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore release.keystore -alias smssender \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

   Place `release.keystore` in `android/app/`.

2. Add credentials to `android/gradle.properties` (do not commit secrets):

   ```properties
   SMSSENDER_UPLOAD_STORE_FILE=release.keystore
   SMSSENDER_UPLOAD_KEY_ALIAS=smssender
   SMSSENDER_UPLOAD_STORE_PASSWORD=*****
   SMSSENDER_UPLOAD_KEY_PASSWORD=*****
   ```

3. Wire the release `signingConfig` in `android/app/build.gradle` (replace the debug-signed release
   default):

   ```gradle
   signingConfigs {
       release {
           storeFile file(SMSSENDER_UPLOAD_STORE_FILE)
           storePassword SMSSENDER_UPLOAD_STORE_PASSWORD
           keyAlias SMSSENDER_UPLOAD_KEY_ALIAS
           keyPassword SMSSENDER_UPLOAD_KEY_PASSWORD
       }
   }
   buildTypes {
       release {
           signingConfig signingConfigs.release
           // ...
       }
   }
   ```

4. Build:

   ```bash
   cd android
   ./gradlew assembleRelease        # Windows: .\gradlew.bat assembleRelease
   ```

   The APK is at `android/app/build/outputs/apk/release/app-release.apk`. Install with
   `adb install -r app-release.apk`.

---

## Backend API contract

All endpoints except `claim` require `Authorization: Bearer <deviceToken>`.

| Method & path | Body | Notes |
|---|---|---|
| `POST /devices/claim` | `{ code }` | → `{ token, device }`. 401 = invalid code. |
| `POST /devices/heartbeat` | `{ status, batteryLevel, networkType, appVersion }` | every ~30s; `OFFLINE` on stop. |
| `GET /devices/jobs?limit=N` | — | returns claimed jobs (marked `PROCESSING`). Empty = idle. |
| `POST /devices/report` | `{ recipientId, status, failReason, providerResponse }` | `success:false` = duplicate, ignored. |

`failReason` values produced by the app: `sms_permission_denied`, `no_sim`, `radio_off`,
`no_service`, `null_pdu`, `invalid_number`, `send_error`, `timeout`, `native_module_missing`.

---

## Verify / test

```bash
npx tsc --noEmit     # type check
npm run lint         # eslint
npm test             # jest — API client unit tests (no native modules)
```

### Manual acceptance test (real hardware + running backend)

1. Pair with a backend code → app shows `ONLINE` (heartbeat visible server-side).
2. Backend member creates a `sendNow` campaign targeting the test phone.
3. App polls, sends a real SMS, reports `SENT`.
4. Backend `GET /campaigns/:id` shows `sentCount` incremented and status `DONE`.
5. Kill the app mid-campaign → after restart, reclaimed jobs (5-min server timeout) re-dispatch and
   complete.

> A real SMS send cannot be exercised on an emulator or in CI — it needs a physical phone with an
> active SIM plus the reachable backend. Automated checks stop at typecheck/lint/unit tests.

---

## Notes / extending

- `DirectSmsModule` is a legacy `ReactContextBaseJavaModule` that runs through the New Architecture
  interop layer. It can be migrated to a TurboModule (codegen spec) later if desired.
- Rate limiting uses a rolling-minute window sized to `sendLimitPerMinute` plus minimum spacing
  (`60000 / sendLimitPerMinute` ms) between sends; sending is strictly sequential to avoid carrier
  throttling.
