import React, { useEffect, useMemo } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Card, Divider, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

import { fetchAsyncVoterById } from "../redux/features/representative/representativeSlice";

function Field({ label, value, width }) {
  return (
    <View style={{ width, paddingVertical: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ fontWeight: "700" }}>{label}</Text>
        <Text>{value ?? "N/A"}</Text>
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
                  value={voter?.electoralDistrict?.name || voter?.electoralDistrict}
                  width={colWidth}
                />
                <Field label="Record Area:" value={voter?.recordArea?.name || voter?.recordArea} width={colWidth} />
                <Field
                  label="Record Religion:"
                  value={voter?.recordReligion?.name || voter?.recordReligion}
                  width={colWidth}
                />
                <Field label="Supporter:" value={voter?.supporter} width={colWidth} />
                <Field label="Jebb:" value={voter?.jebb} width={colWidth} />
                <Field
                  label="Political Affiliation:"
                  value={voter?.politicalAffiliation?.name || voter?.politicalAffiliation}
                  width={colWidth}
                />
                <Field
                  label="Personal Religion:"
                  value={voter?.personalReligion?.name || voter?.personalReligion}
                  width={colWidth}
                />
              </Section>

              <Section title="Address Information" twoCol={twoCol}>
                <Field label="Governorate:" value={voter?.governorate?.name || voter?.governorate} width={colWidth} />
                <Field label="District:" value={voter?.district?.name || voter?.district} width={colWidth} />
                <Field label="Area:" value={voter?.area?.name || voter?.area} width={colWidth} />
                <Field label="Street:" value={voter?.street} width={colWidth} />
                <Field label="Building:" value={voter?.building} width={colWidth} />
                <Field label="Floor:" value={voter?.floor} width={colWidth} />
                <Field label="Nearby Landmark:" value={voter?.nearbyLandmark} width={colWidth} />
              </Section>

              <Section title="Additional Information" twoCol={twoCol}>
                <Field label="Has ID:" value={voter?.hasId} width={colWidth} />
                <Field label="ID has Image:" value={voter?.idHasImage} width={colWidth} />
                <Field label="Passport:" value={voter?.passport} width={colWidth} />
                <Field label="Need Transportation:" value={voter?.needTransportation} width={colWidth} />
                <Field label="Notes:" value={voter?.notes} width={colWidth} />
                <Field label="Status:" value={voter?.status} width={colWidth} />
              </Section>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

