import React, { useState } from "react";
import { View } from "react-native";
import { Avatar, Divider, IconButton, Menu, Text } from "react-native-paper";

import { useAuth } from "../auth/useAuth";

export default function HeaderUserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const name = user?.displayName || user?.name || "Representative";
  const email = user?.email || "";

  return (
    <View style={{ marginRight: 4 }}>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <IconButton
            accessibilityLabel="User menu"
            onPress={() => setOpen(true)}
            icon={() => <Avatar.Icon size={32} icon="account" />}
          />
        }
      >
        <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, maxWidth: 260 }}>
          <Text variant="titleSmall" style={{ fontWeight: "700" }} numberOfLines={1}>
            {name}
          </Text>
          {email ? (
            <Text variant="bodySmall" style={{ opacity: 0.75 }} numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>
        <Divider />
        <Menu.Item
          leadingIcon="logout"
          title="Logout"
          onPress={() => {
            setOpen(false);
            logout();
          }}
        />
      </Menu>
    </View>
  );
}

