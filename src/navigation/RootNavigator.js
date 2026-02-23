import React from "react";
import { Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../login/login";
import { useAuth } from "../auth/useAuth";
import AccessDeniedScreen from "../screens/AccessDeniedScreen";
import NewPasswordScreen from "../screens/NewPasswordScreen";
import { ROLES } from "../constants/roles";
import RepresentativeDrawer from "./RepresentativeDrawer";

const Stack = createNativeStackNavigator();

function Splash() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Loading…</Text>
    </View>
  );
}

export default function RootNavigator() {
  const { status, user, challenge } = useAuth();

  if (status === "loading") {
    return <Splash />;
  }

  if (status !== "authenticated") {
    if (challenge?.name === "NEW_PASSWORD_REQUIRED") {
      return (
        <Stack.Navigator>
          <Stack.Screen
            name="NewPassword"
            component={NewPasswordScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      );
    }

    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  // Representative-only app gate
  if (user?.role !== ROLES.REPRESENTATIVE) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    );
  }

  return <RepresentativeDrawer />;
}

