import { Q } from "@nozbe/watermelondb";

function nowMs() {
  return Date.now();
}

function safeId(x) {
  if (x === undefined || x === null) return null;
  const s = String(x);
  return s ? s : null;
}

function isPlainObject(v) {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

// Normalize backend payload variants into what the UI expects (especially for offline reads).
function normalizeVoterRaw(v) {
  if (!isPlainObject(v)) return v || null;
  const out = { ...v };

  // API sometimes uses `governate` but UI expects `governorate`
  if ((out.governorate === undefined || out.governorate === null) && out.governate !== undefined) out.governorate = out.governate;
  if ((out.governorateId === undefined || out.governorateId === null) && out.governateId !== undefined) out.governorateId = out.governateId;

  return out;
}

function normalizePartyRaw(p) {
  if (!isPlainObject(p)) return p || null;
  const out = { ...p };
  // Some APIs use `title`; UI uses `name`
  if (out.name === undefined && out.title !== undefined) out.name = out.title;
  // Ensure members is always an array so offline UI doesn't think it's "missing"
  if (!Array.isArray(out.members)) out.members = [];
  return out;
}

function voterToRow(v) {
  const id = safeId(v?.id ?? v?._id);
  if (!id) return null;
  return {
    id,
    name: String(v?.name ?? v?.fullName ?? "").trim() || null,
    recordNumber: v?.recordNumber !== undefined && v?.recordNumber !== null ? String(v.recordNumber) : null,
    hasVoted: Boolean(v?.hasVoted ?? v?.voted ?? v?.isVoted ?? v?.voteConfirmed ?? v?.has_vote ?? v?.has_vote_confirmed),
    raw: normalizeVoterRaw(v),
    updatedAt: nowMs(),
  };
}

function partyToRow(p) {
  const id = safeId(p?.id ?? p?._id);
  if (!id) return null;
  return {
    id,
    name: String(p?.name ?? p?.title ?? "").trim() || null,
    raw: normalizePartyRaw(p),
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
    return normalizeVoterRaw(record?.raw || null);
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

  const voters = rows.map((r) =>
    normalizeVoterRaw(
      r.raw || { id: r.id, name: r.name, recordNumber: r.recordNumber, hasVoted: r.hasVoted, pendingVote: r.pendingVote }
    )
  );
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[cache] voters", { page, limit, total, returned: voters.length, filters: { name, recordNumber } });
  }
  return { voters, total };
}

export async function queryCachedParties(database) {
  const collection = database.collections.get("parties");
  const rows = await collection.query(Q.sortBy("name", Q.asc)).fetch();
  const parties = rows.map((r) =>
    normalizePartyRaw(r.raw || { id: r.id, name: r.name, members: [] })
  );
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("[cache] parties", { total: parties.length });
  }
  return parties;
}

export async function getCachedPartyById(database, partyId) {
  const id = safeId(partyId);
  if (!id) return null;
  const collection = database.collections.get("parties");
  try {
    const record = await collection.find(id);
    return normalizePartyRaw(record?.raw || null);
  } catch {
    return null;
  }
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
        // IMPORTANT: never overwrite a fully-hydrated `raw` object with a partial API response.
        // Merge shallowly to preserve relation fields already cached.
        if (raw !== undefined) {
          const nextRaw = normalizeVoterRaw(raw);
          const prevRaw = rec.raw;
          if (isPlainObject(prevRaw) && isPlainObject(nextRaw)) {
            rec.raw = { ...prevRaw, ...nextRaw };
          } else {
            rec.raw = nextRaw;
          }
        }
        rec.updatedAt = nowMs();
      });
    });
    return true;
  } catch {
    return false;
  }
}
