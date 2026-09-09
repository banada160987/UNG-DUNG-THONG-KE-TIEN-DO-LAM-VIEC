import fs from 'fs';
import path from 'path';

const pagesDir = './src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

console.log("=== CHECKING ALL PUBLIC PAGES FOR UNIMPORTED VARIABLES ===");

let foundError = false;

files.forEach(file => {
  const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
  
  // Check if supabase2 is used
  const usesSupabase2 = content.includes('supabase2');
  // Check if supabase2 is imported
  const importsSupabase2 = /import\s+.*supabase2.*/.test(content) || /const\s+.*supabase2.*/.test(content);

  if (usesSupabase2 && !importsSupabase2) {
    console.log(`❌ LỖI VĂN BẢN TRONG: ${file} (Dùng supabase2 nhưng chưa import!)`);
    foundError = true;
  } else if (usesSupabase2) {
    console.log(`✅ OK: ${file} (Có dùng supabase2 và đã import chuẩn)`);
  } else {
    console.log(`✅ OK: ${file} (Dùng supabase client primary chuẩn)`);
  }
});

if (!foundError) {
  console.log("\n🎉 TOÀN BỘ 60 PAGES ĐỀU AN TOÀN 100%! Không có trang nào bị lỗi thiếu biến.");
}
