import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function loadEnv() {
  const content = fs.readFileSync('.env', 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
    }
  });
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_2_URL || env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_2_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(url, key);

async function main() {
  const { data, error } = await client.from('cbq_user_roles').select('*').limit(1);
  if (error) console.log("cbq_user_roles err:", error.message);
  else console.log("cbq_user_roles OK!", data);
}

main();
