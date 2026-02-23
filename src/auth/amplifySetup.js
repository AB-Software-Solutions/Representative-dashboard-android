import { Amplify } from "aws-amplify";

import { getAmplifyEnvConfig, validateAmplifyConfig } from "./amplifyConfig";

let configured = false;

export function ensureAmplifyConfigured() {
  if (configured) return { configured: true, missing: [] };

  const cfg = getAmplifyEnvConfig();
  const missing = validateAmplifyConfig(cfg);

  if (missing.length > 0) {
    // Don't hard-crash the app; we can show a helpful message on the login screen.
    console.warn(
      `[auth] Amplify is not configured. Missing env vars: ${missing.join(", ")}`
    );
    configured = true; // prevent spamming logs during HMR
    return { configured: false, missing };
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: cfg.userPoolId,
        userPoolClientId: cfg.userPoolClientId,
        identityPoolId: cfg.identityPoolId || undefined,
      },
    },
    API: {
      REST: {
        [cfg.apiName]: {
          endpoint: cfg.apiURL,
          region: cfg.region,
        },
      },
    },
  });

  configured = true;
  return { configured: true, missing: [] };
}

