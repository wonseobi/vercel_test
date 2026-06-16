// api/flags.ts
// ---------------------------------------------------------------------------
// Local Vercel Edge function. This is the ONLY thing the mobile client talks to
// for configuration. It interfaces with the local Supabase database and serves
// exactly the flags the calling user is entitled to.
//
// Security model:
//   * We build a Supabase client with the ANON key and forward the caller's
//     JWT. That means every query runs *as that user*, so Row Level Security
//     in the database does the gating. The function has no elevated privilege
//     and cannot be tricked into returning flags above the user's tier.
//   * Environment scoping (staging vs production) is applied on top as a
//     business filter.
//
// Run locally with:  vercel dev   (reads SUPABASE_URL / SUPABASE_ANON_KEY)
// ---------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return json({ error: 'Missing bearer token' }, 401);
  }

  const url = new URL(req.url);
  const env = url.searchParams.get('env') === 'production' ? 'production' : 'staging';

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Server not configured' }, 500);
  }

  // Key insight: anon key + forwarded user JWT => queries run under the user's
  // RLS context. The database, not this function, decides what is visible.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, name, description, enabled, required_tier')
    .in('environment', ['all', env])
    .order('required_tier', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return json({ error: error.message }, 400);
  }

  return json({ env, flags: data ?? [] });
}
