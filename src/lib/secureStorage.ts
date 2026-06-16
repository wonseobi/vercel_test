// src/lib/secureStorage.ts
// ---------------------------------------------------------------------------
// Storage adapter that backs Supabase auth with the device keychain/keystore
// via expo-secure-store. This is what makes the session survive app restarts
// *securely* (encrypted at rest) rather than living in plain AsyncStorage.
//
// SecureStore values are capped at ~2KB and keys must be alphanumeric, so we
// namespace keys per-environment to keep staging and production sessions from
// ever colliding on the same device.
// ---------------------------------------------------------------------------
import * as SecureStore from 'expo-secure-store';
import { config } from './config';

const prefix = `sb_${config.appEnv}_`;
const safeKey = (key: string) => prefix + key.replace(/[^a-zA-Z0-9._-]/g, '_');

export const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(safeKey(key)),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(safeKey(key), value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(safeKey(key)),
};
