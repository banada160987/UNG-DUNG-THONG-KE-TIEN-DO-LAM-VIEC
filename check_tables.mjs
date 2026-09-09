import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
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
const key2 = env.VITE_SUPABASE_2_SERVICE_ROLE_KEY || env.VITE_SUPABASE_2_ANON_KEY;

const client = createClient(url2, key2);

const tables = [
  'cbq_users',
  'cbq_user_roles',
  'cbq_registration_campaigns',
  'cbq_dynamic_registrations',
  'cbq_audit_logs',
  'cbq_parking_tickets',
  'cbq_parking_settings',
  'cbq_parking_config',
  'cbq_bus_tickets',
  'cbq_bus_routes',
  'cbq_guestbook',
  'cbq_news',
  'cbq_magazine',
  'cbq_quiz_questions',
  'cbq_sports_teams',
  'cbq_emulation_scores',
  'cbq_general_feedback',
  'cbq_scholarship_feedback',
  'cbq_invitations',
  'cbq_voting_sessions',
  'cbq_departments',
  'cbq_department_dossiers',
  'cbq_timetable',
  'cbq_digital_vault',
  'cbq_app_hub',
  'students',
  'teachers',
  'classes'
];

async function main() {
  console.log("=== DANH SÁCH BẢNG & SỐ LƯỢNG BẢN GHI TRÊN SUPABASE 2 ===");
  console.log("URL:", url2);
  console.log("------------------------------------------------------");

  let existCount = 0;
  let missingTables = [];

  for (const t of tables) {
    try {
      const { data, error, count } = await client.from(t).select('*', { count: 'exact', head: true });
      if (!error) {
        console.log(`✅ [TỒN TẠI] Bảng '${t}': ${count !== null ? count : 0} bản ghi`);
        existCount++;
      } else {
        if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('not found')) {
          missingTables.push(t);
        } else {
          console.log(`⚠️ Bảng '${t}': Thông báo - ${error.message} (Code: ${error.code})`);
        }
      }
    } catch (e) {
      console.log(`❌ Lỗi truy vấn bảng '${t}':`, e.message);
    }
  }

  console.log("------------------------------------------------------");
  console.log(`Tổng số bảng đã phát hiện trên Supabase 2: ${existCount} / ${tables.length}`);
  
  if (missingTables.length > 0) {
    console.log("\n⚠️ Các bảng chưa khởi tạo:");
    missingTables.forEach(t => console.log(`   - ${t}`));
  } else {
    console.log("\n🎉 Tất cả các bảng chính đều đã được khởi tạo!");
  }
}

main();
