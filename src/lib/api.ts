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
