-- ==============================================================================
-- CHƯƠNG TRÌNH KHẮC PHỤC BẢO MẬT RLS & KHÓA RÀNG BUỘC HỆ THỐNG SUPABASE (V2)
-- Trường THPT Cao Bá Quát • Hệ Thống Vận Hành Nhà Trường
-- ==============================================================================

-- 1. THÊM KHÓA NGOẠI (FOREIGN KEY) GIỮA VÉ XE, THI ĐƯA VỚI BẢNG HỌC SINH
ALTER TABLE cbq_parking_registrations 
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES cbq_students(id) ON DELETE SET NULL;

ALTER TABLE cbq_emulation_logs 
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES cbq_students(id) ON DELETE SET NULL;

-- 2. THÊM CỘT KHOÁ SỔ TUẦN THI ĐƯA (WEEK LOCK)
ALTER TABLE cbq_emulation_weekly_summary 
  ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- 3. ĐẢM BẢO BẢNG BÌNH CHỌN (cbq_votes) CÓ ĐẦY ĐỦ CÁC CỘT CẦN THIẾT
CREATE TABLE IF NOT EXISTS public.cbq_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID,
    voter_name TEXT,
    voter_code TEXT NOT NULL,
    device_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tự động bổ sung các cột nếu bảng cbq_votes đã tồn tại từ trước
ALTER TABLE public.cbq_votes ADD COLUMN IF NOT EXISTS voting_id uuid;
ALTER TABLE public.cbq_votes ADD COLUMN IF NOT EXISTS student_code text;
ALTER TABLE public.cbq_votes ADD COLUMN IF NOT EXISTS student_name text;
ALTER TABLE public.cbq_votes ADD COLUMN IF NOT EXISTS student_class text;
ALTER TABLE public.cbq_votes ADD COLUMN IF NOT EXISTS option_id text;

-- 4. TỐI ƯU HÓA RLS SECURITY POLICIES (BẢO MẬT CSDL THỰC TẾ)

-- BẢNG PHÂN QUYỀN TÀI KHOẢN (cbq_user_roles)
ALTER TABLE cbq_user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all user roles" ON cbq_user_roles;
DROP POLICY IF EXISTS "Public read user roles" ON cbq_user_roles;
DROP POLICY IF EXISTS "Authenticated write user roles" ON cbq_user_roles;

CREATE POLICY "Public read user roles" ON cbq_user_roles 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write user roles" ON cbq_user_roles 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- BẢNG HỌC SINH (cbq_students)
ALTER TABLE cbq_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read students" ON cbq_students;
DROP POLICY IF EXISTS "Auth write students" ON cbq_students;

CREATE POLICY "Public read students" ON cbq_students 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write students" ON cbq_students 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- BẢNG VÉ XE (cbq_parking_registrations)
ALTER TABLE cbq_parking_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select parking" ON cbq_parking_registrations;
DROP POLICY IF EXISTS "Public insert parking" ON cbq_parking_registrations;
DROP POLICY IF EXISTS "Auth update delete parking" ON cbq_parking_registrations;

CREATE POLICY "Public select parking" ON cbq_parking_registrations 
  FOR SELECT USING (true);

CREATE POLICY "Public insert parking" ON cbq_parking_registrations 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update delete parking" ON cbq_parking_registrations 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete parking" ON cbq_parking_registrations 
  FOR DELETE USING (auth.role() = 'authenticated');

-- BẢNG CHẤM ĐIỂM THI ĐƯA (cbq_emulation_logs)
ALTER TABLE cbq_emulation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select emulation logs" ON cbq_emulation_logs;
DROP POLICY IF EXISTS "Public insert emulation logs" ON cbq_emulation_logs;
DROP POLICY IF EXISTS "Auth update emulation logs" ON cbq_emulation_logs;

CREATE POLICY "Public select emulation logs" ON cbq_emulation_logs 
  FOR SELECT USING (true);

CREATE POLICY "Public insert emulation logs" ON cbq_emulation_logs 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update emulation logs" ON cbq_emulation_logs 
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete emulation logs" ON cbq_emulation_logs 
  FOR DELETE USING (auth.role() = 'authenticated');

-- BẢNG BÌNH CHỌN (cbq_votes)
ALTER TABLE cbq_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read votes" ON cbq_votes;
DROP POLICY IF EXISTS "Public insert votes" ON cbq_votes;
DROP POLICY IF EXISTS "Allow public read votes for count" ON cbq_votes;
DROP POLICY IF EXISTS "Allow public insert votes" ON cbq_votes;

CREATE POLICY "Public read votes" ON cbq_votes FOR SELECT USING (true);
CREATE POLICY "Public insert votes" ON cbq_votes FOR INSERT WITH CHECK (true);

-- 5. TẠO THÊM INDEX TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_parking_student_id ON cbq_parking_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_emulation_student_id ON cbq_emulation_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_code ON cbq_votes(voter_code);
