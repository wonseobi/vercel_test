const APP_ENV = process.env.APP_ENV === 'production' ? 'production' : 'staging';

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
    extra: {
      appEnv: APP_ENV,
      ...ENVIRONMENTS[APP_ENV],
    },
  },
});
