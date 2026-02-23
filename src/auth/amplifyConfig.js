import { AMPLIFY_API } from "../config";

export function getAmplifyEnvConfig() {
  // Prefer runtime Expo env vars (dev/CI), fall back to generated `src/config.js`.
  const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || AMPLIFY_API.userPoolId || "";
  const userPoolClientId =
    process.env.EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || AMPLIFY_API.userPoolClientId || "";
  const identityPoolId =
    process.env.EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID || AMPLIFY_API.identityPoolId || "";

  const apiName = process.env.EXPO_PUBLIC_AMPLIFY_API_NAME || AMPLIFY_API.apiName || "";
  const apiURL = process.env.EXPO_PUBLIC_AMPLIFY_API_URL || AMPLIFY_API.apiURL || "";

  const region =
    process.env.EXPO_PUBLIC_AWS_REGION ||
    AMPLIFY_API.region ||
    (userPoolId.includes("_") ? userPoolId.split("_")[0] : "");

  return {
    region,
    userPoolId,
    userPoolClientId,
    identityPoolId,
    apiName,
    apiURL,
  };
}

export function validateAmplifyConfig(cfg) {
  const missing = [];
  if (!cfg.userPoolId) missing.push("EXPO_PUBLIC_COGNITO_USER_POOL_ID");
  if (!cfg.userPoolClientId) missing.push("EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT_ID");
  // identityPoolId is optional for basic auth flows
  if (!cfg.region) missing.push("EXPO_PUBLIC_AWS_REGION (or derive from user pool id)");
  if (!cfg.apiName) missing.push("EXPO_PUBLIC_AMPLIFY_API_NAME");
  if (!cfg.apiURL) missing.push("EXPO_PUBLIC_AMPLIFY_API_URL");
  return missing;
}

