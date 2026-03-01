import { Q } from "@nozbe/watermelondb";

function nowMs() {
  return Date.now();
}

function safeId(x) {
  if (x === undefined || x === null) return null;
  const s = String(x);
  return s ? s : null;
}

function voterToRow(v) {
  const id = safeId(v?.id ?? v?._id);
  if (!id) return null;
  return {
    id,
    name: String(v?.name ?? v?.fullName ?? "").trim() || null,
    recordNumber: v?.recordNumber !== undefined && v?.recordNumber !== null ? String(v.recordNumber) : null,
    hasVoted: Boolean(v?.hasVoted ?? v?.voted ?? v?.isVoted ?? v?.voteConfirmed ?? v?.has_vote ?? v?.has_vote_confirmed),
    raw: v || null,
    updatedAt: nowMs(),
  };
}

function partyToRow(p) {
  const id = safeId(p?.id ?? p?._id);
  if (!id) return null;
  return {
    id,
    name: String(p?.name ?? p?.title ?? "").trim() || null,
    raw: p || null,
    updatedAt: nowMs(),
  };
}

export async function upsertVoters(database, voters) {
  const arr = Array.isArray(voters) ? voters : [];
  if (!arr.length) return 0;
  const collection = database.collections.get("voters");

  let count = 0;
  await database.write(async () => {
    const prepared = [];
    for (const v of arr) {
      const row = voterToRow(v);
      if (!row) continue;
      count += 1;
      let existing = null;
      try {
        existing = await collection.find(row.id);
      } catch {
        existing = null;
      }

      if (!existing) {
        prepared.push(
          collection.prepareCreate((rec) => {
            rec._raw.id = row.id;
            rec.name = row.name;
            rec.recordNumber = row.recordNumber;
            rec.hasVoted = row.hasVoted;
            rec.pendingVote = false;
            rec.raw = row.raw;
            rec.updatedAt = row.updatedAt;
          })
        );
      } else {
        prepared.push(
          existing.prepareUpdate((rec) => {
            rec.name = row.name ?? rec.name;
            rec.recordNumber = row.recordNumber ?? rec.recordNumber;
            rec.hasVoted = row.hasVoted;
            // keep pendingVote unless server truth says voted now
            if (row.hasVoted) rec.pendingVote = false;
            rec.raw = row.raw;
            rec.updatedAt = row.updatedAt;
          })
        );
      }
    }
    if (prepared.length) await database.batch(...prepared);
  });

  return count;
}

export async function upsertParties(database, parties) {
  const arr = Array.isArray(parties) ? parties : [];
  if (!arr.length) return 0;
  const collection = database.collections.get("parties");

  let count = 0;
  await database.write(async () => {
    const prepared = [];
    for (const p of arr) {
      const row = partyToRow(p);
      if (!row) continue;
      count += 1;
      let existing = null;
      try {
        existing = await collection.find(row.id);
      } catch {
        existing = null;
      }

      if (!existing) {
        prepared.push(
          collection.prepareCreate((rec) => {
            rec._raw.id = row.id;
            rec.name = row.name;
            rec.raw = row.raw;
            rec.updatedAt = row.updatedAt;
          })
        );
      } else {
        prepared.push(
          existing.prepareUpdate((rec) => {
            rec.name = row.name ?? rec.name;
            rec.raw = row.raw;
            rec.updatedAt = row.updatedAt;
          })
        );
      }
    }
    if (prepared.length) await database.batch(...prepared);
  });

  return count;
}

export async function getCachedVoterById(database, voterId) {
  const id = safeId(voterId);
  if (!id) return null;
  const collection = database.collections.get("voters");
  try {
    const record = await collection.find(id);
    return record?.raw || null;
  } catch {
    return null;
  }
}

export async function queryCachedVoters(database, { page = 1, limit = 20, filters = {} } = {}) {
  const name = String(filters?.name ?? "").trim();
  const recordNumber = String(filters?.recordNumber ?? "").trim();

  const collection = database.collections.get("voters");

  const conditions = [];
  if (name) conditions.push(Q.where("name", Q.like(`%${name}%`)));
  if (recordNumber) conditions.push(Q.where("record_number", Q.like(`%${recordNumber}%`)));

  const base = collection.query(...conditions);
  const total = await base.fetchCount();

  const offset = Math.max(0, (page - 1) * limit);
  const rows = await collection
    .query(...conditions, Q.sortBy("name", Q.asc), Q.skip(offset), Q.take(limit))
    .fetch();

  const voters = rows.map((r) => r.raw || { id: r.id, name: r.name, recordNumber: r.recordNumber, hasVoted: r.hasVoted });
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[cache] voters", { page, limit, total, returned: voters.length, filters: { name, recordNumber } });
  }
  return { voters, total };
}

export async function queryCachedParties(database) {
  const collection = database.collections.get("parties");
  const rows = await collection.query(Q.sortBy("name", Q.asc)).fetch();
  const parties = rows.map((r) => r.raw || { id: r.id, name: r.name });
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[cache] parties", { total: parties.length });
  }
  return parties;
}

export async function setVoterPendingVote(database, voterId, pending) {
  const id = safeId(voterId);
  if (!id) return false;
  const collection = database.collections.get("voters");
  try {
    await database.write(async () => {
      const record = await collection.find(id);
      await record.update((rec) => {
        rec.pendingVote = Boolean(pending);
      });
    });
    return true;
  } catch {
    return false;
  }
}

// Minimal updates only (used by vote actions/outbox sync).
// Does NOT create new records (we expect hydration-on-login to have created them).
export async function updateVoterVoteState(database, voterId, { hasVoted, pendingVote, raw } = {}) {
  const id = safeId(voterId);
  if (!id) return false;
  const collection = database.collections.get("voters");
  try {
    await database.write(async () => {
      const record = await collection.find(id);
      await record.update((rec) => {
        if (hasVoted !== undefined) rec.hasVoted = Boolean(hasVoted);
        if (pendingVote !== undefined) rec.pendingVote = Boolean(pendingVote);
        if (raw !== undefined) rec.raw = raw;
        rec.updatedAt = nowMs();
      });
    });
    return true;
  } catch {
    return false;
  }
}
