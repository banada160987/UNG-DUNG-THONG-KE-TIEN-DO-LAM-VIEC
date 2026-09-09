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

async function testSignIn() {
  console.log("=== TESTING SIGN IN WITH admin@caobaquat.edu.vn ON SUPABASE 2 ===");
  const { data, error } = await client.auth.signInWithPassword({
    email: 'admin@caobaquat.edu.vn',
    password: 'admin123456'
  });

  if (error) {
    console.error("❌ Sign in failed:", error.message);
  } else {
    console.log("✅ SIGN IN SUCCESSFUL!");
    console.log("User ID:", data.user.id);
    console.log("Email:", data.user.email);
  }
}

testSignIn();
