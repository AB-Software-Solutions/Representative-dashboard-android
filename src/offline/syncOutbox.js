import NetInfo from "@react-native-community/netinfo";

import { createVotingInfo, createWhiteVote } from "../api/parties";
import { markVoterVoted } from "../api/representative";
import { database } from "../db/database";
import { setVoterPendingVote, updateVoterVoteState } from "../db/helpers";
import {
  getPendingOutboxItems,
  markOutboxFailed,
  markOutboxProcessing,
  OUTBOX_TYPE,
  resetStuckProcessingToPending,
  removeOutboxItem,
} from "./outbox";

let flushing = false;

export async function flushOutbox({ onVoterUpdated } = {}) {
  if (flushing) return { processed: 0 };
  flushing = true;
  try {
    const net = await NetInfo.fetch();
    const online = Boolean(net?.isConnected && net?.isInternetReachable !== false);
    if (!online) return { processed: 0 };

    let processed = 0;
    // Recover from app kills/reboots mid-sync
    await resetStuckProcessingToPending({ olderThanMs: 2 * 60 * 1000 });
    const items = await getPendingOutboxItems({ limit: 25 });
    if (__DEV__ && items.length) {
      // eslint-disable-next-line no-console
      console.log("[outbox] flush start:", { pending: items.length });
    }

    for (const item of items) {
      try {
        await markOutboxProcessing(item);
        const payload = item.payload || {};
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log("[outbox] processing:", { id: item.id, type: item.type, payload });
        }

        if (item.type === OUTBOX_TYPE.MARK_VOTED) {
          const voterId = payload?.voterId;
          const updated = await markVoterVoted({ voterId });
          // Do not upsert full datasets after login hydration; only update minimal state.
          await updateVoterVoteState(database, voterId, { hasVoted: true, pendingVote: false, raw: updated });
          await setVoterPendingVote(database, voterId, false);
          if (onVoterUpdated) onVoterUpdated({ voterId, updated });
          await removeOutboxItem(item);
          processed += 1;
          continue;
        }

        if (item.type === OUTBOX_TYPE.ADD_PARTY_VOTE) {
          await createVotingInfo({
            politicalAffiliationId: payload?.politicalAffiliationId,
            memberId: payload?.memberId,
          });
          await removeOutboxItem(item);
          processed += 1;
          continue;
        }

        if (item.type === OUTBOX_TYPE.WHITE_VOTE) {
          await createWhiteVote();
          await removeOutboxItem(item);
          processed += 1;
          continue;
        }

        // Unknown type: fail and stop looping
        await markOutboxFailed(item, `Unknown outbox type: ${String(item.type)}`);
      } catch (e) {
        await markOutboxFailed(item, e?.message || String(e));
      }
    }

    if (__DEV__ && items.length) {
      // eslint-disable-next-line no-console
      console.log("[outbox] flush done:", { processed });
    }
    return { processed };
  } finally {
    flushing = false;
  }
}

