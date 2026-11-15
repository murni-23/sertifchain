// Simulasi exact query yang digunakan di /api/verify/route.ts
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const env = {};
for (const line of readFileSync(join(__dirname,'../.env.local'),'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0,i).trim()] = t.slice(i+1).trim();
}

const { createClient } = await import('@supabase/supabase-js');

// Pakai service role key — sama persis dengan yang di API
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const code = 'JF9MHFNA';

// Query EXACT sama dengan /api/verify/route.ts
const { data: student, error } = await sb
  .from('students')
  .select(`
    id, name, unique_code, status, claimed_at, tx_hash,
    batches ( name, description )
  `)
  .eq('unique_code', code)
  .single();

console.log('Error:', error?.message || 'none');
console.log('Student:', JSON.stringify(student, null, 2));
