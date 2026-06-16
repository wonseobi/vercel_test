// App.tsx
// ---------------------------------------------------------------------------
// Root component. Owns the single piece of global state that matters here:
// "is there a session?". Supabase restores the session from secure storage on
// launch, so a returning user lands straight on the flags screen — no re-login.
// ---------------------------------------------------------------------------
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import FlagsScreen from './src/screens/FlagsScreen';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    // Restore any persisted (secure) session on cold start.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setRestoring(false);
    });

    // React to sign-in / sign-out / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {restoring ? (
        <View style={styles.center}>
          <ActivityIndicator color="#38BDF8" />
        </View>
      ) : session ? (
        <FlagsScreen session={session} />
      ) : (
        <LoginScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1120' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
