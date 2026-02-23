import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Button,
  Chip,
  DataTable,
  Searchbar,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { useAuth } from "../auth/useAuth";
import { fetchAsyncMyVoters, markAsyncVoterVoted } from "../redux/features/representative/representativeSlice";
import { PERMISSIONS } from "../constants/permissions";

const cellLeft = { justifyContent: "flex-start" };
const textLeft = { textAlign: "left" };

const col = (minWidth, flexGrow = 1) => ({
  ...cellLeft,
  minWidth,
  flexBasis: minWidth,
  flexGrow,
  flexShrink: 0,
  paddingHorizontal: 12, // visual spacing between columns
});
const SEARCH_DEBOUNCE_MS = 350;
const TABLE_MIN_HEIGHT = 360;
const TABLE_MIN_WIDTH = 1530;

export default function MyVotersScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const theme = useTheme();

  const { myVoters, total, status, error, markVoteStatus } = useSelector(
    (s) => s.representative
  );
  const markVoteError = useSelector((s) => s.representative.markVoteError);

  const canView = user?.permissions?.includes(PERMISSIONS.VIEW_VOTERS);
  const canMarkVoted = user?.permissions?.includes(PERMISSIONS.VOTING_INFO_ADD_OR_UPDATE);

  // Inputs (debounced -> appliedFilters -> API call)
  const [nameQuery, setNameQuery] = useState("");
  const [recordNumberQuery, setRecordNumberQuery] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ name: "", recordNumber: "" });
  const [page, setPage] = useState(0); // DataTable.Pagination is 0-based
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [snack, setSnack] = useState("");

  const loading = status === "loading";
  const canLoad = useMemo(() => true, []);

  // Debounce input changes into applied filters, then reset to first page.
  useEffect(() => {
    if (!canView) return;
    const t = setTimeout(() => {
      setAppliedFilters({
        name: nameQuery.trim(),
        recordNumber: recordNumberQuery.trim(),
      });
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [canView, nameQuery, recordNumberQuery]);

  // Fetch whenever page/rowsPerPage/appliedFilters change.
  useEffect(() => {
    if (!canLoad || !canView) return;
    dispatch(fetchAsyncMyVoters({ page: page + 1, limit: rowsPerPage, filters: appliedFilters }));
  }, [dispatch, canLoad, canView, page, rowsPerPage, appliedFilters]);

  useEffect(() => {
    if (markVoteStatus === "succeeded") {
      setSnack("Successfully Added Voter's Voted Confirmation.");
      // Re-fetch current page so the list reflects server truth after mutation.
      if (canView) dispatch(fetchAsyncMyVoters({ page: page + 1, limit: rowsPerPage, filters: appliedFilters }));
    }
    if (markVoteStatus === "failed") setSnack(markVoteError || "Action failed");
  }, [markVoteStatus, markVoteError, dispatch, canView, page, rowsPerPage, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil((total || myVoters.length || 0) / rowsPerPage));
  const totalItems = total || myVoters.length || 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Text variant="headlineMedium">Voters</Text>
          <Chip icon="account-check" style={{ alignSelf: "flex-start" }}>
            my voters {total || 0}
          </Chip>
        </View>

        {!canView ? (
          <Text style={{ color: "red" }}>Missing permission: {PERMISSIONS.VIEW_VOTERS}</Text>
        ) : null}
        {error ? <Text style={{ color: "red" }}>{String(error)}</Text> : null}

        <View style={{ gap: 12 }}>
          <Searchbar placeholder="Search by Name..." value={nameQuery} onChangeText={setNameQuery} />
          <Searchbar
            placeholder="Search by Record Number..."
            value={recordNumberQuery}
            onChangeText={setRecordNumberQuery}
            keyboardType="numeric"
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} nestedScrollEnabled>
        <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 16, flexGrow: 1 }}>
          <View style={{ position: "relative", minHeight: TABLE_MIN_HEIGHT, minWidth: TABLE_MIN_WIDTH, width: "100%" }}>
            <DataTable style={{ width: "100%" }}>
              <DataTable.Header>
                <DataTable.Title style={col(170)} textStyle={textLeft}>
                  Name
                </DataTable.Title>
                <DataTable.Title style={col(170)} textStyle={textLeft}>
                  Father
                </DataTable.Title>
                <DataTable.Title style={col(170)} textStyle={textLeft}>
                  Family
                </DataTable.Title>
                <DataTable.Title style={col(170)} textStyle={textLeft}>
                  Mother
                </DataTable.Title>
                <DataTable.Title style={col(110, 0)} textStyle={textLeft}>
                  Record No
                </DataTable.Title>
                <DataTable.Title style={col(130, 0)} textStyle={textLeft}>
                  Date of Birth
                </DataTable.Title>
                <DataTable.Title style={col(110, 0)} textStyle={textLeft}>
                  Gender
                </DataTable.Title>
                <DataTable.Title style={col(170)} textStyle={textLeft}>
                  Record Religion
                </DataTable.Title>
                <DataTable.Title style={col(170)} textStyle={textLeft}>
                  Record Area
                </DataTable.Title>
                <DataTable.Title style={col(160, 0)} textStyle={textLeft}>
                  Actions
                </DataTable.Title>
              </DataTable.Header>

              {!loading
                ? (canView ? myVoters : []).map((v, idx) => (
                    <DataTable.Row key={String(v?.id || idx)}>
                      <DataTable.Cell style={col(170)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.name ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(170)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.fatherName ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(170)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.familyName ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(170)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.motherName ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(110, 0)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.recordNumber ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(130, 0)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.dateOfBirth ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(110, 0)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.gender ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(170)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.recordReligion?.name ?? v?.recordReligion ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(170)} textStyle={textLeft}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={textLeft}>
                          {v?.recordArea?.name ?? v?.recordArea ?? "N/A"}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={col(160, 0)}>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          <Button
                            compact
                            mode="outlined"
                            onPress={() => navigation.navigate("VoterProfile", { voterId: v?.id })}
                          >
                            View
                          </Button>
                          <Button
                            compact
                            mode="outlined"
                            disabled={!canMarkVoted || markVoteStatus === "loading"}
                            onPress={() => dispatch(markAsyncVoterVoted({ voterId: v?.id }))}
                          >
                            Add
                          </Button>
                        </View>
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

      <Snackbar visible={!!snack} onDismiss={() => setSnack("")} duration={2500}>
        {snack}
      </Snackbar>
    </SafeAreaView>
  );
}

