// src/lib/config.ts
// ---------------------------------------------------------------------------
// Reads the environment block that app.config.js baked into the build.
// Nothing in the app talks to a hard-coded URL — everything flows through here,
// so flipping APP_ENV=staging <-> production swaps the ENTIRE backend target.
// ---------------------------------------------------------------------------
import Constants from 'expo-constants';

type AppEnv = 'staging' | 'production';

interface AppConfig {
  appEnv: AppEnv;
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppConfig>;

export const config: AppConfig = {
  appEnv: (extra.appEnv as AppEnv) ?? 'staging',
  apiUrl: extra.apiUrl ?? 'http://localhost:3000',
  supabaseUrl: extra.supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey: extra.supabaseAnonKey ?? '',
};

export const isProduction = config.appEnv === 'production';
