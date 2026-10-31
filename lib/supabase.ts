import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Cliente con service role. Solo se usa en el servidor; nunca llega al navegador. */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Revisa .env.local (ver README).');
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Next 14 cachea fetch por defecto; las lecturas deben ser siempre frescas.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) }
  });
  return client;
}
