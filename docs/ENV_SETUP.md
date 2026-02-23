## Environment setup (Amplify / Cognito)

This app reads configuration from **Expo public env vars** (at runtime in dev, and baked into builds). The code expects these variables:

- `EXPO_PUBLIC_AWS_REGION`
- `EXPO_PUBLIC_COGNITO_USER_POOL_ID`
- `EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID`
- `EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID` (optional for basic login, but recommended)
- `EXPO_PUBLIC_AMPLIFY_API_NAME`
- `EXPO_PUBLIC_AMPLIFY_API_URL`

### Generated config file (like ElectionDashboard)

This repo also includes `generate-env.js` which writes a config file at:

- `src/config.js`

So you can run:

```bash
node generate-env.js
```

And then start Expo. The generator reads the same env vars listed above (and falls back to defaults if none are set).

### Example values (replace with your real ones)

```bash
export EXPO_PUBLIC_AWS_REGION="eu-central-1"
export EXPO_PUBLIC_COGNITO_USER_POOL_ID="eu-central-1_XXXXXXXXX"
export EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
export EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID="eu-central-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export EXPO_PUBLIC_AMPLIFY_API_NAME="test-election-client-api"
export EXPO_PUBLIC_AMPLIFY_API_URL="https://example.execute-api.eu-central-1.amazonaws.com/test"
```

Then run:

```bash
yarn start
```

### One-liner (useful for CI or quick local runs)

You can also start Expo with env vars inline:

```bash
EXPO_PUBLIC_AWS_REGION="eu-central-1" \
EXPO_PUBLIC_COGNITO_USER_POOL_ID="eu-central-1_XXXXXXXXX" \
EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx" \
EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID="eu-central-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
EXPO_PUBLIC_AMPLIFY_API_NAME="test-election-client-api" \
EXPO_PUBLIC_AMPLIFY_API_URL="https://example.execute-api.eu-central-1.amazonaws.com/test" \
yarn web --port 8081
```

If you don’t set these, the login screen will show a red “Missing Amplify env vars…” message.

