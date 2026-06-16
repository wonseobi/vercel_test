import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';

try { process.loadEnvFile('.env'); } catch {}

const PORT = 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (!url.pathname.startsWith('/api/flags')) return send(404, { error: 'Not found' });

  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return send(401, { error: 'Missing bearer token' });

  const env = url.searchParams.get('env') === 'production' ? 'production' : 'staging';

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('feature_flags')
    .select('key, name, description, enabled, required_tier')
    .in('environment', ['all', env])
    .order('required_tier', { ascending: true })
    .order('name', { ascending: true });

  if (error) return send(400, { error: error.message });
  send(200, { env, flags: data ?? [] });
}).listen(PORT, () => console.log(`Local API running on http://localhost:${PORT}/api/flags`));
