import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { Button, HelperText, Snackbar, Text, TextInput } from "react-native-paper";

import { useAuth } from "../auth/useAuth";

export default function NewPasswordScreen() {
  const { challenge, completeNewPassword, clearChallenge, logout, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      await completeNewPassword({ newPassword: values.newPassword });
    } catch (e) {
      // AuthProvider sets `error` for UI.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, justifyContent: "center", gap: 12 }}>
        <Text variant="headlineLarge" style={{ textAlign: "center" }}>
          Set a new password
        </Text>
        <Text style={{ textAlign: "center" }}>
          {challenge?.username ? `User: ${challenge.username}` : ""}
        </Text>

        <Controller
          control={control}
          name="newPassword"
          rules={{
            required: "New password is required",
            minLength: { value: 8, message: "Minimum 8 characters" },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label="New password"
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.newPassword}>
          {errors.newPassword?.message}
        </HelperText>

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: "Confirm password is required",
            validate: (v) => v === newPassword || "Passwords do not match",
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              mode="outlined"
              label="Confirm password"
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
            />
          )}
        />
        <HelperText type="error" visible={!!errors.confirmPassword}>
          {errors.confirmPassword?.message}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={submitting}
          disabled={submitting}
        >
          Save password
        </Button>

        <Button mode="text" onPress={clearChallenge} disabled={submitting}>
          Back to login
        </Button>
        <Button mode="text" onPress={logout} disabled={submitting}>
          Logout
        </Button>
      </View>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={5000}
        action={{ label: "OK", onPress: clearError }}
      >
        {String(error || "")}
      </Snackbar>
    </SafeAreaView>
  );
}

