import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DrawerActions } from "@react-navigation/native";
import { IconButton } from "react-native-paper";

import PartiesScreen from "../screens/PartiesScreen";
import HeaderUserMenu from "../components/HeaderUserMenu";

const Stack = createNativeStackNavigator();

export default function PartiesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PartiesList"
        component={PartiesScreen}
        options={({ navigation }) => ({
          title: "Parties",
          headerLeft: () => (
            <IconButton
              icon="menu"
              onPress={() => navigation.getParent()?.dispatch(DrawerActions.toggleDrawer())}
            />
          ),
          headerRight: () => <HeaderUserMenu />,
        })}
      />
    </Stack.Navigator>
  );
}

