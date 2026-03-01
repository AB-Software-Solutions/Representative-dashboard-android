import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import NetInfo from "@react-native-community/netinfo";

import { createVotingInfo, createWhiteVote, fetchParties } from "../../../api/parties";
import { database } from "../../../db/database";
import { queryCachedParties } from "../../../db/helpers";
import { enqueueOutboxItem, OUTBOX_TYPE } from "../../../offline/outbox";

export const fetchAsyncParties = createAsyncThunk(
  "parties/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const net = await NetInfo.fetch();
      const online = Boolean(net?.isConnected && net?.isInternetReachable !== false);
      if (!online) {
        const cached = await queryCachedParties(database);
        return { politicalAffiliations: cached, fromCache: true };
      }

      const payload = await fetchParties();
      const parties =
        payload?.politicalAffiliations ||
        payload?.parties ||
        payload?.data ||
        (Array.isArray(payload) ? payload : []);
      return payload;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to fetch political affiliations");
    }
  }
);

export const createAsyncVotingInfo = createAsyncThunk(
  "parties/createVotingInfo",
  async ({ politicalAffiliationId, memberId }, { rejectWithValue }) => {
    try {
      const net = await NetInfo.fetch();
      const online = Boolean(net?.isConnected && net?.isInternetReachable !== false);
      if (!online) {
        await enqueueOutboxItem({
          type: OUTBOX_TYPE.ADD_PARTY_VOTE,
          payload: { politicalAffiliationId, memberId: memberId || null },
        });
        return { queued: true };
      }

      const res = await createVotingInfo({ politicalAffiliationId, memberId });
      return res;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to add voting info");
    }
  }
);

export const createAsyncWhiteVote = createAsyncThunk(
  "parties/createWhiteVote",
  async (_, { rejectWithValue }) => {
    try {
      const net = await NetInfo.fetch();
      const online = Boolean(net?.isConnected && net?.isInternetReachable !== false);
      if (!online) {
        await enqueueOutboxItem({ type: OUTBOX_TYPE.WHITE_VOTE, payload: {} });
        return { queued: true };
      }

      const res = await createWhiteVote();
      return res;
    } catch (e) {
      return rejectWithValue(e?.message || "Failed to add white vote");
    }
  }
);

const initialState = {
  list: [],
  status: "idle",
  error: null,
  createVoteStatus: "idle",
  createVoteError: null,
  lastCreatedVote: null,
  createWhiteVoteStatus: "idle",
  createWhiteVoteError: null,
  lastCreatedWhiteVote: null,
  raw: null,
};

const partiesSlice = createSlice({
  name: "parties",
  initialState,
  reducers: {
    clearParties: (state) => {
      state.list = [];
      state.status = "idle";
      state.error = null;
      state.raw = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAsyncParties.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAsyncParties.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.raw = action.payload;
        const payload = action.payload;
        if (payload?.politicalAffiliations && Array.isArray(payload.politicalAffiliations)) {
          state.list = payload.politicalAffiliations;
        } else if (payload?.parties && Array.isArray(payload.parties)) {
          state.list = payload.parties;
        } else if (payload?.data && Array.isArray(payload.data)) {
          state.list = payload.data;
        } else if (Array.isArray(payload)) {
          state.list = payload;
        } else {
          state.list = [];
        }
      })
      .addCase(fetchAsyncParties.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error?.message || "Failed to fetch parties";
      })
      .addCase(createAsyncVotingInfo.pending, (state) => {
        state.createVoteStatus = "loading";
        state.createVoteError = null;
        state.lastCreatedVote = null;
      })
      .addCase(createAsyncVotingInfo.fulfilled, (state, action) => {
        state.createVoteStatus = "succeeded";
        state.lastCreatedVote = action.payload;
      })
      .addCase(createAsyncVotingInfo.rejected, (state, action) => {
        state.createVoteStatus = "failed";
        state.createVoteError =
          action.payload || action.error?.message || "Failed to add voting info";
      })
      .addCase(createAsyncWhiteVote.pending, (state) => {
        state.createWhiteVoteStatus = "loading";
        state.createWhiteVoteError = null;
        state.lastCreatedWhiteVote = null;
      })
      .addCase(createAsyncWhiteVote.fulfilled, (state, action) => {
        state.createWhiteVoteStatus = "succeeded";
        state.lastCreatedWhiteVote = action.payload;
      })
      .addCase(createAsyncWhiteVote.rejected, (state, action) => {
        state.createWhiteVoteStatus = "failed";
        state.createWhiteVoteError =
          action.payload || action.error?.message || "Failed to add white vote";
      });
  },
});

export const { clearParties } = partiesSlice.actions;
export default partiesSlice.reducer;

