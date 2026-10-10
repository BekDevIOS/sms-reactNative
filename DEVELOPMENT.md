# Mobile development on the VPS

The development image contains Node.js 20, JDK 17, Android SDK 36, build-tools
35.0.0 and 36.0.0, NDK 27.1.12297006 and CMake 3.22.1.

Create an ignored `.env` file for the development API:

```dotenv
BASE_URL=http://127.0.0.1:4010
```

Start Metro:

```bash
docker compose -f compose.dev.yml up -d --build
docker compose -f compose.dev.yml logs -f mobile
```

Run checks and create a debug APK:

```bash
docker compose -f compose.dev.yml exec mobile npx tsc --noEmit
docker compose -f compose.dev.yml exec mobile npm test -- --runInBand
docker compose -f compose.dev.yml exec mobile sh -lc \
  'cd android && ./gradlew assembleDebug --no-daemon --no-parallel --max-workers=1 \
  -Dorg.gradle.jvmargs="-Xmx1280m -XX:MaxMetaspaceSize=384m" \
  -PreactNativeArchitectures=arm64-v8a'
```

The debug APK is written to
`android/app/build/outputs/apk/debug/app-debug.apk`.

The constrained Gradle command builds the architecture used by current Android
phones without exhausting RAM on the shared VPS. Build additional ABIs on a
developer workstation or in CI when a universal APK is needed.

For a physical phone attached to the developer workstation, forward Metro and
the development API through SSH, then use ADB reverse:

```bash
ssh \
  -L 8081:127.0.0.1:8081 \
  -L 4010:127.0.0.1:4010 \
  ubuntu@YOUR_VPS

adb reverse tcp:8081 tcp:8081
adb reverse tcp:4010 tcp:4010
adb install -r app-debug.apk
```

Stop Metro without deleting caches:

```bash
docker compose -f compose.dev.yml down
```
