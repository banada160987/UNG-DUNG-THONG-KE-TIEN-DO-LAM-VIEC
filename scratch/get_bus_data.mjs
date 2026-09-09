import { createClient } from '@supabase/supabase-js';

const supabase1Url = 'https://pdkiaypqaasqgnlfolfj.supabase.co';
const supabase1Key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBka2lheXBxYWFzcWdubGZvbGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMjMzMiwiZXhwIjoyMDk5NjA4MzMyfQ.N0XS5MCKENaZH4hUpsRNpK1RDmRjMbHtI11iB7uhFHs';

const supabase = createClient(supabase1Url, supabase1Key);

async function checkBusData() {
  console.log('Đang kết nối Supabase 1...');
  
  // 1. Kiểm tra cbq_bus_registrations
  const { data: registrations, error: regError, count } = await supabase
    .from('cbq_bus_registrations')
    .select('*', { count: 'exact' });

  if (regError) {
    console.error('Lỗi khi lấy cbq_bus_registrations:', regError);
  } else {
    console.log(`\n=== TỔNG SỐ BẢN GHI ĐĂNG KÝ XE ĐƯA ĐÓN: ${count || registrations.length} ===`);
    if (registrations.length > 0) {
      console.log('Các cột có trong bảng:', Object.keys(registrations[0]));
      console.log('\n--- 10 BẢN GHI ĐẦU TIÊN ---');
      console.log(JSON.stringify(registrations.slice(0, 10), null, 2));
      
      // Thống kê theo lớp
      const classCount = {};
      const packageCount = {};
      const statusCount = {};
      registrations.forEach(r => {
        const cls = r.student_class || r.class || 'Chưa rõ';
        classCount[cls] = (classCount[cls] || 0) + 1;
        
        const pkg = r.package_type || r.package || 'Chưa rõ';
        packageCount[pkg] = (packageCount[pkg] || 0) + 1;

        const st = r.status || 'Chưa rõ';
        statusCount[st] = (statusCount[st] || 0) + 1;
      });
      console.log('\n--- THỐNG KÊ THEO LỚP ---', classCount);
      console.log('\n--- THỐNG KÊ THEO GÓI ---', packageCount);
      console.log('\n--- THỐNG KÊ THEO TRẠNG THÁI ---', statusCount);
    } else {
      console.log('Bảng cbq_bus_registrations hiện đang trống.');
    }
  }

  // 2. Kiểm tra cbq_bus_packages
  const { data: packages, error: pkgError } = await supabase
    .from('cbq_bus_packages')
    .select('*');
  if (!pkgError && packages) {
    console.log('\n=== CÁC GÓI DỊCH VỤ XE ĐƯA ĐÓN (cbq_bus_packages) ===');
    console.table(packages);
  }

  // 3. Kiểm tra cbq_bus_settings
  const { data: settings, error: setError } = await supabase
    .from('cbq_bus_settings')
    .select('*');
  if (!setError && settings) {
    console.log('\n=== CẤU HÌNH XE ĐƯA ĐÓN (cbq_bus_settings) ===');
    console.log(settings);
  }
}

checkBusData();
