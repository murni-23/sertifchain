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

const code = process.argv[2] || 'JF9MHFNA';
const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});

const {data,error} = await sb.from('students')
  .select('id,name,unique_code,status,claimed_at,tx_hash')
  .eq('unique_code', code)
  .single();

console.log('DB error:', error?.message || 'none');
console.log('Data:', JSON.stringify(data, null, 2));
