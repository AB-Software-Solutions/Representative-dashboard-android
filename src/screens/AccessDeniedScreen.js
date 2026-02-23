import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

import { useAuth } from "../auth/useAuth";

export default function AccessDeniedScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
        <Text variant="headlineLarge" style={{ textAlign: "center" }}>
          Access denied
        </Text>
        <Text style={{ textAlign: "center" }}>
          This app is for representatives only.
        </Text>
        <Text style={{ textAlign: "center" }}>
          Current role: {user?.role || "(missing)"}
        </Text>
        <Button mode="contained" onPress={logout}>
          Logout
        </Button>
      </View>
    </SafeAreaView>
  );
}

