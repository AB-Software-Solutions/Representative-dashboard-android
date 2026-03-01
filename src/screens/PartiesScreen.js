import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  DataTable,
  Dialog,
  Portal,
  Searchbar,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../auth/useAuth";
import { PERMISSIONS } from "../constants/permissions";
import { createAsyncVotingInfo, createAsyncWhiteVote, fetchAsyncParties } from "../redux/features/parties/partiesSlice";

const cellLeft = { justifyContent: "flex-start" };
const textLeft = { textAlign: "left" };
const col = (minWidth, flexGrow = 1) => ({
  ...cellLeft,
  minWidth,
  flexBasis: minWidth,
  flexGrow,
  flexShrink: 0,
  paddingHorizontal: 12,
});
const TABLE_MIN_HEIGHT = 360;
const TABLE_MIN_WIDTH = 430;

function partyName(p) {
  return p?.name || p?.title || p?.id || "Party";
}

export default function PartiesScreen() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const theme = useTheme();

  const {
    list,
    status,
    error,
    createVoteStatus,
    createVoteError,
    lastCreatedVote,
    createWhiteVoteStatus,
    createWhiteVoteError,
    lastCreatedWhiteVote,
  } = useSelector((s) => s.parties);

  const canView = user?.permissions?.includes(PERMISSIONS.VIEW_PARTIES);
  const loading = status === "loading";

  const [query, setQuery] = useState("");
  const [voteOpen, setVoteOpen] = useState(false);
  const [activeParty, setActiveParty] = useState(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [snack, setSnack] = useState("");
  const [whiteVoteConfirmOpen, setWhiteVoteConfirmOpen] = useState(false);
  const [page, setPage] = useState(0); // DataTable.Pagination is 0-based
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    if (!canView) return;
    dispatch(fetchAsyncParties());
  }, [dispatch, canView]);

  useEffect(() => {
    if (createVoteStatus === "succeeded") {
      setSnack(
        lastCreatedVote?.queued
          ? "Offline: action queued. It will sync automatically when you're online."
          : "Successfully Added Vote Party Voted Count"
      );
      // Refresh list after online mutation (no local DB upsert)
      if (!lastCreatedVote?.queued) dispatch(fetchAsyncParties());
      setVoteOpen(false);
      setActiveParty(null);
      setSelectedMemberId(null);
      setMemberQuery("");
    }
    if (createVoteStatus === "failed") {
      setSnack(createVoteError || "Action failed");
    }
  }, [createVoteStatus, createVoteError, lastCreatedVote]);

  useEffect(() => {
    if (createWhiteVoteStatus === "succeeded") {
      setSnack(
        lastCreatedWhiteVote?.queued
          ? "Offline: action queued. It will sync automatically when you're online."
          : "Successfully Added White Vote"
      );
      // Refresh list after online mutation (no local DB upsert)
      if (!lastCreatedWhiteVote?.queued) dispatch(fetchAsyncParties());
      setWhiteVoteConfirmOpen(false);
    }
    if (createWhiteVoteStatus === "failed") {
      setSnack(createWhiteVoteError || "Action failed");
    }
  }, [createWhiteVoteStatus, createWhiteVoteError, lastCreatedWhiteVote]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list || [];
    return (list || []).filter((p) => partyName(p).toLowerCase().includes(q));
  }, [list, query]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filtered.slice(start, end);
  }, [filtered, page, rowsPerPage]);

  const activeMembers = useMemo(() => {
    const members = activeParty?.members;
    const arr = Array.isArray(members) ? members : [];
    const q = memberQuery.trim().toLowerCase();
    if (!q) return arr;
    return arr.filter((m) => String(m?.name || m?.fullName || m?.id || "").toLowerCase().includes(q));
  }, [activeParty, memberQuery]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Text variant="headlineMedium">Parties</Text>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => {
              setWhiteVoteConfirmOpen(true);
            }}
          >
            Add a White Vote
          </Button>
        </View>
        {!canView ? (
          <Text style={{ color: "red" }}>
            Missing permission: {PERMISSIONS.VIEW_PARTIES}
          </Text>
        ) : null}
        {error ? <Text style={{ color: "red" }}>{String(error)}</Text> : null}
        <Searchbar placeholder="Search Parties" value={query} onChangeText={setQuery} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} nestedScrollEnabled>
        <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1 }}>
          <View style={{ position: "relative", minHeight: TABLE_MIN_HEIGHT, minWidth: TABLE_MIN_WIDTH, width: "100%" }}>
            <DataTable style={{ width: "100%" }}>
              <DataTable.Header>
                <DataTable.Title style={col(260)} textStyle={textLeft}>
                  Name
                </DataTable.Title>
                <DataTable.Title style={col(170, 0)} textStyle={textLeft}>
                  Actions
                </DataTable.Title>
              </DataTable.Header>

              {!loading
                ? (canView ? paged : []).map((p, idx) => (
                    <DataTable.Row key={String(p?.id || p?._id || idx)}>
                      <DataTable.Cell style={col(260)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {partyName(p)}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(170, 0)}>
                        <Button
                          compact
                          mode="outlined"
                          onPress={() => {
                            setActiveParty(p);
                            setSelectedMemberId(null);
                            setMemberQuery("");
                            setVoteOpen(true);
                          }}
                        >
                          Add Vote
                        </Button>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))
                : null}
            </DataTable>

            {loading ? (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.dark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
                }}
              >
                <ActivityIndicator />
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <DataTable.Pagination
            page={page}
            numberOfPages={totalPages}
            onPageChange={setPage}
            label={`${totalItems === 0 ? 0 : page * rowsPerPage + 1}-${Math.min(
              (page + 1) * rowsPerPage,
              totalItems
            )} of ${totalItems}`}
            numberOfItemsPerPage={rowsPerPage}
            onItemsPerPageChange={(n) => {
              setRowsPerPage(n);
              setPage(0);
            }}
            showFastPaginationControls
            selectPageDropdownLabel={"Rows per page"}
          />
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={voteOpen} onDismiss={() => setVoteOpen(false)} style={{ maxWidth: 640, alignSelf: "center" }}>
          <Dialog.Title>Add voter voting info</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 8 }}>
              Party: <Text style={{ fontWeight: "700" }}>{partyName(activeParty)}</Text>
            </Text>

            <Searchbar placeholder="Search options..." value={memberQuery} onChangeText={setMemberQuery} />

            <View style={{ marginTop: 12, maxHeight: 260 }}>
              <ScrollView>
                {activeMembers.length === 0 ? (
                  <Text style={{ paddingVertical: 12 }}>No members available for this party.</Text>
                ) : (
                  activeMembers.map((m, idx) => {
                    const id = m?.id || m?._id || String(idx);
                    const label = m?.name || m?.fullName || m?.email || id;
                    const selected = selectedMemberId === id;
                    return (
                      <Button
                        key={String(id)}
                        mode={selected ? "contained" : "outlined"}
                        style={{ marginBottom: 8, alignSelf: "flex-start" }}
                        onPress={() => setSelectedMemberId(id)}
                      >
                        {label}
                      </Button>
                    );
                  })
                )}
              </ScrollView>
            </View>

            {createVoteError ? <Text style={{ color: "red", marginTop: 8 }}>{String(createVoteError)}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVoteOpen(false)}>Cancel</Button>
            <Button
              loading={createVoteStatus === "loading"}
              disabled={!activeParty?.id || !selectedMemberId || createVoteStatus === "loading"}
              onPress={() => {
                dispatch(
                  createAsyncVotingInfo({
                    politicalAffiliationId: activeParty?.id || activeParty?._id,
                    memberId: selectedMemberId,
                  })
                );
              }}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={whiteVoteConfirmOpen}
          onDismiss={() => setWhiteVoteConfirmOpen(false)}
          style={{ maxWidth: 520, alignSelf: "center" }}
        >
          <Dialog.Title>Add White Vote</Dialog.Title>
          <Dialog.Content>
            <Text>
              White vote doesn't have any member or party. Are you sure you want to add a white vote?
            </Text>
            {createWhiteVoteError ? (
              <Text style={{ color: "red", marginTop: 8 }}>{String(createWhiteVoteError)}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setWhiteVoteConfirmOpen(false)} disabled={createWhiteVoteStatus === "loading"}>
              Cancel
            </Button>
            <Button
              mode="contained"
              loading={createWhiteVoteStatus === "loading"}
              disabled={createWhiteVoteStatus === "loading"}
              onPress={() => dispatch(createAsyncWhiteVote())}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={2500}>
          {snack}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
}

