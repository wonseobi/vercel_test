import * as SecureStore from 'expo-secure-store';
import { config } from './config';

const prefix = `sb_${config.appEnv}_`;
const safeKey = (key: string) => prefix + key.replace(/[^a-zA-Z0-9._-]/g, '_');

export const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(safeKey(key)),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(safeKey(key), value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(safeKey(key)),
};
