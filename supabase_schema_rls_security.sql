-- ==============================================================================
-- CHƯƠNG TRÌNH KHẮC PHỤC BẢO MẬT & TỐI ƯU HIỆU NĂNG CƠ SỞ DỮ LIỆU SUPABASE
-- Trường THPT Cao Bá Quát • Hệ Thống Vận Hành Nhà Trường (Tự động khởi tạo & Bảo mật)
-- ==============================================================================

-- 1. KHỞI TẠO TẤT CẢ CÁC BẢNG NẾU CHƯA TỒN TẠI (TRÁNH LỖI RELATION DOES NOT EXIST)

-- Bảng Học sinh
CREATE TABLE IF NOT EXISTS cbq_students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code text UNIQUE NOT NULL,
  student_name text NOT NULL,
  student_class text NOT NULL,
  grade_level text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bảng Đăng ký xe máy
CREATE TABLE IF NOT EXISTS cbq_parking_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code text UNIQUE NOT NULL,
  student_name text NOT NULL,
  student_code text,
  student_class text NOT NULL,
  grade_level text NOT NULL,
  license_plate text NOT NULL,
  vehicle_type text DEFAULT 'Xe máy 50cc',
  vehicle_color text,
  package_type text DEFAULT 'term',
  start_date date NOT NULL,
  end_date date NOT NULL,
  fee_amount numeric DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bảng Gói vé xe máy
CREATE TABLE IF NOT EXISTS cbq_parking_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_key text UNIQUE NOT NULL,
  title text NOT NULL,
  months_count integer DEFAULT 1,
  fee_amount numeric DEFAULT 0,
  description text,
  hide_fee boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bảng Tiêu chí thi đua
CREATE TABLE IF NOT EXISTS cbq_emulation_criteria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Nếp sống & Đồng phục',
  score_change integer NOT NULL DEFAULT -5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bảng Nhật ký chấm điểm thi đua
CREATE TABLE IF NOT EXISTS cbq_emulation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number integer NOT NULL DEFAULT 1,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  student_class text NOT NULL,
  grade_level text,
  criteria_title text NOT NULL,
  category text,
  score_change integer NOT NULL,
  note text,
  reported_by text DEFAULT 'Đội Cờ Đỏ',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bảng Tổng hợp thi đua tuần
CREATE TABLE IF NOT EXISTS cbq_emulation_weekly_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number integer NOT NULL,
  student_class text NOT NULL,
  grade_level text,
  total_deduction integer DEFAULT 0,
  total_bonus integer DEFAULT 0,
  final_score integer DEFAULT 100,
  rank_position integer,
  classification text DEFAULT 'Tốt',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bảng Phân quyền vai trò người dùng
CREATE TABLE IF NOT EXISTS cbq_user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'committee_member',
  committee_id uuid,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bảng Menu điều hướng động
CREATE TABLE IF NOT EXISTS cbq_navigation_menus (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL DEFAULT 'public',
  parent_group text,
  label text NOT NULL,
  path text NOT NULL,
  icon text,
  permission_key text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. KÍCH HOẠT ROW LEVEL SECURITY (RLS) NÂNG CAO
ALTER TABLE cbq_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_parking_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_parking_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_weekly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_navigation_menus ENABLE ROW LEVEL SECURITY;

-- 3. TẠO POLICIES BẢO VỆ CHỐNG TRUY CẬP TRÁI PHÉP
DROP POLICY IF EXISTS "Public read students" ON cbq_students;
CREATE POLICY "Public read students" ON cbq_students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth write students" ON cbq_students;
CREATE POLICY "Auth write students" ON cbq_students FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public select parking" ON cbq_parking_registrations;
CREATE POLICY "Public select parking" ON cbq_parking_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert parking" ON cbq_parking_registrations;
CREATE POLICY "Public insert parking" ON cbq_parking_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth update delete parking" ON cbq_parking_registrations;
CREATE POLICY "Auth update delete parking" ON cbq_parking_registrations FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public select emulation logs" ON cbq_emulation_logs;
CREATE POLICY "Public select emulation logs" ON cbq_emulation_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert emulation logs" ON cbq_emulation_logs;
CREATE POLICY "Public insert emulation logs" ON cbq_emulation_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth update emulation logs" ON cbq_emulation_logs;
CREATE POLICY "Auth update emulation logs" ON cbq_emulation_logs FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read user roles" ON cbq_user_roles;
CREATE POLICY "Public read user roles" ON cbq_user_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth manage user roles" ON cbq_user_roles;
CREATE POLICY "Auth manage user roles" ON cbq_user_roles FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read menus" ON cbq_navigation_menus;
CREATE POLICY "Public read menus" ON cbq_navigation_menus FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth manage menus" ON cbq_navigation_menus;
CREATE POLICY "Auth manage menus" ON cbq_navigation_menus FOR ALL USING (auth.role() = 'authenticated');

-- 4. TẠO INDEXES TỐI ƯU HIỆU NĂNG CHO 5.000+ BẢN GHI
CREATE INDEX IF NOT EXISTS idx_students_code ON cbq_students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_class ON cbq_students(student_class);

CREATE INDEX IF NOT EXISTS idx_parking_plate ON cbq_parking_registrations(license_plate);
CREATE INDEX IF NOT EXISTS idx_parking_code ON cbq_parking_registrations(ticket_code);

CREATE INDEX IF NOT EXISTS idx_emulation_week ON cbq_emulation_logs(week_number);
CREATE INDEX IF NOT EXISTS idx_emulation_class ON cbq_emulation_logs(student_class);
