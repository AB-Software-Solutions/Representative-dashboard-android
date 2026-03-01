import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import NetInfo from "@react-native-community/netinfo";

import {
  fetchRepresentativeProfile,
  fetchRepresentativeVoters,
  fetchVoterById,
  markVoterVoted,
} from "../../../api/representative";
import { database } from "../../../db/database";
import {
  getCachedVoterById,
  queryCachedVoters,
  setVoterPendingVote,
  updateVoterVoteState,
} from "../../../db/helpers";
import { enqueueOutboxItem, OUTBOX_TYPE } from "../../../offline/outbox";

export const fetchAsyncMyVoters = createAsyncThunk(
  "representative/fetchMyVoters",
  async ({ page = 1, limit = 20, filters = {} } = {}, { rejectWithValue }) => {
    try {
      const net = await NetInfo.fetch();
      const online = Boolean(net?.isConnected && net?.isInternetReachable !== false);
      if (!online) {
        const cached = await queryCachedVoters(database, { page, limit, filters });
        return { data: { voters: cached.voters, total: cached.total, fromCache: true }, page, limit, fromCache: true };
      }

      const data = await fetchRepresentativeVoters({ page, limit, ...filters });

      const voters = data?.voters || data?.data || (Array.isArray(data) ? data : []);

      return { data, page, limit, fromCache: false };
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to fetch my voters");
    }
  }
);

export const markAsyncVoterVoted = createAsyncThunk(
  "representative/markVoterVoted",
  async ({ voterId }, { rejectWithValue }) => {
    try {
      const net = await NetInfo.fetch();
      const online = Boolean(net?.isConnected && net?.isInternetReachable !== false);
      if (!online) {
        await enqueueOutboxItem({ type: OUTBOX_TYPE.MARK_VOTED, payload: { voterId } });
        await setVoterPendingVote(database, voterId, true);
        return { queued: true, voterId };
      }

      const data = await markVoterVoted({ voterId });
      // Do not upsert full datasets after login hydration; only update minimal state.
      await updateVoterVoteState(database, voterId, { hasVoted: true, pendingVote: false, raw: data });
      await setVoterPendingVote(database, voterId, false);
      return data;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to mark voter as voted");
    }
  }
);

export const fetchAsyncRepresentativeProfile = createAsyncThunk(
  "representative/fetchProfile",
  async ({ representativeId }, { rejectWithValue }) => {
    try {
      const data = await fetchRepresentativeProfile({ representativeId });
      return data;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to fetch representative profile");
    }
  }
);

export const fetchAsyncVoterById = createAsyncThunk(
  "representative/fetchVoterById",
  async ({ voterId }, { rejectWithValue }) => {
    try {
      const net = await NetInfo.fetch();
      const online = Boolean(net?.isConnected && net?.isInternetReachable !== false);
      if (!online) {
        const cached = await getCachedVoterById(database, voterId);
        if (cached) return cached;
        return rejectWithValue("Offline and voter not in cache yet");
      }

      const data = await fetchVoterById({ voterId });
      return data;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to fetch voter");
    }
  }
);

const initialState = {
  profile: null,
  profileStatus: "idle",
  profileError: null,
  myVoters: [],
  total: 0,
  page: 1,
  limit: 20,
  status: "idle",
  error: null,
  markVoteStatus: "idle",
  markVoteError: null,
  lastMarkVoteResult: null,
  voter: null,
  voterStatus: "idle",
  voterError: null,
  raw: null,
};

const representativeSlice = createSlice({
  name: "representative",
  initialState,
  reducers: {
    clearMyVoters: (state) => {
      state.myVoters = [];
      state.total = 0;
      state.status = "idle";
      state.error = null;
      state.raw = null;
    },
    applySyncedVoterUpdate: (state, action) => {
      const voterId = action.payload?.voterId;
      const updated = action.payload?.updated;
      if (!voterId || !updated) return;
      const idx = state.myVoters.findIndex((v) => v?.id === voterId || v?.id === updated?.id);
      if (idx !== -1) {
        state.myVoters[idx] = { ...(state.myVoters[idx] || {}), ...(updated || {}), pendingVote: false };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAsyncRepresentativeProfile.pending, (state) => {
        state.profileStatus = "loading";
        state.profileError = null;
      })
      .addCase(fetchAsyncRepresentativeProfile.fulfilled, (state, action) => {
        state.profileStatus = "succeeded";
        state.profile = action.payload;
      })
      .addCase(fetchAsyncRepresentativeProfile.rejected, (state, action) => {
        state.profileStatus = "failed";
        state.profileError = action.payload || action.error?.message || "Failed to fetch profile";
      })
      .addCase(fetchAsyncMyVoters.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAsyncMyVoters.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.raw = action.payload.data;

        const payload = action.payload.data;
        if (payload?.voters && Array.isArray(payload.voters)) {
          state.myVoters = payload.voters;
          state.total = payload.total ?? payload.totalCount ?? payload.voters.length;
        } else if (payload?.data && Array.isArray(payload.data)) {
          state.myVoters = payload.data;
          state.total = payload.total ?? payload.totalCount ?? payload.data.length;
        } else if (Array.isArray(payload)) {
          state.myVoters = payload;
          state.total = payload.length;
        } else {
          state.myVoters = [];
          state.total = 0;
        }
      })
      .addCase(fetchAsyncMyVoters.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message || "Failed to fetch voters";
      })
      .addCase(markAsyncVoterVoted.pending, (state) => {
        state.markVoteStatus = "loading";
        state.markVoteError = null;
        state.lastMarkVoteResult = null;
      })
      .addCase(markAsyncVoterVoted.fulfilled, (state, action) => {
        state.markVoteStatus = "succeeded";
        const updated = action.payload;
        const voterId = action.meta?.arg?.voterId;
        state.lastMarkVoteResult = updated;

        if (updated?.queued) {
          const idxQueued = state.myVoters.findIndex((v) => v?.id === voterId);
          if (idxQueued !== -1) state.myVoters[idxQueued] = { ...(state.myVoters[idxQueued] || {}), pendingVote: true };
          return;
        }
        const idx = state.myVoters.findIndex((v) => v?.id === (updated?.id ?? voterId));
        if (idx !== -1) {
          // Merge so we don't accidentally lose fields if the API returns a partial payload.
          state.myVoters[idx] = { ...(state.myVoters[idx] || {}), ...(updated || {}), pendingVote: false, id: state.myVoters[idx]?.id ?? voterId };
        }
      })
      .addCase(markAsyncVoterVoted.rejected, (state, action) => {
        state.markVoteStatus = "failed";
        state.markVoteError = action.payload || action.error?.message || "Failed to mark voted";
      })
      .addCase(fetchAsyncVoterById.pending, (state) => {
        state.voterStatus = "loading";
        state.voterError = null;
      })
      .addCase(fetchAsyncVoterById.fulfilled, (state, action) => {
        state.voterStatus = "succeeded";
        state.voter = action.payload;
      })
      .addCase(fetchAsyncVoterById.rejected, (state, action) => {
        state.voterStatus = "failed";
        state.voterError = action.payload || action.error?.message || "Failed to fetch voter";
      });
  },
});

export const { clearMyVoters, applySyncedVoterUpdate } = representativeSlice.actions;
export default representativeSlice.reducer;

