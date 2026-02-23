import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  confirmSignIn,
  signIn,
  signOut,
} from "aws-amplify/auth";

import { ensureAmplifyConfigured } from "./amplifySetup";
import { AuthContext } from "./AuthContext";
import { resetReduxState } from "../redux/store";
import { ROLES } from "../constants/roles";
import { PERMISSIONS } from "../constants/permissions";
import { getUserByEmail } from "../api/users";

const initialState = {
  status: "loading", // loading | authenticated | unauthenticated
  user: null,
  tokens: null,
  configMissing: [],
  challenge: null, // { name: 'NEW_PASSWORD_REQUIRED', username?: string } | null
  error: null, // string | null (displayable auth error)
};

function reducer(state, action) {
  switch (action.type) {
    case "CONFIG":
      return { ...state, configMissing: action.payload.missing };
    case "INITIAL":
      return {
        ...state,
        status: action.payload.user ? "authenticated" : "unauthenticated",
        user: action.payload.user,
        tokens: action.payload.tokens ?? null,
      };
    case "LOGOUT":
      return {
        ...state,
        status: "unauthenticated",
        user: null,
        tokens: null,
        challenge: null,
        error: null,
      };
    case "SET_CHALLENGE":
      return { ...state, challenge: action.payload };
    case "CLEAR_CHALLENGE":
      return { ...state, challenge: null };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

function toUserModel(attributes) {
  if (!attributes) return null;
  const given = attributes.given_name || attributes.givenName || "";
  const family = attributes.family_name || attributes.familyName || "";
  const displayName = `${given} ${family}`.trim();

  const role = attributes["custom:role"] || null;
  const parsedPermissions = (() => {
    const raw = attributes["custom:permissions"];
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  // Match ElectionDashboard default representative permissions behavior.
  const permissions =
    parsedPermissions.length > 0
      ? parsedPermissions
      : role === ROLES.REPRESENTATIVE
        ? [
            PERMISSIONS.VIEW_VOTERS,
            PERMISSIONS.VIEW_VOTER_DETAILS,
            PERMISSIONS.EDIT_VOTERS,
            PERMISSIONS.UPDATE_VOTERS,
            PERMISSIONS.VOTING_INFO_ADD_OR_UPDATE,
            PERMISSIONS.VIEW_PARTIES,
          ]
        : [];

  return {
    id: attributes.sub,
    customUserId: attributes["custom:custom_user_id"] || null,
    email: attributes.email,
    givenName: given,
    familyName: family,
    displayName: displayName || attributes.email || "User",
    role,
    permissions,
  };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const forceLogoutWithError = useCallback(async (message) => {
    try {
      await signOut();
    } catch (e) {
      // ignore
    }
    try {
      resetReduxState();
    } catch (e) {
      // ignore
    }
    dispatch({ type: "SET_ERROR", payload: message });
    dispatch({ type: "LOGOUT" });
  }, []);

  const initialize = useCallback(async () => {
    const { configured, missing } = ensureAmplifyConfigured();
    dispatch({ type: "CONFIG", payload: { missing } });
    dispatch({ type: "CLEAR_ERROR" });

    if (!configured) {
      dispatch({ type: "INITIAL", payload: { user: null, tokens: null } });
      return;
    }

    try {
      await getCurrentUser();
      const attributes = await fetchUserAttributes();

      // Representative-only application: prevent non-representatives from staying signed in.
      const role = attributes["custom:role"] || null;
      if (role !== ROLES.REPRESENTATIVE) {
        await forceLogoutWithError("Only representatives can use this application.");
        return;
      }

      // Main project also fetches server-side user record via /users/email
      let serverUser = null;
      try {
        serverUser = await getUserByEmail();
      } catch (e) {
        // non-fatal; still allow login with Cognito attributes
      }

      const session = await fetchAuthSession();
      const tokens = session.tokens ?? null;

      const baseUser = toUserModel(attributes);
      const mergedUser = {
        ...baseUser,
        serverUser,
        // Prefer server name if provided
        displayName: baseUser.displayName || serverUser?.name || serverUser?.email || baseUser.email,
        phone: serverUser?.phone || null,
      };

      dispatch({
        type: "INITIAL",
        payload: { user: mergedUser, tokens },
      });
    } catch (e) {
      dispatch({ type: "INITIAL", payload: { user: null, tokens: null } });
    }
  }, [forceLogoutWithError]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(async ({ username, password }) => {
    try {
      dispatch({ type: "CLEAR_ERROR" });
      const { configured, missing } = ensureAmplifyConfigured();
      dispatch({ type: "CONFIG", payload: { missing } });
      if (!configured) {
        throw new Error(`Amplify not configured. Missing: ${missing.join(", ")}`);
      }

      const res = await signIn({ username, password });

      // Handle “next steps”.
      const step = res?.nextStep?.signInStep;
      if (step && step !== "DONE") {
        // Cognito first-login flow: user must set a new password.
        if (
          step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED" ||
          step === "NEW_PASSWORD_REQUIRED"
        ) {
          dispatch({
            type: "SET_CHALLENGE",
            payload: { name: "NEW_PASSWORD_REQUIRED", username },
          });
          return res;
        }

        throw new Error(`Additional sign-in step required: ${step}`);
      }

      // Refresh local state after successful sign in
      await initialize();

      // If initialize logged the user out due to role mismatch, throw a helpful error
      // so UI shows a message immediately.
      // (state won't update synchronously here, so we rely on role check again)
      const attrs = await fetchUserAttributes();
      const role = attrs["custom:role"] || null;
      if (role !== ROLES.REPRESENTATIVE) {
        await forceLogoutWithError("Only representatives can use this application.");
        throw new Error("Only representatives can use this application.");
      }

      return res;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: e?.message || "Login failed" });
      throw e;
    }
  }, [initialize, forceLogoutWithError]);

  const completeNewPassword = useCallback(
    async ({ newPassword }) => {
      try {
        dispatch({ type: "CLEAR_ERROR" });
        const { configured, missing } = ensureAmplifyConfigured();
        dispatch({ type: "CONFIG", payload: { missing } });
        if (!configured) {
          throw new Error(`Amplify not configured. Missing: ${missing.join(", ")}`);
        }

        // Amplify keeps the pending challenge internally after signIn().
        await confirmSignIn({ challengeResponse: newPassword });

        dispatch({ type: "CLEAR_CHALLENGE" });
        await initialize();

        const attrs = await fetchUserAttributes();
        const role = attrs["custom:role"] || null;
        if (role !== ROLES.REPRESENTATIVE) {
          await forceLogoutWithError("Only representatives can use this application.");
          throw new Error("Only representatives can use this application.");
        }
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e?.message || "Failed to set new password" });
        throw e;
      }
    },
    [initialize, forceLogoutWithError]
  );

  const clearChallenge = useCallback(() => {
    dispatch({ type: "CLEAR_CHALLENGE" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } finally {
      try {
        resetReduxState();
      } catch (e) {
        // ignore (e.g. store not ready)
      }
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      tokens: state.tokens,
      configMissing: state.configMissing,
      challenge: state.challenge,
      error: state.error,
      login,
      logout,
      refresh: initialize,
      completeNewPassword,
      clearChallenge,
      clearError,
    }),
    [
      state.status,
      state.user,
      state.tokens,
      state.configMissing,
      state.challenge,
      state.error,
      login,
      logout,
      initialize,
      completeNewPassword,
      clearChallenge,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

