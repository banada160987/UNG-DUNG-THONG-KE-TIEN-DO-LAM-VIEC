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

const client1Admin = env.VITE_SUPABASE_SERVICE_ROLE_KEY ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY) : null;
const client2Admin = env.VITE_SUPABASE_2_SERVICE_ROLE_KEY ? createClient(env.VITE_SUPABASE_2_URL, env.VITE_SUPABASE_2_SERVICE_ROLE_KEY) : null;

async function checkAuthUsers() {
  console.log("=== CHECKING AUTH USERS IN SUPABASE 1 ===");
  if (client1Admin) {
    try {
      const { data, error } = await client1Admin.auth.admin.listUsers();
      if (error) console.log("SB1 Auth list error:", error.message);
      else {
        console.log(`SB1 Auth Users count: ${data.users.length}`);
        data.users.forEach(u => console.log(` - ID: ${u.id} | Email: ${u.email}`));
      }
    } catch (e) {
      console.log("SB1 Auth fetch error:", e.message);
    }
  } else {
    console.log("SB1 Service Key missing");
  }

  console.log("\n=== CHECKING AUTH USERS IN SUPABASE 2 ===");
  if (client2Admin) {
    try {
      const { data, error } = await client2Admin.auth.admin.listUsers();
      if (error) console.log("SB2 Auth list error:", error.message);
      else {
        console.log(`SB2 Auth Users count: ${data.users.length}`);
        data.users.forEach(u => console.log(` - ID: ${u.id} | Email: ${u.email}`));
      }
    } catch (e) {
      console.log("SB2 Auth fetch error:", e.message);
    }
  } else {
    console.log("SB2 Service Key missing");
  }
}

checkAuthUsers();
