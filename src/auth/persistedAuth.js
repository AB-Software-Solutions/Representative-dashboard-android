import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "auth:lastKnownUser:v1";

export async function saveLastKnownUser(user) {
  try {
    if (!user) return;
    await AsyncStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export async function loadLastKnownUser() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearLastKnownUser() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

