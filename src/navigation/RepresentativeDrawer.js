import React from "react";
import { createDrawerNavigator, DrawerContentScrollView } from "@react-navigation/drawer";
import { View } from "react-native";
import { Drawer, IconButton, useTheme } from "react-native-paper";

import VotersStack from "./VotersStack";
import PartiesStack from "./PartiesStack";

const DrawerNav = createDrawerNavigator();

function DrawerContent(props) {
  const theme = useTheme();
  const { state, navigation } = props;

  const activeRouteName = state.routeNames[state.index];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 8, paddingTop: 4 }}>
        <IconButton
          icon="close"
          accessibilityLabel="Close navigation drawer"
          onPress={() => navigation.closeDrawer()}
        />
      </View>
      <Drawer.Section title="MANAGEMENT" style={{ paddingHorizontal: 8, paddingTop: 8 }}>
        <Drawer.Item
          label="Voters"
          icon="account-group"
          active={activeRouteName === "Voters"}
          onPress={() => {
            navigation.navigate("Voters");
            navigation.closeDrawer();
          }}
          theme={{ colors: { secondaryContainer: theme.colors.secondaryContainer } }}
        />
        <Drawer.Item
          label="Parties"
          icon="flag"
          active={activeRouteName === "Parties"}
          onPress={() => {
            navigation.navigate("Parties");
            navigation.closeDrawer();
          }}
          theme={{ colors: { secondaryContainer: theme.colors.secondaryContainer } }}
        />
      </Drawer.Section>
    </DrawerContentScrollView>
  );
}

export default function RepresentativeDrawer() {
  return (
    <DrawerNav.Navigator
      initialRouteName="Voters"
      drawerContent={(props) => <DrawerContent {...props} />}
      defaultStatus="closed"
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        swipeEnabled: true,
        drawerStyle: { width: 260 },
      }}
    >
      <DrawerNav.Screen name="Voters" component={VotersStack} />
      <DrawerNav.Screen name="Parties" component={PartiesStack} />
    </DrawerNav.Navigator>
  );
}

