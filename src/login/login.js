import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button, HelperText, Snackbar, Text, TextInput, useTheme } from "react-native-paper";

import { useAuth } from "../auth/useAuth";

const styles = {
  containerView: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  loginScreenContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loginFormView: {
    width: "100%",
    maxWidth: 380,
  },
  logoText: {
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "800",
  },
  loginFormTextInput: {
    marginTop: 6,
    marginBottom: 6,
  },
  loginButton: {
    marginTop: 12,
  },
};

export default function LoginScreen() {
  const { login, configMissing, error, clearError } = useAuth();
  const theme = useTheme();

  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginPress = async (values) => {
    try {
      setSubmitting(true);
      await login({ username: values.username.trim(), password: values.password });
    } catch (e) {
      // AuthProvider sets `error` for UI; keep this for native fallback.
      if (Platform.OS !== "web") {
        Alert.alert("Login failed", e?.message || "Unknown error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.containerView} behavior="padding">
      {Platform.OS === "web" ? (
        <View style={styles.loginScreenContainer}>
          <View style={styles.loginFormView}>
            <Text
              variant="displayLarge"
              style={[styles.logoText, { color: theme.colors.primary }]}
            >
              Election Dashboard
            </Text>

            {configMissing?.length > 0 ? (
              <HelperText type="error" visible>
                Missing Amplify env vars: {configMissing.join(", ")}
              </HelperText>
            ) : null}

            <Controller
              control={control}
              name="username"
              rules={{ required: "Email / username is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  label="Email / Username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={theme.colors.primary}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.username}>
              {errors.username?.message}
            </HelperText>

            <Controller
              control={control}
              name="password"
              rules={{ required: "Password is required" }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  mode="outlined"
                  label="Password"
                  secureTextEntry
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={theme.colors.primary}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password?.message}
            </HelperText>

            <Button
              mode="contained"
              style={styles.loginButton}
              onPress={handleSubmit(onLoginPress)}
              loading={submitting}
              disabled={submitting}
            >
              Login
            </Button>
          </View>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.loginScreenContainer}>
            <View style={styles.loginFormView}>
              <Text
                variant="headlineLarge"
                style={[styles.logoText, { color: theme.colors.primary }]}
              >
                Election Dashboard
              </Text>

              {configMissing?.length > 0 ? (
                <HelperText type="error" visible>
                  Missing Amplify env vars: {configMissing.join(", ")}
                </HelperText>
              ) : null}

              <Controller
                control={control}
                name="username"
                rules={{ required: "Email / username is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    mode="outlined"
                    label="Email / Username"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.loginFormTextInput}
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.username}>
                {errors.username?.message}
              </HelperText>

              <Controller
                control={control}
                name="password"
                rules={{ required: "Password is required" }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    mode="outlined"
                    label="Password"
                    secureTextEntry
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    style={styles.loginFormTextInput}
                  />
                )}
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password?.message}
              </HelperText>

              <Button
                mode="contained"
                style={styles.loginButton}
                onPress={handleSubmit(onLoginPress)}
                loading={submitting}
                disabled={submitting}
              >
                Login
              </Button>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={5000}
        action={{ label: "OK", onPress: clearError }}
      >
        {String(error || "")}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}
