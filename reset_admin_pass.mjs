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
  const newPassword = process.argv[2] || 'admin123456';
  console.log(`=== SETTING PASSWORD FOR admin@caobaquat.edu.vn to: "${newPassword}" ===`);
  
  const { data, error } = await clientAdmin.auth.admin.updateUserById(
    'd191bb51-682b-4b58-8964-c2d66650a0e8',
    { password: newPassword, email_confirm: true }
  );

  if (error) {
    console.error("Error setting password:", error.message);
  } else {
    console.log("SUCCESS! Password updated successfully for admin@caobaquat.edu.vn.");
  }
}

main();
