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
