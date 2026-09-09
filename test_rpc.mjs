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
const key = env.VITE_SUPABASE_2_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

const client = createClient(url, key);

async function testRpc() {
  console.log("=== KIỂM TRA HÀM INCREMENT_VOTE RPC TRÊN SUPABASE 2 ===");
  // Lấy 1 entry để test
  const { data: entries } = await client.from('cbq_voting_entries').select('id, title, votes_count').limit(1);
  if (!entries || entries.length === 0) {
    console.log("Chưa có bài dự thi để test RPC");
    return;
  }

  const testId = entries[0].id;
  console.log(`Bài dự thi test: "${entries[0].title}" | Votes hiện tại: ${entries[0].votes_count}`);

  const { error } = await client.rpc('increment_vote', { target_entry_id: testId, step: 0 });
  if (error) {
    console.log("❌ RPC increment_vote chưa được khởi tạo trên DB:", error.message);
  } else {
    console.log("✅ RPC increment_vote đã HOẠT ĐỘNG HOÀN HẢO!");
  }
}

testRpc();
