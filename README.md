<p align="center">
  <a href="https://instamobile.io/app-templates/react-native-login-screen-template/">
    <img
      src="https://www.instamobile.io/wp-content/uploads/2018/04/react-native-login-screen-template-cover.png"
      alt="React Native Login Screen"
    />
  </a>
</p>

## React Native Login Screen (Expo) — Android & iOS

This repository currently contains a simple **React Native login screen** (Instamobile template) built with **Expo**. It includes:

- Email/password inputs (UI only)
- Facebook login using `react-native-fbsdk-next`

For a deeper explanation of how the project is structured and how everything boots, read:

- `docs/PROJECT_TOUR.md`

## Quick start

```bash
yarn install
yarn start
```

Run a native build:

```bash
yarn android
# or
yarn ios
```

## Authentication (Cognito / Amplify)

This app now includes a **Cognito (Amplify) username/password login flow**. Configure it by setting the Expo public env vars described in:

- `docs/ENV_SETUP.md`

## Facebook login configuration (important)

The Facebook client token is currently a placeholder (`your_client_token_here`). To make Facebook login work for *your* app, update the Facebook App ID / Client Token and make sure your Android package + iOS bundle identifier match what you registered in Meta developer console.

## Credits

Original template inspiration and resources:

- Instamobile: `https://instamobile.io/`
- iOS App Templates: `https://iosapptemplates.com`
