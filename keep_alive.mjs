import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Đọc .env bằng Node.js thuần (không cần gói dotenv)
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
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      env[key] = val;
    }
  });
  return env;
}

const env = loadEnv();
const url1 = env.VITE_SUPABASE_URL;
const key1 = env.VITE_SUPABASE_ANON_KEY;

const url2 = env.VITE_SUPABASE_2_URL;
const key2 = env.VITE_SUPABASE_2_ANON_KEY;

async function pingSupabase(name, url, key) {
  if (!url || !key) {
    console.log(`[⚠️ WARNING] ${name} chưa được cấu hình URL/Key trong file .env!`);
    return false;
  }
  try {
    const client = createClient(url, key);
    const start = Date.now();
    // Thử truy vấn nhẹ để giữ DB luôn Active (Keep-Alive)
    const { data, error } = await client.from('cbq_audit_logs').select('id').limit(1);
    const duration = Date.now() - start;

    if (error && error.message && error.message.includes('fetch failed')) {
      console.error(`[❌ ERROR] ${name} (${url}) KHÔNG THỂ KẾT NỐI (Có thể đã bị PAUSED hoặc LOCK)!`);
      return false;
    }

    console.log(`[✅ ALIVE & ONLINE] ${name} (${url}) đang hoạt động tốt! (Thời gian phản hồi: ${duration}ms)`);
    return true;
  } catch (err) {
    console.error(`[❌ ERROR] ${name} gặp sự cố ngắt kết nối:`, err.message);
    return false;
  }
}

async function main() {
  console.log("=== KIỂM TRA TRẠNG THÁI HOẠT ĐỘNG (KEEP-ALIVE) 02 SUPABASE ===");
  console.log(`Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}\n`);

  const status1 = await pingSupabase("SUPABASE 1 (Primary)", url1, key1);
  console.log("-------------------------------------------------------------");
  const status2 = await pingSupabase("SUPABASE 2 (Secondary)", url2, key2);
  console.log("-------------------------------------------------------------");

  if (status1 && status2) {
    console.log("🎉 TẤT CẢ 02 SUPABASE ĐỀU ĐANG HOẠT ĐỘNG HOÀN HẢO!");
  } else if (!status1 && status2) {
    console.log("⚠️ CẢNH BÁO: Supabase 1 gặp sự cố/Pased! Hệ thống sẵn sàng Failover sang Supabase 2.");
  } else if (status1 && !status2) {
    console.log("⚠️ CẢNH BÁO: Supabase 2 gặp sự cố/Paused! Cần kiểm tra Supabase 2.");
  } else {
    console.log("🚨 NGUY CẤP: Cả 02 Supabase đều không thể truy cập!");
  }
}

main();
