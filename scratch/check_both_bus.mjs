import { createClient } from '@supabase/supabase-js';

const supabase1Url = 'https://pdkiaypqaasqgnlfolfj.supabase.co';
const supabase1Key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBka2lheXBxYWFzcWdubGZvbGZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAzMjMzMiwiZXhwIjoyMDk5NjA4MzMyfQ.N0XS5MCKENaZH4hUpsRNpK1RDmRjMbHtI11iB7uhFHs';

const supabase2Url = 'https://gcsifddwmjmoxzbzjzoe.supabase.co';
const supabase2Key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjc2lmZGR3bWptb3h6Ynpqem9lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODg1NzY4MiwiZXhwIjoyMTA0NDMzNjgyfQ.LkA1noDYfg3YaEtRuJUzelS18K6P1exZyOP8VbC7Jo0';

async function checkBoth() {
  console.log('--- KIỂM TRA SUPABASE 1 ---');
  const sb1 = createClient(supabase1Url, supabase1Key);
  const res1 = await sb1.from('cbq_bus_registrations').select('*').limit(5);
  console.log('Supabase 1 response:', res1.error || (res1.data?.length + ' records'));

  console.log('\n--- KIỂM TRA SUPABASE 2 ---');
  const sb2 = createClient(supabase2Url, supabase2Key);
  const res2 = await sb2.from('cbq_bus_registrations').select('*', { count: 'exact' });
  console.log('Supabase 2 response:', res2.error || (res2.count + ' records'));
  if (res2.data && res2.data.length > 0) {
    console.log('Dữ liệu Supabase 2:', JSON.stringify(res2.data.slice(0, 5), null, 2));
  }
}

checkBoth();
