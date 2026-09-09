import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
const url1 = env.VITE_SUPABASE_URL;
const key1 = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const client1 = createClient(url1, key1);

async function testSB1() {
  console.log("=== KIỂM TRA TRUY CẬP SUPABASE 1 VIA SERVICE ROLE KEY ===");
  console.log("URL 1:", url1);

  try {
    const { data, error } = await client1.from('cbq_user_roles').select('*').limit(5);
    if (error) {
      console.error("Lỗi khi truy cập Supabase 1:", error);
    } else {
      console.log("✅ TRUY CẬP THÀNH CÔNG SUPABASE 1!");
      console.log("Dữ liệu mẫu cbq_user_roles:", data);
    }
  } catch (err) {
    console.error("Bắt được ngoại lệ:", err.message);
  }
}

testSB1();
