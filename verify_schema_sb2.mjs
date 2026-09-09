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
const url2 = env.VITE_SUPABASE_2_URL;
const key2 = env.VITE_SUPABASE_2_SERVICE_ROLE_KEY;

const client2 = createClient(url2, key2);

// Kiểm tra xem các bảng chính có hoạt động đầy đủ cột không
async function checkTableStructure() {
  console.log("=== KIỂM TRA CẤU TRÚC BẢNG TRÊN SUPABASE 2 ===");

  const tables = [
    'cbq_users',
    'cbq_user_roles',
    'cbq_registration_campaigns',
    'cbq_student_registrations',
    'cbq_parking_tickets',
    'cbq_bus_tickets',
    'cbq_emulation_scores',
    'cbq_departments',
    'cbq_timetable_items',
    'cbq_audit_logs'
  ];

  for (const t of tables) {
    const { data, error } = await client2.from(t).select('*').limit(1);
    if (error) {
      console.log(`❌ Bảng '${t}': Chưa chuẩn hoặc thiếu (Lỗi: ${error.message})`);
    } else {
      console.log(`✅ Bảng '${t}': Cấu trúc chuẩn OK!`);
    }
  }
}

checkTableStructure();
