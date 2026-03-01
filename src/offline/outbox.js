import { Q } from "@nozbe/watermelondb";

import { database } from "../db/database";

export const OUTBOX_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  FAILED: "failed",
};

export const OUTBOX_TYPE = {
  MARK_VOTED: "MARK_VOTED",
  ADD_PARTY_VOTE: "ADD_PARTY_VOTE",
  WHITE_VOTE: "WHITE_VOTE",
};

export async function enqueueOutboxItem({ type, payload }) {
  const collection = database.collections.get("outbox");
  const now = Date.now();
  let createdId = null;
  await database.write(async () => {
    const rec = await collection.create((r) => {
      r.type = type;
      r.status = OUTBOX_STATUS.PENDING;
      r.payload = payload || {};
      r.retryCount = 0;
      r.lastError = null;
      r.createdAt = now;
      r.updatedAt = now;
    });
    createdId = rec.id;
  });
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[outbox] enqueued:", { id: createdId, type, payload });
  }
  return createdId;
}

export async function getPendingOutboxItems({ limit = 25 } = {}) {
  const collection = database.collections.get("outbox");
  const rows = await collection
    .query(Q.where("status", OUTBOX_STATUS.PENDING), Q.sortBy("created_at", Q.asc), Q.take(limit))
    .fetch();
  return rows;
}

export async function markOutboxProcessing(item) {
  const now = Date.now();
  await database.write(async () => {
    await item.update((r) => {
      r.status = OUTBOX_STATUS.PROCESSING;
      r.updatedAt = now;
    });
  });
}

export async function markOutboxFailed(item, errorMessage) {
  const now = Date.now();
  await database.write(async () => {
    await item.update((r) => {
      r.status = OUTBOX_STATUS.FAILED;
      r.retryCount = (r.retryCount || 0) + 1;
      r.lastError = String(errorMessage || "Unknown error");
      r.updatedAt = now;
    });
  });
}

export async function resetFailedToPending() {
  // Optional helper: lets you retry failed queue items after a manual action
  const collection = database.collections.get("outbox");
  const rows = await collection.query(Q.where("status", OUTBOX_STATUS.FAILED)).fetch();
  const now = Date.now();
  await database.write(async () => {
    await database.batch(
      ...rows.map((item) =>
        item.prepareUpdate((r) => {
          r.status = OUTBOX_STATUS.PENDING;
          r.updatedAt = now;
        })
      )
    );
  });
}

export async function resetStuckProcessingToPending({ olderThanMs = 2 * 60 * 1000 } = {}) {
  // If the app/phone is killed while processing, items can be stuck in PROCESSING forever.
  // We reset any PROCESSING items that haven't been updated recently back to PENDING.
  const collection = database.collections.get("outbox");
  const cutoff = Date.now() - Math.max(0, olderThanMs);
  const rows = await collection
    .query(Q.where("status", OUTBOX_STATUS.PROCESSING), Q.where("updated_at", Q.lt(cutoff)))
    .fetch();
  if (!rows.length) return 0;

  const now = Date.now();
  await database.write(async () => {
    await database.batch(
      ...rows.map((item) =>
        item.prepareUpdate((r) => {
          r.status = OUTBOX_STATUS.PENDING;
          r.updatedAt = now;
        })
      )
    );
  });
  return rows.length;
}

export async function removeOutboxItem(item) {
  await database.write(async () => {
    await item.destroyPermanently();
  });
}

