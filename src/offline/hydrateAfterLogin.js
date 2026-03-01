/* eslint-disable no-console */

import NetInfo from "@react-native-community/netinfo";

import { fetchParties } from "../api/parties";
import { fetchRepresentativeVoters } from "../api/representative";
import { database } from "../db/database";
import { upsertParties, upsertVoters } from "../db/helpers";

function isOnlineState(net) {
  return Boolean(net?.isConnected && net?.isInternetReachable !== false);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry(fn, { retries = 3, baseDelayMs = 400, factor = 2, jitter = 0.25, shouldStop } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (shouldStop?.()) throw new Error("stopped");
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt >= retries) break;
      const delay = Math.round(baseDelayMs * Math.pow(factor, attempt) * (1 + (Math.random() * 2 - 1) * jitter));
      await sleep(Math.max(0, delay));
    }
  }
  throw lastErr;
}

function extractParties(payload) {
  return (
    payload?.politicalAffiliations ||
    payload?.parties ||
    payload?.data ||
    (Array.isArray(payload) ? payload : [])
  );
}

function extractVoters(payload) {
  return payload?.voters || payload?.data || (Array.isArray(payload) ? payload : []);
}

function extractTotal(payload) {
  const t = payload?.total ?? payload?.totalCount ?? payload?.count;
  return typeof t === "number" && Number.isFinite(t) ? t : null;
}

/**
 * Fetches and stores all Parties + all "My Voters" immediately after login.
 * This is best-effort:
 * - If offline: no-op (keeps whatever is already cached)
 * - If user logs out mid-run: stops early (via shouldStop)
 */
export async function hydrateAfterLogin({
  votersPageSize = 200,
  // Safety guard only (prevents infinite loops if backend keeps returning the same page forever).
  // Set very high so we effectively fetch "all voters" for real workloads.
  maxPagesSafetyCap = 2000,
  shouldStop,
  retries = 3,
} = {}) {
  const net = await NetInfo.fetch();
  if (!isOnlineState(net)) {
    return { skipped: true, reason: "offline" };
  }

  if (__DEV__) {
    console.log("[hydrateAfterLogin] start", { votersPageSize, maxPagesSafetyCap, retries });
  }

  const res = {
    skipped: false,
    partiesUpserted: 0,
    votersUpserted: 0,
    stoppedEarly: false,
    partiesError: null,
    votersError: null,
  };

  // Parties are a single call
  if (shouldStop?.()) return { ...res, stoppedEarly: true };
  try {
    const partiesPayload = await withRetry(() => fetchParties(), { retries, shouldStop });
    const parties = extractParties(partiesPayload);
    if (Array.isArray(parties) && parties.length) {
      res.partiesUpserted = await upsertParties(database, parties);
    }
    if (__DEV__) {
      console.log("[hydrateAfterLogin] parties", { fetched: Array.isArray(parties) ? parties.length : 0, upserted: res.partiesUpserted });
    }
  } catch (e) {
    if (e?.message === "stopped") return { ...res, stoppedEarly: true };
    res.partiesError = e?.message || String(e);
    console.warn("[hydrateAfterLogin] parties hydrate failed:", e?.message || e);
  }

  // Voters may be paginated
  let page = 1;
  let expectedTotal = null;

  while (page <= maxPagesSafetyCap) {
    if (shouldStop?.()) {
      res.stoppedEarly = true;
      break;
    }
    try {
      const payload = await withRetry(
        () => fetchRepresentativeVoters({ page, limit: votersPageSize }),
        { retries, shouldStop },
      );
      const voters = extractVoters(payload);
      if (!Array.isArray(voters) || voters.length === 0) break;

      expectedTotal = expectedTotal ?? extractTotal(payload);
      res.votersUpserted += await upsertVoters(database, voters);
      if (__DEV__) {
        console.log("[hydrateAfterLogin] voters page", {
          page,
          fetched: voters.length,
          upsertedSoFar: res.votersUpserted,
          expectedTotal,
        });
      }

      // Stop if we've reached backend-reported total
      if (expectedTotal && res.votersUpserted >= expectedTotal) break;

      // If backend doesn't return total, the canonical "last page" signal is fewer results than requested.
      if (voters.length < votersPageSize) break;

      page += 1;
    } catch (e) {
      if (e?.message === "stopped") {
        res.stoppedEarly = true;
        break;
      }
      res.votersError = e?.message || String(e);
      console.warn("[hydrateAfterLogin] voters hydrate failed:", e?.message || e);
      break;
    }
  }

  if (page > maxPagesSafetyCap) {
    console.warn(
      `[hydrateAfterLogin] reached safety cap (${maxPagesSafetyCap} pages). If this is expected, increase maxPagesSafetyCap.`,
    );
  }

  if (__DEV__) {
    console.log("[hydrateAfterLogin] done", res);
  }
  return res;
}

