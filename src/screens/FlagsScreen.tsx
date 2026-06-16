// src/screens/FlagsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { config } from '../lib/config';
import { fetchFlags, FeatureFlag } from '../lib/api';

const TIER_COLOR: Record<FeatureFlag['required_tier'], string> = {
  free: '#64748B',
  premium: '#F59E0B',
  beta: '#A855F7',
};

export default function FlagsScreen({ session }: { session: Session }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchFlags(session.access_token);
      setFlags(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session.access_token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#38BDF8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feature Flags</Text>
          <Text testID="env-badge" style={styles.env}>
            {config.appEnv.toUpperCase()} · {session.user.email}
          </Text>
        </View>
        <Pressable testID="signout-button" onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signout}>Sign out</Text>
        </Pressable>
      </View>

      {error ? (
        <Text testID="flags-error" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <FlatList
        testID="flags-list"
        data={flags}
        keyExtractor={(item) => item.key}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListEmptyComponent={
          <Text testID="flags-empty" style={styles.empty}>
            No flags available for your account.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card} testID={`flag-${item.key}`}>
            <View style={styles.cardRow}>
              <Text style={styles.flagName}>{item.name}</Text>
              <View
                style={[styles.badge, { backgroundColor: TIER_COLOR[item.required_tier] }]}
              >
                <Text style={styles.badgeText}>{item.required_tier}</Text>
              </View>
            </View>
            <Text style={styles.flagDesc}>{item.description}</Text>
            <Text
              testID={`flag-${item.key}-state`}
              style={[styles.state, { color: item.enabled ? '#34D399' : '#F87171' }]}
            >
              {item.enabled ? '● enabled' : '○ disabled'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1120', paddingTop: 64, paddingHorizontal: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#F8FAFC' },
  env: { fontSize: 12, color: '#38BDF8', marginTop: 2, letterSpacing: 0.5 },
  signout: { color: '#94A3B8', fontSize: 14 },
  card: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flagName: { color: '#F8FAFC', fontSize: 17, fontWeight: '600', flexShrink: 1 },
  flagDesc: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  state: { fontSize: 13, marginTop: 8, fontWeight: '600' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { color: '#0B1120', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  empty: { color: '#64748B', textAlign: 'center', marginTop: 40 },
  error: { color: '#F87171', marginBottom: 12 },
});
