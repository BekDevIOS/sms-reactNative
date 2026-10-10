# NovaSMS Android — signed release APK (sideload)

The release build is signed with a private keystore, minified (R8), and forbids
cleartext HTTP (HTTPS only). The keystore and its passwords are **never committed**
(`.gitignore` already covers `*.keystore` and `local.properties`).

## 1. Generate the release keystore (one-time)

```bash
keytool -genkeypair -v \
  -keystore android/app/novasms-release.keystore \
  -alias novasms -keyalg RSA -keysize 2048 -validity 10000
```
Keep the keystore file and passwords safe — losing them means you can't ship
updates that install over an existing copy.

## 2. Provide signing secrets to Gradle

Add to `android/local.properties` (gitignored) — or `~/.gradle/gradle.properties`:

```properties
NOVASMS_STORE_FILE=novasms-release.keystore
NOVASMS_STORE_PASSWORD=********
NOVASMS_KEY_ALIAS=novasms
NOVASMS_KEY_PASSWORD=********
```
If these are absent, `assembleRelease` falls back to the debug key (dev only).

## 3. Point the app at the production API

Create `.env` (gitignored) at the project root:

```
BASE_URL=https://api.YOURDOMAIN
```
Release builds block cleartext, so the URL **must** be `https://`. (Users can
still override the URL on the login screen.)

## 4. Build the signed APK

```bash
cd android
./gradlew clean assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

Verify the signature:
```bash
$ANDROID_HOME/build-tools/<ver>/apksigner verify --print-certs \
  app/build/outputs/apk/release/app-release.apk
```

## 5. Install (sideload)

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```
Or distribute the APK file directly. On first launch grant the **SMS** and
**notifications** permissions, then log in over HTTPS, claim the device with a
pairing code, and start the worker.

## Standalone dev release for a physical phone

The `devRelease` variant bundles JavaScript like a release build, uses the
isolated VPS development API, and installs as `com.smssender.dev` under the
name **NovaSMS Dev**. It can coexist with the production app and does not need
Metro, USB, or `adb reverse`.

Start the optional HTTPS dev tunnel from the backend repository, copy the URL
from its logs, then build:

```bash
docker compose -f compose.dev.yml --profile phone up -d tunnel
docker compose -f compose.dev.yml logs tunnel

cp .env.dev.example .env.dev
# Set BASE_URL to the https://....trycloudflare.com URL from the log.
npm run android:dev-release
# -> android/app/build/outputs/apk/devRelease/app-devRelease.apk
```

The tunnel exposes only the isolated development API/database. A Quick Tunnel
URL is temporary and can change if its container is recreated; update
`.env.dev` and rebuild the dev APK after such a change.

## Notes
- `versionCode` must be incremented in `android/app/build.gradle` for every new
  release that installs over a previous one.
- SMS permissions are fine for sideloading. Publishing to Google Play would
  require special SMS-permission approval — out of scope here.
