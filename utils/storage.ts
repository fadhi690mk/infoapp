/**
 * Storage abstraction that falls back to in-memory when AsyncStorage
 * native module is unavailable (e.g. "native module is null, can't access the legacy storage").
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const memory: Record<string, string> = {};
let useMemory = false;

function useMemoryFallback(): boolean {
  if (!useMemory) return false;
  return true;
}

async function getItem(key: string): Promise<string | null> {
  if (useMemoryFallback()) return memory[key] ?? null;
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("native module") || msg.includes("legacy storage") || msg.includes("null")) {
      useMemory = true;
      return memory[key] ?? null;
    }
    throw e;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (useMemoryFallback()) {
    memory[key] = value;
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("native module") || msg.includes("legacy storage") || msg.includes("null")) {
      useMemory = true;
      memory[key] = value;
      return;
    }
    throw e;
  }
}

async function removeItem(key: string): Promise<void> {
  if (useMemoryFallback()) {
    delete memory[key];
    return;
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("native module") || msg.includes("legacy storage") || msg.includes("null")) {
      useMemory = true;
      delete memory[key];
      return;
    }
    throw e;
  }
}

export const storage = {
  getItem,
  setItem,
  removeItem,
};
