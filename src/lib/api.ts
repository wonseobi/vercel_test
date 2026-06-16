// src/lib/api.ts
// ---------------------------------------------------------------------------
// Thin client for the Vercel function. The mobile app NEVER queries flag data
// from Supabase directly — it goes through the serverless edge function, which
// is the single, auditable gateway to backend configuration.
//
// We forward the user's access token so the database can enforce RLS as that
// specific user. The current environment is forwarded too, so the API returns
// only the flags relevant to staging vs production.
// ---------------------------------------------------------------------------
import { config } from './config';

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  required_tier: 'free' | 'premium' | 'beta';
}

export async function fetchFlags(accessToken: string): Promise<FeatureFlag[]> {
  const res = await fetch(`${config.apiUrl}/api/flags?env=${config.appEnv}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to load flags (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { flags: FeatureFlag[] };
  return json.flags;
}
