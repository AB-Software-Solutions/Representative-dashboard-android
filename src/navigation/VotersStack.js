import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DrawerActions } from "@react-navigation/native";
import { IconButton } from "react-native-paper";

import MyVotersScreen from "../screens/MyVotersScreen";
import VoterProfileScreen from "../screens/VoterProfileScreen";
import HeaderUserMenu from "../components/HeaderUserMenu";

const Stack = createNativeStackNavigator();

export default function VotersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VotersList"
        component={MyVotersScreen}
        options={({ navigation }) => ({
          title: "Voters",
          headerLeft: () => (
            <IconButton
              icon="menu"
              onPress={() => navigation.getParent()?.dispatch(DrawerActions.toggleDrawer())}
            />
          ),
          headerRight: () => <HeaderUserMenu />,
        })}
      />
      <Stack.Screen
        name="VoterProfile"
        component={VoterProfileScreen}
        options={{ title: "Voter Profile", headerRight: () => <HeaderUserMenu /> }}
      />
    </Stack.Navigator>
  );
}

