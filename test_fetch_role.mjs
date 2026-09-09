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
const anonKey = env.VITE_SUPABASE_2_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

const client = createClient(url, anonKey);

async function testFetchRoleFixed() {
  console.log("=== TESTING FIXED QUERY TO cbq_user_roles ===");
  const userId = 'd191bb51-682b-4b58-8964-c2d66650a0e8';

  const { data, error } = await client
    .from('cbq_user_roles')
    .select('role, committee_id, permissions')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error("❌ Error fetching role:", error);
  } else {
    console.log("✅ Fetched role data successfully:", data);
  }
}

testFetchRoleFixed();
