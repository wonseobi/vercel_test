// src/lib/supabase.ts
// ---------------------------------------------------------------------------
// The Supabase client used by the mobile app, configured to:
//   * target whichever environment the build selected (config.ts)
//   * persist its session in the secure keychain (secureStorage.ts)
//   * auto-refresh tokens so the session stays valid across restarts
//
// The app only ever uses the ANON key here. All privileged data access is
// mediated by Row Level Security in the database — see the migration.
// ---------------------------------------------------------------------------
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { secureStorage } from './secureStorage';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
