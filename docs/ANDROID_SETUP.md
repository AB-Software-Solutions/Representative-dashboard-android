## Run this app on Android (Linux)

Right now your machine has **adb** but not a full Android SDK (no `sdkmanager`, `avdmanager`, or `emulator`). To run `yarn android` you need a full SDK install.

You have two options:

---

## Option A (recommended): Android Studio (simplest)

1) Install **Android Studio**.
2) Open Android Studio → **SDK Manager** and install:
   - Android SDK Platform (e.g. **Android 14 / API 34**)
   - **Android SDK Build-Tools** (matching the platform, e.g. 34.x)
   - **Android Emulator**
   - **Android SDK Platform-Tools**
3) Create an emulator:
   - Tools → Device Manager → Create device → pick a Pixel → download a system image → Start.
4) Set env vars (default SDK path is usually `~/Android/Sdk`):

```bash
export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$PATH"
```

5) Verify:

```bash
adb devices
```

You should see an emulator (or a device) listed.

6) Run the app:

```bash
cd /home/onexys/abss/projects/election/representative-dashboard-android
yarn android
```

---

## Option B: Physical Android device (no emulator needed)

1) Enable **Developer options** and **USB debugging** on the phone.
2) Plug in USB, accept the RSA prompt.
3) Verify:

```bash
adb devices
```

4) Run:

```bash
cd /home/onexys/abss/projects/election/representative-dashboard-android
yarn android
```

---

## Notes about this project

- This repo uses `expo run:android` (see `package.json`) which builds and installs a **development build**.
- Config generation runs automatically before builds (`node generate-env.js`).

