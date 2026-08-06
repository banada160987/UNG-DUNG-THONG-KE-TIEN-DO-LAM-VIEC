import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing URL or Service Role Key in .env");
  process.exit(1);
}

const supabaseAdmin = createClient(url, key);

async function main() {
  const { data, error } = await supabaseAdmin.from('cbq_user_roles').upsert({
    user_id: 'ec5285d5-2bcb-4013-ad1a-b615c5e7d7c5',
    role: 'admin',
    committee_id: null
  });
  
  if (error) {
    console.error("Error setting admin role:", error);
  } else {
    console.log("Successfully set admin role for ec5285d5-2bcb-4013-ad1a-b615c5e7d7c5!");
  }
}
main();
