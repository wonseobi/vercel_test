// app.config.js
// ---------------------------------------------------------------------------
// Single source of truth for build-time environment selection.
//
// The app is built/run for exactly ONE environment, chosen by the APP_ENV
// shell variable:
//
//     APP_ENV=staging    expo start    -> talks to the staging API + DB
//     APP_ENV=production expo start    -> talks to the production API + DB
//
// Whatever ends up in `extra` is readable at runtime via
// expo-constants (`Constants.expoConfig.extra`). See src/lib/config.ts.
// ---------------------------------------------------------------------------

const APP_ENV = process.env.APP_ENV === 'production' ? 'production' : 'staging';

// Per-environment endpoints. In a real deployment staging and production point
// at two *different* Supabase projects and two different Vercel deployments.
// Locally they both point at the single Supabase instance the CLI spins up,
// but the app still cleanly toggles which config block it consumes — proving
// the wiring is environment-driven, not hard-coded.
const ENVIRONMENTS = {
  staging: {
    apiUrl: process.env.STAGING_API_URL || 'http://localhost:3000',
    supabaseUrl: process.env.STAGING_SUPABASE_URL || 'http://localhost:54321',
    supabaseAnonKey:
      process.env.STAGING_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
  },
  production: {
    apiUrl: process.env.PROD_API_URL || 'http://localhost:3000',
    supabaseUrl: process.env.PROD_SUPABASE_URL || 'http://localhost:54321',
    supabaseAnonKey:
      process.env.PROD_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTc5OTUzNTYwMH0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE',
  },
};

module.exports = () => ({
  expo: {
    name: APP_ENV === 'production' ? 'Config Flags' : 'Config Flags (Staging)',
    slug: 'config-flags-app',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    splash: { backgroundColor: '#0B1120' },
    assetBundlePatterns: ['**/*'],
    ios: { supportsTablet: true, bundleIdentifier: `com.example.configflags.${APP_ENV}` },
    android: { package: `com.example.configflags.${APP_ENV}` },
    // Everything below is readable at runtime via expo-constants.
    extra: {
      appEnv: APP_ENV,
      ...ENVIRONMENTS[APP_ENV],
    },
  },
});
