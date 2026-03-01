import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Card, Chip, Divider, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { fetchAsyncVoterById } from "../redux/features/representative/representativeSlice";
import { database } from "../db/database";
import { getCachedPartyById } from "../db/helpers";

function formatValue(v) {
  if (v === undefined || v === null || v === "") return "N/A";
  if (typeof v === "string" && v.trim().toLowerCase() === "not selected") return "N/A";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") {
    // Common pattern for relations
    if (v?.name) return String(v.name);
    if (v?.title) return String(v.title);
    if (v?.id) return String(v.id);
    return "N/A";
  }
  return String(v);
}

function formatStatus(v) {
  if (v === undefined || v === null || v === "") return "N/A";
  if (typeof v === "boolean") return v ? "Active" : "Not Active";
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "active" || s === "enabled") return "Active";
  if (s === "false" || s === "0" || s === "inactive" || s === "disabled") return "Not Active";
  return String(v);
}

function Field({ label, value, width, valueNode }) {
  return (
    <View style={{ width, paddingVertical: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ fontWeight: "700" }}>{label}</Text>
        {valueNode || <Text>{formatValue(value)}</Text>}
      </View>
    </View>
  );
}

function Section({ title, children, twoCol }) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleMedium" style={{ fontWeight: "700" }}>
        {title}
      </Text>
      <Divider />
      <View style={{ flexDirection: twoCol ? "row" : "column", flexWrap: "wrap", gap: 2 }}>
        {children}
      </View>
    </View>
  );
}

export default function VoterProfileScreen({ route }) {
  const voterId = route?.params?.voterId;
  const dispatch = useDispatch();
  const { voter, voterStatus, voterError } = useSelector((s) => s.representative);
  const { width } = useWindowDimensions();

  const [cachedPoliticalAffiliationName, setCachedPoliticalAffiliationName] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      // Only treat political affiliation as "existing" if the voter payload includes it.
      // Do NOT fall back to `party`, because that can be a different concept/shape.
      const id = voter?.politicalAffiliation?.id || voter?.politicalAffiliationId;
      if (!id) {
        setCachedPoliticalAffiliationName(null);
        return;
      }
      const party = await getCachedPartyById(database, id);
      if (cancelled) return;
      setCachedPoliticalAffiliationName(party?.name || null);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [voter?.politicalAffiliation?.id, voter?.politicalAffiliationId]);

  const politicalAffiliationLabel =
    voter?.politicalAffiliation?.name ||
    cachedPoliticalAffiliationName ||
    (typeof voter?.politicalAffiliation === "string" ? voter.politicalAffiliation : null) ||
    "N/A";

  // Match ElectionDashboard web: uses `governate?.name`
  const governateLabel = voter?.governate?.name || "N/A";

  const supporter = voter?.supporter || null;
  const supporterChipVariant = supporter === "Yes" ? "success" : supporter === "Maybe" ? "warning" : "error";

  const twoCol = width >= 720;
  const colWidth = useMemo(() => (twoCol ? Math.floor((width - 64) / 2) : "100%"), [twoCol, width]);

  useEffect(() => {
    if (!voterId) return;
    dispatch(fetchAsyncVoterById({ voterId }));
  }, [dispatch, voterId]);

  const loading = voterStatus === "loading";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card style={{ padding: 16, maxWidth: 920, alignSelf: "center", width: "100%" }}>
          <Text variant="headlineSmall" style={{ textAlign: "center", marginBottom: 12 }}>
            Voter Profile
          </Text>

          {!voterId ? <Text style={{ color: "red" }}>Missing voterId</Text> : null}
          {voterError ? <Text style={{ color: "red" }}>{String(voterError)}</Text> : null}
          {loading ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator />
            </View>
          ) : null}

          {voter ? (
            <View style={{ gap: 20, marginTop: 12 }}>
              <Section title="Personal Information" twoCol={twoCol}>
                <Field label="Name:" value={voter?.name} width={colWidth} />
                <Field label="Family Name:" value={voter?.familyName} width={colWidth} />
                <Field label="Father's Name:" value={voter?.fatherName} width={colWidth} />
                <Field label="Mother's Name:" value={voter?.motherName} width={colWidth} />
                <Field label="Date of Birth:" value={voter?.dateOfBirth} width={colWidth} />
                <Field label="Gender:" value={voter?.gender} width={colWidth} />
              </Section>

              <Section title="Contact Information" twoCol={twoCol}>
                <Field label="Phone Number:" value={voter?.phoneNumber} width={colWidth} />
                <Field label="Additional Phone Number:" value={voter?.additionalPhoneNumber} width={colWidth} />
              </Section>

              <Section title="Electoral Information" twoCol={twoCol}>
                <Field label="Record Number:" value={voter?.recordNumber} width={colWidth} />
                <Field
                  label="Electoral District:"
                  value={voter?.electoralDistrict?.name}
                  width={colWidth}
                />
                <Field label="Record Area:" value={voter?.recordArea?.name} width={colWidth} />
                <Field
                  label="Record Religion:"
                  value={voter?.recordReligion?.name}
                  width={colWidth}
                />
                <Field
                  label="Supporter:"
                  width={colWidth}
                  valueNode={
                    supporter ? (
                      <Chip compact style={{ alignSelf: "flex-end" }} textStyle={{ fontSize: 12 }} mode="outlined">
                        {supporter}
                      </Chip>
                    ) : (
                      <Text>N/A</Text>
                    )
                  }
                />
                <Field label="Jebb:" value={voter?.jebb} width={colWidth} />
                <Field
                  label="Political Affiliation:"
                  value={politicalAffiliationLabel}
                  width={colWidth}
                />
                <Field
                  label="Personal Religion:"
                  value={voter?.personalReligion?.name}
                  width={colWidth}
                />
              </Section>

              <Section title="Address Information" twoCol={twoCol}>
                <Field label="Governate:" value={governateLabel} width={colWidth} />
                <Field label="District:" value={voter?.district?.name} width={colWidth} />
                <Field label="Area:" value={voter?.area?.name} width={colWidth} />
                <Field label="Street:" value={voter?.street} width={colWidth} />
                <Field label="Building:" value={voter?.building} width={colWidth} />
                <Field label="Floor:" value={voter?.floor} width={colWidth} />
                <Field label="Nearby Landmark:" value={voter?.nearbyLandmark} width={colWidth} />
              </Section>

              <Section title="Additional Information" twoCol={twoCol}>
                <Field
                  label="Has ID:"
                  width={colWidth}
                  valueNode={
                    <Chip compact mode="outlined" style={{ alignSelf: "flex-end" }}>
                      {voter?.hasId ? "Yes" : "No"}
                    </Chip>
                  }
                />
                <Field
                  label="ID has Image:"
                  width={colWidth}
                  valueNode={
                    <Chip compact mode="outlined" style={{ alignSelf: "flex-end" }}>
                      {voter?.idHasImage ? "Yes" : "No"}
                    </Chip>
                  }
                />
                <Field label="Passport:" value={voter?.passport} width={colWidth} />
                <Field
                  label="Need Transportation:"
                  width={colWidth}
                  valueNode={
                    <Chip compact mode="outlined" style={{ alignSelf: "flex-end" }}>
                      {voter?.needTransportation ? "Yes" : "No"}
                    </Chip>
                  }
                />
                <Field label="Notes:" value={voter?.notes} width={colWidth} />
                <Field
                  label="Status:"
                  width={colWidth}
                  valueNode={
                    <Chip compact mode="outlined" style={{ alignSelf: "flex-end" }}>
                      {voter?.status ? "Active" : "Inactive"}
                    </Chip>
                  }
                />
              </Section>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

