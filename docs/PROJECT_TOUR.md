## Project Tour (Representative Dashboard Android repo)

This repository is currently an **Expo + React Native** app that implements a **single login screen template** (from Instamobile), including **Facebook Login** via `react-native-fbsdk-next`.

If your long-term goal is a “representative dashboard”, think of this repo as the **starting shell**: it boots correctly on Android/iOS with Expo and demonstrates one working screen + one native integration (Facebook auth).

---

## 1) How the app boots (the “startup chain”)

When you run `yarn start` / `expo start`, Expo loads your JavaScript entrypoint.

- **`package.json`**
  - `"main": "node_modules/expo/AppEntry.js"` → Expo’s standard entry file.
- **Native shells (`android/` and `ios/`)**
  - Both Android and iOS start a React Native “module” called **`main`**.
  - Android: `MainActivity.getMainComponentName()` returns `"main"`.
  - iOS: `AppDelegate` calls `startReactNative(withModuleName: "main", ...)`.
- **Your app code**
  - `App.js` is the first file you “own” that gets rendered.
  - `App.js` renders `src/login/login.js` (the actual screen UI).

Mental model:

> Native (Android/iOS) launches a React Native runtime → Expo provides the bundling/dev tooling → `App.js` is rendered → your screen components render UI.

---

## 2) Where the UI lives

Right now the entire UI is:

- `App.js` — renders `<LoginScreen />`
- `src/login/login.js` — the login screen component (Cognito login + optional Facebook login; styles are defined inline in this file)

There is no navigation or multiple screens yet. If you add more features, you’ll likely introduce folders like:

- `src/screens/` (each screen)
- `src/components/` (reusable UI)
- `src/navigation/` (React Navigation)
- `src/api/` or `src/services/` (network calls)
- `src/state/` (Redux/Zustand/Context)

---

## 3) Facebook login: what code runs and where it’s configured

### The runtime code (JavaScript)

In `src/login/login.js`:

- `Settings.initializeSDK()` initializes the FB SDK.
- `LoginManager.logInWithPermissions(...)` opens the Facebook login flow.
- `AccessToken.getCurrentAccessToken()` returns an access token.
- The app then calls Facebook Graph API:
  - `https://graph.facebook.com/me?...&fields=id,name,email`

### The app configuration (Expo config)

In `app.json`:

- `facebookScheme`, `facebookAppId`, `facebookDisplayName`
- `plugins: [["react-native-fbsdk-next", { appID, clientToken, displayName }]]`

That plugin is what wires the right native settings during “prebuild/run”.

### Native configuration (generated/kept in sync)

Android:

- `android/app/src/main/AndroidManifest.xml` contains Facebook SDK `<meta-data>` entries and activities.
- `android/app/src/main/res/values/strings.xml` contains:
  - `facebook_app_id`
  - `facebook_client_token`
  - `fb_login_protocol_scheme`

iOS:

- `ios/loginscreen/Info.plist` contains:
  - `FacebookAppID`, `FacebookClientToken`, `FacebookDisplayName`
  - `LSApplicationQueriesSchemes`
  - URL schemes including `fb<APP_ID>`

### The one value you must replace

`clientToken` is currently a placeholder:

- `app.json`: `"clientToken": "your_client_token_here"`
- Android `strings.xml`: `<string name="facebook_client_token">your_client_token_here</string>`
- iOS `Info.plist`: `<key>FacebookClientToken</key> ... your_client_token_here`

If you want Facebook Login to work for *your* Facebook app, you must replace **App ID** and **Client Token** with your own values, and ensure your package/bundle identifiers match what you registered in Meta developer console.

---

## 4) How to run it (day-to-day workflow)

From the repo root:

```bash
yarn install
yarn start
```

Then in another terminal (or by pressing the right key in the Expo CLI UI), you can run a native build:

```bash
yarn android
# or
yarn ios
```

Notes:

- `yarn android` uses `expo run:android` which builds a dev client and installs it on an emulator/device.
- You’ll need Android Studio + an emulator (or a plugged-in device with USB debugging).

---

## 5) “Learn everything” checklist (practical)

If you want to ramp up fast, do these in order:

- **Read the entrypoints**: `package.json` → `App.js` → `src/login/login.js`
- **Make a tiny UI change**: change the logo text, adjust spacing in `style.js`, reload.
- **Add real state**: store username/password in React state and validate on press.
- **Replace alerts with real auth**: implement `onLoginPress` to call your backend.
- **Add navigation**: after successful login, navigate to a “Dashboard” screen.
- **Reconfigure Facebook app**: replace App ID/client token and verify native config.

If you tell me your current level (new to React Native vs experienced web dev, etc.) and your end goal for the “dashboard”, I can propose a concrete roadmap and we can build it step-by-step.

