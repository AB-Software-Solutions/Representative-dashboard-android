import "react-native-gesture-handler";
// Helps debug early startup crashes (before React renders anything)
import "./src/setup/earlyErrorHandler";

import React from "react";
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, NavigationContainer } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as ReduxProvider } from "react-redux";

import { AuthProvider } from "./src/auth/AuthProvider";
import { useAuth } from "./src/auth/useAuth";
import RootNavigator from "./src/navigation/RootNavigator";
import { store } from "./src/redux/store";
import { useOutboxSyncWorker } from "./src/offline/useOutboxSyncWorker";

function OutboxSyncBootstrap() {
  const { status } = useAuth();
  useOutboxSyncWorker(status === "authenticated");
  return null;
}

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Main dashboard palette (ElectionDashboard/src/theme/palette.js)
  const primary = "#00A76F";
  const lightTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary,
      onPrimary: "#FFFFFF",
      primaryContainer: "#C8FAD6",
      onPrimaryContainer: "#004B50",
      secondary: "#637381",
      background: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceVariant: "#F4F6F8",
      outline: "rgba(145, 158, 171, 0.4)",
      secondaryContainer: "#E9F7F0",
    },
  };

  const darkTheme = {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary,
      onPrimary: "#FFFFFF",
      primaryContainer: "#007867",
      onPrimaryContainer: "#C8FAD6",
      secondary: "#919EAB",
      background: "#161C24",
      surface: "#212B36",
      surfaceVariant: "rgba(145, 158, 171, 0.12)",
      outline: "rgba(145, 158, 171, 0.35)",
      secondaryContainer: "rgba(0, 167, 111, 0.18)",
    },
  };

  const paperTheme = isDark ? darkTheme : lightTheme;
  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
    materialLight: lightTheme,
    materialDark: darkTheme,
  });
  const navTheme = isDark ? DarkTheme : LightTheme;

  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <OutboxSyncBootstrap />
        <PaperProvider theme={paperTheme}>
          <SafeAreaProvider>
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </AuthProvider>
    </ReduxProvider>
  );
}
