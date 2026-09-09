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
const serviceKey = env.VITE_SUPABASE_2_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const clientAdmin = createClient(url, serviceKey);

async function main() {
  console.log("=== CHECKING USER ROLE FOR admin@caobaquat.edu.vn ===");
  const { data: userRoles, error } = await clientAdmin
    .from('cbq_user_roles')
    .select('*')
    .eq('user_id', 'd191bb51-682b-4b58-8964-c2d66650a0e8');

  if (error) {
    console.log("Error checking cbq_user_roles:", error.message);
  } else {
    console.log("Roles in cbq_user_roles for admin@caobaquat.edu.vn:", userRoles);
  }

  // Also check if admin user role exists or needs to be inserted
  if (!userRoles || userRoles.length === 0) {
    console.log("No admin role found in cbq_user_roles. Inserting admin role now...");
    const { error: insErr } = await clientAdmin.from('cbq_user_roles').insert([{
      user_id: 'd191bb51-682b-4b58-8964-c2d66650a0e8',
      role: 'admin'
    }]);
    if (insErr) console.log("Failed to insert admin role:", insErr.message);
    else console.log("Successfully inserted admin role for d191bb51-682b-4b58-8964-c2d66650a0e8!");
  }
}

main();
