-- MASTER SQL SETUP FOR SUPABASE 2
-- Created: 2026-09-09T00:46:57.588Z

-- ==========================================
-- FILE: 01_smart_school_updates.sql
-- ==========================================
-- =======================================================
-- MIGRATION SCRIPT: SMART SCHOOL 4.0 E-APPROVAL SYSTEM
-- =======================================================

-- 1. Bổ sung trường is_approved và approved_at vào bảng cbq_feedback_topics
-- Để đánh dấu văn bản dự thảo đã được Hiệu trưởng phê duyệt & ban hành
ALTER TABLE cbq_feedback_topics 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- 2. Đảm bảo bảng cbq_docs (Văn bản - Thông báo) tồn tại để có thể push dự thảo đã duyệt sang
CREATE TABLE IF NOT EXISTS cbq_docs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Thông báo', -- Ví dụ: Thông báo, Quyết định, Dự thảo
    content TEXT,
    document_url TEXT, -- Link file PDF nếu có
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_public BOOLEAN DEFAULT true,
    author TEXT,
    reference_number TEXT -- Số hiệu văn bản
);

-- =======================================================
-- Bảng hỗ trợ gửi tin nhắn AI Chatbot (Tùy chọn tương lai)
-- =======================================================
CREATE TABLE IF NOT EXISTS cbq_chatbot_logs (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_query TEXT NOT NULL,
    bot_response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ==========================================
-- FILE: 02_student_roles.sql
-- ==========================================
-- =======================================================
-- MIGRATION SCRIPT: STUDENT ROLES & PROFESSIONAL MODULES
-- =======================================================

-- 1. Bảng lưu trữ tài khoản Học sinh (nếu chưa có)
CREATE TABLE IF NOT EXISTS cbq_student_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Bổ sung chức vụ cho học sinh (nếu bảng đã có từ trước nhưng thiếu cột role)
ALTER TABLE cbq_student_users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'; -- member, class_president, vp_academics, inspector, youth_union_secretary

-- 2. Bảng Sổ đầu bài điện tử (Dành cho Lớp trưởng)
CREATE TABLE IF NOT EXISTS cbq_class_journals (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_number INTEGER NOT NULL, -- Tiết mấy (1-10)
    subject TEXT NOT NULL,
    teacher_name TEXT,
    absent_students TEXT, -- Danh sách vắng
    notes TEXT, -- Nhận xét tiết học
    status TEXT DEFAULT 'pending', -- pending, approved (Đợi GVCN duyệt)
    logged_by TEXT NOT NULL, -- username của Lớp trưởng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Phân công trực nhật (Dành cho Lớp trưởng)
CREATE TABLE IF NOT EXISTS cbq_duty_rosters (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    duty_date DATE NOT NULL,
    assigned_students TEXT NOT NULL,
    task_description TEXT,
    is_completed BOOLEAN DEFAULT false,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Chấm điểm nề nếp (Dành cho Cờ đỏ)
CREATE TABLE IF NOT EXISTS cbq_discipline_records (
    id SERIAL PRIMARY KEY,
    inspected_class TEXT NOT NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    violation_type TEXT NOT NULL, -- VD: Không đeo thẻ, Xả rác, Trễ học
    point_deduction INTEGER DEFAULT 0,
    evidence_url TEXT, -- Link ảnh chụp nếu có
    notes TEXT,
    logged_by TEXT NOT NULL, -- username của Cờ đỏ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Bảng Quản lý Quỹ đoàn/Quỹ lớp (Dành cho Bí thư)
CREATE TABLE IF NOT EXISTS cbq_youth_union_funds (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL, -- 'thu' hoặc 'chi'
    description TEXT NOT NULL,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ==========================================
-- FILE: 03_student_roles_extended.sql
-- ==========================================
-- =======================================================
-- MIGRATION SCRIPT: STUDENT ROLES EXTENDED MODULES
-- =======================================================

-- 1. Bảng Báo cáo chuyên cần học tập (Dành cho Lớp phó HT)
CREATE TABLE IF NOT EXISTS cbq_academic_reports (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subject TEXT NOT NULL,
    missing_homework_students TEXT,
    not_memorized_students TEXT,
    notes TEXT,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Điểm danh Sự kiện (Dành cho Bí thư)
CREATE TABLE IF NOT EXISTS cbq_event_attendance (
    id SERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    class_name TEXT NOT NULL,
    attended_students TEXT NOT NULL,
    total_attended INTEGER DEFAULT 0,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ==========================================
-- FILE: 04_teacher_ecosystem.sql
-- ==========================================
-- =======================================================
-- MIGRATION SCRIPT: TEACHER ECOSYSTEM
-- =======================================================

-- 1. Bảng Tài khoản Giáo viên
CREATE TABLE IF NOT EXISTS cbq_teacher_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    homeroom_class TEXT, -- Lớp chủ nhiệm (có thể null nếu chỉ là GV bộ môn)
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Thêm tài khoản test (Mật khẩu mặc định là 123456, bạn nên đổi sau)
INSERT INTO cbq_teacher_users (username, password_hash, full_name, homeroom_class)
VALUES ('gv.nguyenvana', '123456', 'Nguyễn Văn A', '10A1')
ON CONFLICT (username) DO NOTHING;

-- 2. Bảng Các đợt thu tiền (Fee Campaigns)
CREATE TABLE IF NOT EXISTS cbq_fee_campaigns (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    campaign_name TEXT NOT NULL, -- VD: Quỹ lớp Học kỳ 1, Tiền BHYT
    amount_per_student INTEGER NOT NULL, -- Số tiền/1 HS
    deadline DATE,
    created_by TEXT NOT NULL, -- username của GVCN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Lịch sử Nộp tiền của Học sinh (Fee Transactions)
CREATE TABLE IF NOT EXISTS cbq_fee_transactions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES cbq_fee_campaigns(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    amount_paid INTEGER NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'Tiền mặt', -- Tiền mặt, Chuyển khoản
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);


-- ==========================================
-- FILE: 05_digital_vault.sql
-- ==========================================
-- =======================================================
-- MIGRATION SCRIPT: DIGITAL VAULT (SỐ HÓA VĂN BẰNG)
-- =======================================================

-- 1. Bảng lưu trữ Văn bằng, Giấy tờ số hóa
CREATE TABLE IF NOT EXISTS cbq_digital_documents (
    id SERIAL PRIMARY KEY,
    document_code TEXT UNIQUE NOT NULL, -- Mã tra cứu QR code duy nhất
    student_name TEXT NOT NULL,         -- Tên học sinh nhận
    student_class TEXT NOT NULL,        -- Lớp của học sinh
    document_type TEXT NOT NULL,        -- Loại giấy tờ (Giấy khen, Giấy chứng nhận,...)
    title TEXT NOT NULL,                -- Tiêu đề (VD: Chứng nhận Học sinh Giỏi)
    content TEXT,                       -- Nội dung chi tiết (nếu có)
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Ngày cấp
    issued_by TEXT NOT NULL,            -- Tên người/đơn vị cấp (VD: BGH, Đoàn trường)
    status TEXT DEFAULT 'Active',       -- Trạng thái: Active, Revoked (Thu hồi)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tạo một vài bản ghi mẫu để test
INSERT INTO cbq_digital_documents (document_code, student_name, student_class, document_type, title, content, issued_by)
VALUES 
('CBQ-2026-GK001', 'Nguyễn Văn A', '10A1', 'Giấy khen', 'Giấy khen Học sinh Giỏi', 'Đã có thành tích xuất sắc trong học tập học kỳ 1.', 'Hiệu trưởng'),
('CBQ-2026-CN002', 'Trần Thị B', '11A2', 'Giấy chứng nhận', 'Chứng nhận Cán bộ Đoàn xuất sắc', 'Đóng góp tích cực cho phong trào thanh niên.', 'BCH Đoàn trường')
ON CONFLICT (document_code) DO NOTHING;


-- ==========================================
-- FILE: 06_quiz_optimizations.sql
-- ==========================================
-- 06_quiz_optimizations.sql
-- Hàm lấy danh sách học sinh chưa tham gia thi trắc nghiệm
-- Chạy script này trong giao diện SQL Editor của Supabase

CREATE OR REPLACE FUNCTION get_unsubmitted_students()
RETURNS TABLE (
  student_code text,
  full_name text,
  student_class text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.student_code, 
    s.student_name AS full_name, 
    s.student_class
  FROM cbq_students s
  LEFT JOIN cbq_quiz_submissions q 
    ON LOWER(TRIM(s.student_code)) = LOWER(TRIM(q.student_code))
  WHERE q.id IS NULL
  ORDER BY s.student_class ASC, s.student_name ASC;
END;
$$ LANGUAGE plpgsql;

-- Tối ưu hóa truy vấn trên bằng Expression Index (Chạy độc lập sau khi tạo bảng)
-- Lưu ý: Bạn cần chạy 2 lệnh CREATE INDEX này trong mục SQL Editor để tăng tốc
-- truy vấn sử dụng hàm LOWER(TRIM(student_code)).

CREATE INDEX IF NOT EXISTS idx_stu_code_cbq_students 
ON cbq_students (LOWER(TRIM(student_code)));

CREATE INDEX IF NOT EXISTS idx_stu_code_cbq_quiz 
ON cbq_quiz_submissions (LOWER(TRIM(student_code)));


-- ==========================================
-- FILE: 07_app_hub.sql
-- ==========================================
-- =======================================================
-- MIGRATION SCRIPT: DYNAMIC APP HUB & PERSONALIZATION
-- =======================================================

-- 1. Thêm các cột cần thiết vào bảng cbq_external_links có sẵn
ALTER TABLE cbq_external_links 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'public', -- 'public', 'hub_global', 'hub_personal'
ADD COLUMN IF NOT EXISTS category TEXT, -- Dùng để nhóm trong Cổng Tiện Ích
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS bg_color TEXT,
ADD COLUMN IF NOT EXISTS border_color TEXT,
ADD COLUMN IF NOT EXISTS owner_id TEXT; -- Mã giáo viên (username hoặc ID) nếu là 'hub_personal'

-- 2. Cập nhật các bản ghi cũ thành 'public'
UPDATE cbq_external_links SET type = 'public' WHERE type IS NULL;

-- 3. Chèn (Seed) các phần mềm mặc định của Cổng Tiện Ích vào (nếu chưa có)
-- Lưu ý: Kiểm tra trùng lặp dựa trên url để không bị chèn nhiều lần nếu chạy script lại
INSERT INTO cbq_external_links (title, url, type, category, description, icon, bg_color, border_color, order_index, is_active)
SELECT * FROM (VALUES 
    ('SMAS', 'https://smas.edu.vn', 'hub_global', 'Hệ thống Quản lý Giảng dạy', 'Hệ thống quản lý điểm và học bạ điện tử (Viettel).', 'GraduationCap', '#fee2e2', '#fca5a5', 1, true),
    ('CSDL Ngành', 'https://csdl.moet.gov.vn', 'hub_global', 'Hệ thống Quản lý Giảng dạy', 'Cơ sở dữ liệu ngành Giáo dục.', 'BookOpen', '#dbeafe', '#93c5fd', 2, true),
    ('Azota', 'https://azota.vn', 'hub_global', 'Thi & Kiểm tra Trực tuyến', 'Giao bài tập, tạo đề thi trắc nghiệm trực tuyến.', 'PenTool', '#dcfce7', '#86efac', 3, true),
    ('K12Online', 'https://k12online.vn', 'hub_global', 'Thi & Kiểm tra Trực tuyến', 'Hệ thống quản lý học tập và thi trực tuyến (Viettel).', 'Monitor', '#fef3c7', '#fcd34d', 4, true),
    ('OLM', 'https://olm.vn', 'hub_global', 'Thi & Kiểm tra Trực tuyến', 'Hệ thống học tập, thi trực tuyến (ĐH Quốc gia HN).', 'FileText', '#ccfbf1', '#5eead4', 5, true),
    ('Email Trường', 'https://mail.google.com', 'hub_global', 'Hành chính & Nội bộ', 'Hệ thống thư điện tử nội bộ.', 'Mail', '#e0e7ff', '#a5b4fc', 6, true),
    ('Website Trường', '/', 'hub_global', 'Hành chính & Nội bộ', 'Cổng thông tin điện tử của trường.', 'Globe', '#cffafe', '#67e8f9', 7, true)
) AS v(title, url, type, category, description, icon, bg_color, border_color, order_index, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM cbq_external_links WHERE type = 'hub_global' AND cbq_external_links.url = v.url
);


-- ==========================================
-- FILE: 07_create_departments_table.sql
-- ==========================================
-- 07_create_departments_table.sql
-- Kịch bản tạo bảng Quản lý Tổ Chuyên Môn

CREATE TABLE IF NOT EXISTS cbq_departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bật Row Level Security (nếu cần thiết, nếu ứng dụng chưa dùng RLS thì bỏ qua)
-- ALTER TABLE cbq_departments ENABLE ROW LEVEL SECURITY;

-- Di chuyển dữ liệu mặc định vào bảng
INSERT INTO cbq_departments (name, sort_order) VALUES 
('Ban Giám Hiệu', 1),
('Tổ Toán - Tin', 2),
('Tổ Ngữ Văn', 3),
('Tổ Ngoại Ngữ', 4),
('Tổ Lý - Hóa - Sinh', 5),
('Tổ Sử - Địa - GDCD', 6),
('Tổ Thể Dục - QQP', 7),
('Tổ Văn Phòng & Kế Toán', 8)
ON CONFLICT DO NOTHING;


-- ==========================================
-- FILE: 08_create_dynamic_registrations.sql
-- ==========================================
-- 08_create_dynamic_registrations.sql
-- Kịch bản tạo bảng Quản lý Đăng ký Nội Dung Động

-- 1. Bảng lưu trữ các đợt đăng ký (Campaigns)
CREATE TABLE IF NOT EXISTS cbq_registration_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  target_grades text[], -- Mảng lưu trữ danh sách khối được áp dụng, VD: ['Khối 10', 'Khối 11']. Rỗng = Áp dụng toàn trường.
  form_schema jsonb NOT NULL DEFAULT '[]'::jsonb, -- Cấu trúc các câu hỏi/lựa chọn trong form
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng lưu trữ phản hồi/kết quả đăng ký của học sinh
CREATE TABLE IF NOT EXISTS cbq_student_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES cbq_registration_campaigns(id) ON DELETE CASCADE,
  student_code text NOT NULL,
  student_name text NOT NULL,
  student_class text,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb, -- Câu trả lời của học sinh định dạng JSON
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Ràng buộc mỗi học sinh chỉ được đăng ký 1 lần cho mỗi chiến dịch
  UNIQUE(campaign_id, student_code)
);

-- Bật Row Level Security (nếu hệ thống đã được thiết lập RLS)
-- ALTER TABLE cbq_registration_campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cbq_student_registrations ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- FILE: 08_security_and_logic_fixes.sql
-- ==========================================
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


-- ==========================================
-- FILE: 09_department_dossier_system.sql
-- ==========================================
-- ==============================================================================
-- SUPABASE SCHEMA: HỆ THỐNG QUẢN LÝ & PHÊ DUYỆT HỒ SƠ TỔ CHUYÊN MÔN
-- Quy trình 3 cấp: Giáo viên -> Tổ trưởng Chuyên môn (TTCM) -> Ban Giám Hiệu (BGH)
-- Trường THPT Cao Bá Quát
-- ==============================================================================

-- 1. BẢNG DANH MỤC CÁC LOẠI HỒ SƠ QUY ĐỊNH
CREATE TABLE IF NOT EXISTS public.cbq_dossier_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'teacher', -- 'teacher' (Cá nhân) hoặc 'department' (Tổ)
    frequency TEXT DEFAULT 'weekly', -- 'weekly' (Hàng tuần), 'monthly', 'term', 'yearly'
    description TEXT,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bơm dữ liệu danh mục mặc định theo Thông tư 32/2020/TT-BGDĐT
INSERT INTO public.cbq_dossier_categories (code, title, target_type, frequency, description, is_required)
VALUES 
    ('GIAO_AN_TUAN', 'Kế hoạch bài dạy (Giáo án tuần)', 'teacher', 'weekly', 'Nộp trước khi lên lớp 2-3 ngày theo tuần học', true),
    ('KH_GIAO_DUC_CA_NHAN', 'Kế hoạch giáo dục cá nhân', 'teacher', 'yearly', 'Nộp vào đầu năm học', true),
    ('SO_CHU_NHIEM', 'Sổ công tác Chủ nhiệm (dành cho GVCN)', 'teacher', 'term', 'Cập nhật theo học kỳ', false),
    ('KH_TO_CHUYEN_MON', 'Kế hoạch giáo dục của Tổ chuyên môn', 'department', 'yearly', 'Do Tổ trưởng lập và nộp cho BGH duyệt', true),
    ('BIEN_BAN_HOP_TO', 'Biên bản sinh hoạt Tổ chuyên môn', 'department', 'monthly', 'Định kỳ 2 tuần hoặc 1 tháng / lần', true),
    ('SO_BOI_DUONG_HSG', 'Sổ bồi dưỡng HSG & Phụ đạo HS yếu', 'department', 'term', 'Báo cáo công tác bồi dưỡng', false)
ON CONFLICT (code) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 2. BẢNG CHI TIẾT NỘP HỒ SƠ & GIÁO ÁN
CREATE TABLE IF NOT EXISTS public.cbq_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.cbq_dossier_categories(id) ON DELETE SET NULL,
    category_code TEXT,
    department_name TEXT NOT NULL, -- 'Tổ Toán - Tin', 'Tổ Ngữ Văn'...
    teacher_name TEXT NOT NULL,
    teacher_code TEXT,
    school_year TEXT NOT NULL DEFAULT '2025-2026',
    term TEXT DEFAULT 'HK1',
    week_number INT DEFAULT 1,
    title TEXT NOT NULL,
    file_url TEXT, -- File PDF/Word upload trên Supabase/Server
    drive_url TEXT, -- Link Google Drive / Docs dự phòng
    status TEXT DEFAULT 'pending', -- 'pending' (Chờ duyệt), 'approved' (Đã duyệt), 'rejected' (Yêu cầu sửa lại)
    reviewer_name TEXT,
    reviewer_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG THANH TRA & ĐÁNH GIÁ CỦA BGH / LÃNH ĐẠO
CREATE TABLE IF NOT EXISTS public.cbq_dossier_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES public.cbq_dossiers(id) ON DELETE CASCADE,
    inspector_name TEXT NOT NULL,
    inspector_role TEXT NOT NULL DEFAULT 'BGH', -- 'TTCM', 'BGH', 'THANH_TRA'
    rating_score TEXT DEFAULT 'Tốt', -- 'Tốt', 'Đạt', 'Cần bổ sung'
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CẤU HÌNH RLS SECURITY POLICIES
ALTER TABLE public.cbq_dossier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_dossier_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.cbq_dossier_categories;
DROP POLICY IF EXISTS "Public read dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public insert dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public update dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public delete dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public read inspections" ON public.cbq_dossier_inspections;
DROP POLICY IF EXISTS "Public insert inspections" ON public.cbq_dossier_inspections;

CREATE POLICY "Public read categories" ON public.cbq_dossier_categories FOR SELECT USING (true);

CREATE POLICY "Public read dossiers" ON public.cbq_dossiers FOR SELECT USING (true);
CREATE POLICY "Public insert dossiers" ON public.cbq_dossiers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update dossiers" ON public.cbq_dossiers FOR UPDATE USING (true);
CREATE POLICY "Public delete dossiers" ON public.cbq_dossiers FOR DELETE USING (true);

CREATE POLICY "Public read inspections" ON public.cbq_dossier_inspections FOR SELECT USING (true);
CREATE POLICY "Public insert inspections" ON public.cbq_dossier_inspections FOR INSERT WITH CHECK (true);

-- 5. TẠO INDEXES TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_dossiers_dept ON public.cbq_dossiers(department_name);
CREATE INDEX IF NOT EXISTS idx_dossiers_teacher ON public.cbq_dossiers(teacher_name);
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON public.cbq_dossiers(status);
CREATE INDEX IF NOT EXISTS idx_dossiers_week ON public.cbq_dossiers(week_number);


-- ==========================================
-- FILE: 10_timetable_system.sql
-- ==========================================
-- ==============================================================================
-- SQL SCRIPT TẠO BẢNG THỜI KHÓA BIỂU TOÀN TRƯỜNG (CBQ_TIMETABLE_ITEMS)
-- TRƯỜNG THPT CAO BÁ QUÁT
-- ==============================================================================

-- 1. Tạo bảng lưu trữ thông tin Tiết học trong Thời khóa biểu
CREATE TABLE IF NOT EXISTS public.cbq_timetable_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_class VARCHAR(50) NOT NULL,          -- Tên lớp (VD: 10A1, 11A2, 12A5)
    day_of_week VARCHAR(50) NOT NULL,            -- Thứ trong tuần (VD: Thứ 2, Thứ 3... Thứ 7)
    period INT NOT NULL,                         -- Tiết học thứ mấy (Tiết 1 đến Tiết 10)
    subject VARCHAR(100) NOT NULL,               -- Tên môn học (VD: Toán, Ngữ văn, Tiếng Anh)
    teacher_name VARCHAR(150) NOT NULL,          -- Tên giáo viên giảng dạy (VD: Thầy Nguyễn Văn A)
    room VARCHAR(100) DEFAULT 'Lớp học',          -- Phòng học (VD: P.101, Phòng Lab 1, Sân trường)
    school_year VARCHAR(50) DEFAULT '2025-2026',    -- Năm học
    term VARCHAR(50) DEFAULT 'HK1',              -- Học kỳ (HK1 / HK2)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bật Row Level Security (RLS) để phân quyền an toàn
ALTER TABLE public.cbq_timetable_items ENABLE ROW LEVEL SECURITY;

-- 3. Tạo chính sách đọc dữ liệu công khai (Mọi người đều tra cứu được TKB)
DROP POLICY IF EXISTS "Allow public read access to cbq_timetable_items" ON public.cbq_timetable_items;
CREATE POLICY "Allow public read access to cbq_timetable_items" 
ON public.cbq_timetable_items 
FOR SELECT 
USING (true);

-- 4. Tạo chính sách cho phép Thêm, Sửa, Xóa TKB
DROP POLICY IF EXISTS "Allow full access to cbq_timetable_items" ON public.cbq_timetable_items;
CREATE POLICY "Allow full access to cbq_timetable_items" 
ON public.cbq_timetable_items 
FOR ALL 
USING (true);

-- 5. Tạo Index tối ưu hóa tốc độ tra cứu TKB theo Lớp và theo Giáo viên
CREATE INDEX IF NOT EXISTS idx_cbq_timetable_class ON public.cbq_timetable_items(student_class);
CREATE INDEX IF NOT EXISTS idx_cbq_timetable_teacher ON public.cbq_timetable_items(teacher_name);


-- ==========================================
-- FILE: roles.sql
-- ==========================================


-- ==========================================
-- FILE: setup_gallery.sql
-- ==========================================
-- Chạy script này trong Supabase SQL Editor
CREATE TABLE IF NOT EXISTS cbq_gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  uploaded_by text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Cho phép mọi người xem ảnh đã duyệt
CREATE POLICY "Cho phép đọc ảnh public" ON cbq_gallery
  FOR SELECT USING (is_approved = true);

-- Bật RLS (Row Level Security) - Tùy chọn
ALTER TABLE cbq_gallery ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- FILE: setup_phase2.sql
-- ==========================================
-- Chạy script này trong Supabase SQL Editor

-- 1. Bảng lưu log hoạt động
CREATE TABLE IF NOT EXISTS cbq_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL, -- e.g., 'UPDATE_TASK', 'ADD_SPONSOR'
  description text NOT NULL,
  performed_by text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Lịch trình sự kiện (Agenda)
CREATE TABLE IF NOT EXISTS cbq_agenda (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  time_start text NOT NULL, -- e.g., '08:00'
  time_end text NOT NULL,   -- e.g., '09:00'
  activity_name text NOT NULL,
  location text,
  is_public boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Đăng ký tiết mục văn nghệ / hoạt động
CREATE TABLE IF NOT EXISTS cbq_performances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_name text NOT NULL,
  contact_info text,
  performance_type text NOT NULL, -- e.g., 'Hát', 'Múa', 'Gian hàng'
  performance_name text NOT NULL,
  description text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bật RLS và cấp quyền đọc (ví dụ cho public)
ALTER TABLE cbq_agenda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public có thể xem lịch trình" ON cbq_agenda FOR SELECT USING (is_public = true);

ALTER TABLE cbq_performances ENABLE ROW LEVEL SECURITY;
-- Mọi người có thể insert tiết mục
CREATE POLICY "Public có thể đăng ký tiết mục" ON cbq_performances FOR INSERT WITH CHECK (true);
-- Mọi người có thể xem tiết mục đã duyệt
CREATE POLICY "Public có thể xem tiết mục đã duyệt" ON cbq_performances FOR SELECT USING (is_approved = true);

-- Audit log thì chỉ Admin/Secretary được xem (ở đây tắt RLS cho đơn giản hoặc cho phép mọi authenticated xem)
ALTER TABLE cbq_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép đọc audit log" ON cbq_audit_log FOR SELECT USING (true);
CREATE POLICY "Cho phép ghi audit log" ON cbq_audit_log FOR INSERT WITH CHECK (true);


-- ==========================================
-- FILE: setup_phase3_invites.sql
-- ==========================================
-- Chạy script này trong Supabase SQL Editor để cập nhật cơ sở dữ liệu cho tính năng Thiệp Mời

-- 1. Thêm cột email vào bảng cbq_guests (nếu chưa có)
ALTER TABLE cbq_guests ADD COLUMN IF NOT EXISTS email text;

-- 2. Chèn cấu hình mặc định cho thiệp mời vào bảng cbq_pages
-- Slug: invite-config
-- Dữ liệu JSON chứa thời gian, địa điểm, sự kiện và lịch trình
INSERT INTO cbq_pages (slug, title, content)
VALUES (
    'invite-config',
    'Cấu hình Thiệp Mời Điện Tử',
    '{"time": "08:00, Chủ nhật, 15/11/2026", "location": "Sân trường THPT Cao Bá Quát", "event_name": "Lễ Kỷ Niệm 30 Năm Thành Lập Trường", "agenda": ["08:00 - 08:30: Đón tiếp đại biểu", "08:30 - 10:30: Lễ mít tinh kỷ niệm", "10:30 - 11:30: Giao lưu các thế hệ", "11:30: Tiệc thân mật"]}'
)
ON CONFLICT (slug) DO NOTHING;


-- ==========================================
-- FILE: setup_storage.sql
-- ==========================================
-- Chạy script này trong Supabase SQL Editor để tạo kho lưu trữ ảnh (Storage Bucket)

-- 1. Tạo bucket tên là 'gallery' và đặt ở chế độ Public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Cho phép tất cả mọi người được xem ảnh trong bucket 'gallery'
CREATE POLICY "Cho phép mọi người xem ảnh" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'gallery');

-- 3. Cho phép upload ảnh vào bucket 'gallery' (Tạm thời mở public để Admin có thể upload từ web)
CREATE POLICY "Cho phép upload ảnh" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'gallery');

-- 4. Cho phép xóa ảnh
CREATE POLICY "Cho phép xóa ảnh" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'gallery');


-- ==========================================
-- FILE: supabase_schema_bus.sql
-- ==========================================
-- 1. Create cbq_bus_packages table
CREATE TABLE IF NOT EXISTS cbq_bus_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    months_count INTEGER NOT NULL,
    fee_amount NUMERIC NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hide_fee BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure package_key is unique just in case it was created without it previously
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cbq_bus_packages_package_key_key' 
           OR conname = 'cbq_bus_packages_package_key_unique'
    ) THEN
        ALTER TABLE cbq_bus_packages ADD CONSTRAINT cbq_bus_packages_package_key_key UNIQUE (package_key);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- constraint already exists
        NULL;
END $$;

-- Insert Default Bus Packages
INSERT INTO cbq_bus_packages (package_key, title, months_count, fee_amount, description, sort_order, is_active)
VALUES
('month_2way', '2 Chieu - Theo Thang', 1, 300000, 'Thoi han 1 thang, dua don 2 chieu (300.000 VNĐ)', 1, true),
('term_2way', '2 Chieu - Theo Hoc Ky', 5, 1400000, 'Dua don 2 chieu, thoi han 5 thang', 2, true),
('month_1way', '1 Chieu - Theo Thang', 1, 180000, 'Thoi han 1 thang, dua don 1 chieu (180.000 VNĐ)', 3, true)
ON CONFLICT (package_key) DO UPDATE SET 
  title = EXCLUDED.title,
  fee_amount = EXCLUDED.fee_amount,
  description = EXCLUDED.description;

-- 2. Add columns to cbq_bus_registrations if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'package_type') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN package_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'start_date') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN start_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'end_date') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN end_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'fee_amount') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN fee_amount NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'status') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) FOR BUS PACKAGES
-- ==========================================
ALTER TABLE cbq_bus_packages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view active bus packages" ON cbq_bus_packages;
    DROP POLICY IF EXISTS "Authenticated users manage bus packages" ON cbq_bus_packages;
END $$;

CREATE POLICY "Public can view active bus packages" 
ON cbq_bus_packages FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users manage bus packages" 
ON cbq_bus_packages FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- BUS SETTINGS TABLE AND RLS
-- ==========================================
CREATE TABLE IF NOT EXISTS cbq_bus_settings (
  id integer PRIMARY KEY DEFAULT 1,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

INSERT INTO cbq_bus_settings (id, is_open, notice_message) 
VALUES (1, true, 'He thong dang ky xe dua don hien dang mo.') 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE cbq_bus_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view bus settings" ON cbq_bus_settings;
    DROP POLICY IF EXISTS "Authenticated users manage bus settings" ON cbq_bus_settings;
END $$;

CREATE POLICY "Public can view bus settings" ON cbq_bus_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users manage bus settings" ON cbq_bus_settings FOR ALL USING (auth.role() = 'authenticated');


-- ==========================================
-- FILE: supabase_schema_emulation.sql
-- ==========================================
-- SQL Script for Class Emulation & Weekly Inspection System

-- 1. Criteria Table
CREATE TABLE IF NOT EXISTS cbq_emulation_criteria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL, -- e.g. "Nếp sống & Đồng phục", "Vệ sinh lớp học", "Học tập & Truy bài", "Sĩ số & Bỏ tiết", "Khen thưởng & Xung kích"
  title text NOT NULL, -- e.g. "Không mặc đồng phục / Không đeo thẻ", "Vệ sinh lớp muộn", "Bỏ tiết / Vắng không phép"
  score_change numeric NOT NULL, -- negative for penalty (e.g. -5), positive for bonus (e.g. +5)
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Daily Log Entries Table
CREATE TABLE IF NOT EXISTS cbq_emulation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number integer NOT NULL DEFAULT 1, -- e.g. 1, 2, 3...
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  student_class text NOT NULL, -- e.g. "10A1"
  grade_level text, -- e.g. "Khối 10"
  criteria_title text NOT NULL,
  category text NOT NULL,
  score_change numeric NOT NULL,
  reason text,
  reporter_name text DEFAULT 'Đội Cờ Đỏ',
  status text DEFAULT 'approved', -- 'approved', 'pending'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_emulation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view criteria" ON cbq_emulation_criteria FOR SELECT USING (true);
CREATE POLICY "Auth manage criteria" ON cbq_emulation_criteria FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public view logs" ON cbq_emulation_logs FOR SELECT USING (true);
CREATE POLICY "Public insert logs" ON cbq_emulation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth manage logs" ON cbq_emulation_logs FOR ALL USING (auth.role() = 'authenticated');

-- Sample Initial Criteria Data
INSERT INTO cbq_emulation_criteria (category, title, score_change) VALUES
('Nếp sống & Đồng phục', 'Không đeo thẻ / Không mặc đồng phục', -5),
('Nếp sống & Đồng phục', 'Đi học muộn / Nắm tóc, trang phục sai quy định', -5),
('Vệ sinh & Cảnh quan', 'Vệ sinh lớp / sân trường muộn hoặc bẩn', -5),
('Vệ sinh & Cảnh quan', 'Quên tắt điện, quạt khi ra khỏi lớp', -5),
('Học tập & Truy bài', 'Truy bài đầu giờ mất trật tự', -5),
('Học tập & Truy bài', 'Lớp học có học sinh bị điểm 1 - 2', -5),
('Sĩ số & Kỷ luật', 'Học sinh bỏ tiết / trốn học', -10),
('Sĩ số & Kỷ luật', 'Học sinh vắng không lý do', -5),
('Khen thưởng & Xung kích', 'Tuyên dương tập thể / Chi đoàn xuất sắc', 10),
('Khen thưởng & Xung kích', 'Đạt nhiều điểm 9 - 10 trong tuần', 5)
ON CONFLICT DO NOTHING;


-- ==========================================
-- FILE: supabase_schema_general_feedback.sql
-- ==========================================
-- =========================================================
-- HỆ THỐNG QUẢN LÝ & CẤU HÌNH GÓP Ý CÔNG VIỆC / ĐỀ ÁN TRƯỜNG THPT CAO BÁ QUÁT
-- =========================================================

-- 1. Bảng Chủ đề / Công việc cần lấy ý kiến
CREATE TABLE IF NOT EXISTS cbq_feedback_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    dispatch_number TEXT,
    description TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    contact_info TEXT,
    attached_doc_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Phản hồi / Ý kiến đóng góp cho từng công việc
CREATE TABLE IF NOT EXISTS cbq_feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES cbq_feedback_topics(id) ON DELETE CASCADE,
    organization_unit TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    agreement_level TEXT DEFAULT 'thong_nhat',
    feedback_content TEXT NOT NULL,
    attached_file_url TEXT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_feedback_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_feedback_responses ENABLE ROW LEVEL SECURITY;

-- Policies for Topics
DROP POLICY IF EXISTS "Public read topics" ON cbq_feedback_topics;
DROP POLICY IF EXISTS "Admin manage topics" ON cbq_feedback_topics;

CREATE POLICY "Public read topics" ON cbq_feedback_topics FOR SELECT USING (true);
CREATE POLICY "Admin manage topics" ON cbq_feedback_topics FOR ALL USING (true);

-- Policies for Responses
DROP POLICY IF EXISTS "Public read responses" ON cbq_feedback_responses;
DROP POLICY IF EXISTS "Public insert responses" ON cbq_feedback_responses;
DROP POLICY IF EXISTS "Admin manage responses" ON cbq_feedback_responses;

CREATE POLICY "Public read responses" ON cbq_feedback_responses FOR SELECT USING (true);
CREATE POLICY "Public insert responses" ON cbq_feedback_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage responses" ON cbq_feedback_responses FOR ALL USING (true);

-- SEED CHỦ ĐỀ MẶC ĐỊNH: ĐỀ ÁN QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ TUỔI HỌC TRÒ"
INSERT INTO cbq_feedback_topics (id, title, dispatch_number, description, deadline, contact_info, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    'Dự thảo Đề án Thành lập Quỹ Học bổng "Chắp cánh ước mơ tuổi học trò" Trường THPT Cao Bá Quát',
    'Công văn số 409/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ',
    'Căn cứ Công văn 409/SGDĐT-VP ngày 11/02/2026 của Sở GD&ĐT và Kế hoạch 53/KH-TrTHPTCBQ ngày 12/3/2026. Đề nghị BCH Đảng ủy, BTV Đoàn trường, các Tổ chuyên môn & Tổ Văn phòng gửi góp ý về dự thảo Đề án Quỹ học bổng.',
    '2026-08-19T23:59:59+07:00',
    'Đồng chí Nghiêm Xuân Bảo – Nhân viên Tổ Văn phòng',
    true
)
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- FILE: supabase_schema_guestbook.sql
-- ==========================================
-- BẢNG SỔ LƯU BÚT ĐIỆN TỬ (GUESTBOOK)

CREATE TABLE IF NOT EXISTS public.cbq_guestbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT NOT NULL,
    author_category TEXT NOT NULL DEFAULT 'Khách mời',
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật Row Level Security
ALTER TABLE public.cbq_guestbook ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép Public đọc bài viết (đã được duyệt)
CREATE POLICY "Public can view approved guestbook entries" 
ON public.cbq_guestbook FOR SELECT 
USING (is_approved = true);

-- 2. Cho phép Public tạo bài viết mới (mặc định is_approved = true)
CREATE POLICY "Public can insert guestbook entries" 
ON public.cbq_guestbook FOR INSERT 
WITH CHECK (true);

-- 3. Cho phép Public cập nhật (chỉ dùng để tăng số lượng likes_count)
CREATE POLICY "Public can like guestbook entries" 
ON public.cbq_guestbook FOR UPDATE 
USING (true);

-- 4. Cho phép Admin toàn quyền
CREATE POLICY "Admin full access guestbook" 
ON public.cbq_guestbook FOR ALL 
USING (auth.role() = 'authenticated');


-- ==========================================
-- FILE: supabase_schema_invitation.sql
-- ==========================================
-- Script tạo các bảng còn thiếu cho chức năng Thiệp mời Online (Online Invitation)

-- 1. Bảng cbq_guests (Khách mời & Đăng ký tham dự)
CREATE TABLE IF NOT EXISTS cbq_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_code TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    guest_category TEXT,
    group_name TEXT,
    category TEXT, -- Phân loại (được dùng trong AdminGuests và Public form)
    note TEXT, -- Ghi chú/lớp (được dùng trong Public form)
    rsvp_status TEXT DEFAULT 'pending',
    is_public_registration BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng cbq_sponsors (Bảng vàng tài trợ)
CREATE TABLE IF NOT EXISTS cbq_sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    donation_amount NUMERIC DEFAULT 0,
    donation_item TEXT,
    is_public BOOLEAN DEFAULT true,
    date_received TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng cbq_wishes (Sổ lưu bút / Lời chúc)
CREATE TABLE IF NOT EXISTS cbq_wishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID, -- Liên kết đến cbq_guests
    guest_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng cbq_gifts (Quà tặng ảo)
CREATE TABLE IF NOT EXISTS cbq_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID, -- Liên kết đến cbq_guests
    guest_name TEXT NOT NULL,
    gift_id TEXT NOT NULL,
    gift_name TEXT,
    gift_icon TEXT, -- Chứa emoji quà tặng
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Bảng cbq_pages (Lưu trữ cấu hình động như JSON)
CREATE TABLE IF NOT EXISTS cbq_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Kích hoạt Row Level Security (RLS)
ALTER TABLE cbq_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_pages ENABLE ROW LEVEL SECURITY;

-- Tạo Policy cho phép public xem và thêm dữ liệu (vì thiệp mời online là công khai)
CREATE POLICY "Public read access for guests" ON cbq_guests FOR SELECT USING (true);
CREATE POLICY "Public insert access for guests" ON cbq_guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for guests" ON cbq_guests FOR UPDATE USING (true);

CREATE POLICY "Public read access for sponsors" ON cbq_sponsors FOR SELECT USING (true);
CREATE POLICY "Public insert access for sponsors" ON cbq_sponsors FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for wishes" ON cbq_wishes FOR SELECT USING (true);
CREATE POLICY "Public insert access for wishes" ON cbq_wishes FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for gifts" ON cbq_gifts FOR SELECT USING (true);
CREATE POLICY "Public insert access for gifts" ON cbq_gifts FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for pages" ON cbq_pages FOR SELECT USING (true);
-- Admin mới được update cấu hình thiệp mời
CREATE POLICY "Public update access for pages" ON cbq_pages FOR UPDATE USING (true); 


-- ==========================================
-- FILE: supabase_schema_magazine.sql
-- ==========================================
-- Run this script in Supabase SQL Editor to set up the Magazine table

CREATE TABLE IF NOT EXISTS cbq_magazines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  pdf_url text,
  cover_image text,
  pages jsonb DEFAULT '[]'::jsonb, -- Array of { page_number, title, image_url }
  toc jsonb DEFAULT '[]'::jsonb,   -- Table of contents: Array of { title, page }
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_magazines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published magazines" ON cbq_magazines 
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can manage magazines" ON cbq_magazines 
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial sample magazine data for 30th Anniversary Souvenir Magazine
INSERT INTO cbq_magazines (title, description, pdf_url, cover_image, pages, toc, is_published)
VALUES (
  'TẬP SAN KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT',
  'Ấn phẩm đặc biệt ghi dấu hành trình 30 năm xây dựng, phát triển và tri ân các thế hệ nhà giáo, cựu học sinh trường THPT Cao Bá Quát (1996 - 2026).',
  '/tap-san-30-nam.pdf',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80',
  '[
    {"page_number": 1, "title": "Bìa Tập San", "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80"},
    {"page_number": 2, "title": "Lời Tựa & Thư Chúc Mừng", "image_url": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1000&q=80"},
    {"page_number": 3, "title": "Lịch Sử 30 Năm Hình Thành", "image_url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1000&q=80"},
    {"page_number": 4, "title": "Ban BGH Qua Các Thời Kỳ", "image_url": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1000&q=80"},
    {"page_number": 5, "title": "Tổ Chuyên Môn & Đoàn Đội", "image_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&q=80"},
    {"page_number": 6, "title": "Thơ Ca Tri Ân Thầy Cô", "image_url": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1000&q=80"},
    {"page_number": 7, "title": "Văn Xuôi & Ký Ức Mái Trường", "image_url": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=1000&q=80"},
    {"page_number": 8, "title": "Thư Viện Ảnh Kỷ Niệm 30 Năm", "image_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000&q=80"},
    {"page_number": 9, "title": "Cựu Học Sinh Tiêu Biểu", "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=80"},
    {"page_number": 10, "title": "Trang Bìa Sau & Lời Cảm Ơn", "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&q=80"}
  ]'::jsonb,
  '[
    {"title": "1. Trang Bìa Tập San", "page": 1},
    {"title": "2. Lời Tựa & Thư Chúc Mừng", "page": 2},
    {"title": "3. Lịch Sử 30 Năm Hình Thành", "page": 3},
    {"title": "4. Ban BGH Qua Các Thời Kỳ", "page": 4},
    {"title": "5. Các Tổ Chuyên Môn", "page": 5},
    {"title": "6. Thơ Ca Tri Ân Thầy Cô", "page": 6},
    {"title": "7. Ký Ức Mái Trường (Văn xuôi)", "page": 7},
    {"title": "8. Thư Viện Ảnh Kỷ Niệm", "page": 8},
    {"title": "9. Cựu Học Sinh Tiêu Biểu", "page": 9},
    {"title": "10. Lời Cảm Ơn & Bìa Sau", "page": 10}
  ]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;


-- ==========================================
-- FILE: supabase_schema_parking.sql
-- ==========================================
-- SQL Script for Student Motorbike Parking Management Module

CREATE TABLE IF NOT EXISTS cbq_parking_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code text UNIQUE NOT NULL, -- e.g. "PARK-11A1-001"
  student_name text NOT NULL,
  student_code text, -- Mã học sinh (nếu có)
  student_class text NOT NULL, -- e.g. "11A1", "12A3"
  grade_level text, -- "Khối 10", "Khối 11", "Khối 12"
  license_plate text NOT NULL, -- Biển số xe (e.g. "29B1-123.45")
  vehicle_type text DEFAULT 'Xe máy điện', -- "Xe máy điện", "Xe máy 50cc", "Xe máy >50cc"
  vehicle_color text, -- e.g. "Đen Đỏ"
  package_type text NOT NULL DEFAULT 'month', -- 'month' (Tháng), 'term' (Học kỳ), 'quarter' (Quý), 'year' (Cả năm)
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  fee_amount numeric DEFAULT 0,
  status text DEFAULT 'active', -- 'pending' (Chờ duyệt), 'active' (Đang hoạt động), 'expired' (Hết hạn)
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_parking_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view parking registrations" ON cbq_parking_registrations FOR SELECT USING (true);
CREATE POLICY "Public can register parking" ON cbq_parking_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users manage parking" ON cbq_parking_registrations FOR ALL USING (auth.role() = 'authenticated');

-- Initial Sample Data for Motorbike Parking
INSERT INTO cbq_parking_registrations 
(ticket_code, student_name, student_code, student_class, grade_level, license_plate, vehicle_type, vehicle_color, package_type, start_date, end_date, fee_amount, status)
VALUES
('PARK-11A1-001', 'Nguyễn Văn An', 'HS11A1-01', '11A1', 'Khối 11', '29B1-567.89', 'Xe máy điện', 'Đen nhám', 'term', '2026-09-01', '2027-01-15', 200000, 'active'),
('PARK-12A3-002', 'Trần Thị Bích', 'HS12A3-05', '12A3', 'Khối 12', '29H1-888.66', 'Xe máy 50cc', 'Trắng đỏ', 'year', '2026-09-01', '2027-05-31', 450000, 'active'),
('PARK-10A2-003', 'Phạm Minh Cường', 'HS10A2-12', '10A2', 'Khối 10', '29K1-345.12', 'Xe máy điện', 'Xanh dương', 'month', '2026-09-01', '2026-09-30', 50000, 'active')
ON CONFLICT (ticket_code) DO NOTHING;


-- ==========================================
-- FILE: supabase_schema_parking_config.sql
-- ==========================================
-- SQL Script for Motorbike Parking Fee Configuration & Security Control

CREATE TABLE IF NOT EXISTS cbq_parking_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_key text UNIQUE NOT NULL, -- e.g. 'month', 'quarter', 'term', 'year'
  title text NOT NULL, -- e.g. "Đăng ký Theo Tháng"
  months_count integer DEFAULT 1, -- Số tháng hiệu lực
  fee_amount numeric NOT NULL DEFAULT 50000, -- Mức phí VNĐ
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  applicable_vehicles text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_parking_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active parking packages" ON cbq_parking_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users manage parking packages" ON cbq_parking_packages FOR ALL USING (auth.role() = 'authenticated');

-- Sample Initial Configured Packages
INSERT INTO cbq_parking_packages (package_key, title, months_count, fee_amount, description, sort_order, is_active)
VALUES
('month', 'Đăng ký Theo Tháng', 1, 50000, 'Thời hạn 1 tháng (50.000 VNĐ)', 1, true),
('quarter', 'Đăng ký Theo Quý (3 tháng)', 3, 130000, 'Thời hạn 3 tháng (Tiết kiệm 20.000 VNĐ)', 2, true),
('term', 'Đăng ký Theo Học Kỳ (5 tháng)', 5, 200000, 'Thời hạn 1 Học kỳ (Tiết kiệm 50.000 VNĐ)', 3, true),
('year', 'Đăng ký Cả Năm Học (9 tháng)', 9, 400000, 'Thời hạn trọn cả năm học (Tiết kiệm 50.000 VNĐ)', 4, true)
ON CONFLICT (package_key) DO UPDATE SET 
  title = EXCLUDED.title,
  fee_amount = EXCLUDED.fee_amount,
  description = EXCLUDED.description;


-- ==========================================
-- FILE: supabase_schema_parking_settings.sql
-- ==========================================
-- Script tạo bảng cấu hình thời gian đăng ký (Parking/Bus Settings)
-- Chạy script này trong SQL Editor của Supabase

CREATE TABLE IF NOT EXISTS cbq_parking_settings (
  id integer PRIMARY KEY DEFAULT 1,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_parking_settings ENABLE ROW LEVEL SECURITY;

-- Tạo policies
CREATE POLICY "Public can view parking settings" ON cbq_parking_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage parking settings" ON cbq_parking_settings FOR ALL USING (auth.role() = 'authenticated');

-- Chèn dữ liệu mặc định
INSERT INTO cbq_parking_settings (id, is_open, notice_message) 
VALUES (1, true, 'Hệ thống đăng ký hiện đang mở.') 
ON CONFLICT (id) DO NOTHING;


-- ==========================================
-- FILE: supabase_schema_quiz.sql
-- ==========================================
-- =========================================================
-- SUPABASE SCHEMA: HỆ THỐNG CUỘC THI TRẮC NGHIỆM & TỰ LUẬN
-- KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT (DÀNH CHO 1,000+ THÍ SINH)
-- =========================================================

-- 1. BẢNG DANH SÁCH CUỘC THI
CREATE TABLE IF NOT EXISTS public.cbq_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INT DEFAULT 15,
    start_time TEXT,
    end_time TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    show_leaderboard BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG NGÂN HÀNG CÂU HỎI (TRẮC NGHIỆM & TỰ LUẬN)
CREATE TABLE IF NOT EXISTS public.cbq_quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.cbq_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice' hoac 'essay'
    options JSONB DEFAULT '[]'::jsonb, -- Mang cac lua chon ["A", "B", "C", "D"]
    correct_option_index INT DEFAULT 0, -- Vị trí đáp án đúng (0, 1, 2, 3)
    points INT DEFAULT 10,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG BÀI NỘP CỦA THÍ SINH
CREATE TABLE IF NOT EXISTS public.cbq_quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.cbq_quizzes(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_group TEXT, -- Lớp / Khóa (VD: Lớp 12A1 / Khóa 2002-2005)
    student_code TEXT, -- Mã số học sinh / mã thiệp
    phone TEXT,
    score NUMERIC DEFAULT 0, -- Điểm trắc nghiệm tự động
    essay_score NUMERIC DEFAULT 0, -- Điểm tự luận do Admin chấm
    total_score NUMERIC DEFAULT 0, -- Tổng điểm cuối cùng
    answers JSONB DEFAULT '{}'::jsonb, -- Chi tiết đáp án trắc nghiệm { question_id: selected_index }
    essay_answer TEXT, -- Bài làm tự luận cảm xúc
    time_taken_seconds INT DEFAULT 0, -- Thời gian làm bài (giây)
    is_graded BOOLEAN DEFAULT FALSE, -- Đã chấm bài tự luận chưa
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (XÓA CHÍNH SÁCH CŨ NẾU CÓ ĐỂ TRÁNH LỖI DUPLICATE)
ALTER TABLE public.cbq_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_quiz_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read quizzes" ON public.cbq_quizzes;
DROP POLICY IF EXISTS "Allow public read questions" ON public.cbq_quiz_questions;
DROP POLICY IF EXISTS "Allow public insert submissions" ON public.cbq_quiz_submissions;
DROP POLICY IF EXISTS "Allow public read submissions for leaderboard" ON public.cbq_quiz_submissions;
DROP POLICY IF EXISTS "Allow admin all quizzes" ON public.cbq_quizzes;
DROP POLICY IF EXISTS "Allow admin all questions" ON public.cbq_quiz_questions;
DROP POLICY IF EXISTS "Allow admin all submissions" ON public.cbq_quiz_submissions;

CREATE POLICY "Allow public read quizzes" ON public.cbq_quizzes FOR SELECT USING (true);
CREATE POLICY "Allow public read questions" ON public.cbq_quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert submissions" ON public.cbq_quiz_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read submissions for leaderboard" ON public.cbq_quiz_submissions FOR SELECT USING (true);

-- Admin Full Management Policies
CREATE POLICY "Allow admin all quizzes" ON public.cbq_quizzes FOR ALL USING (true);
CREATE POLICY "Allow admin all questions" ON public.cbq_quiz_questions FOR ALL USING (true);
CREATE POLICY "Allow admin all submissions" ON public.cbq_quiz_submissions FOR ALL USING (true);


-- ==========================================
-- FILE: supabase_schema_rbac.sql
-- ==========================================
-- SQL Script for Dynamic Navigation Menus & Granular Permission Matrix (RBAC)

-- 1. Add permissions column to cbq_user_roles table
ALTER TABLE cbq_user_roles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- 2. Create Dynamic Navigation Menus Table
CREATE TABLE IF NOT EXISTS cbq_navigation_menus (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL DEFAULT 'public', -- 'public' or 'admin'
  parent_group text, -- e.g. "school", "anniversary", "media", "🏫 VẬN HÀNH NHÀ TRƯỜNG"
  label text NOT NULL, -- e.g. "🛵 Đăng ký Xe máy Học sinh"
  path text NOT NULL, -- e.g. "/dang-ky-xe-may"
  icon text, -- e.g. "Bike", "Calendar", "Users"
  permission_key text, -- e.g. "canViewStudents", "canViewDocs"
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_navigation_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view dynamic menus" ON cbq_navigation_menus FOR SELECT USING (is_active = true);
CREATE POLICY "Auth manage dynamic menus" ON cbq_navigation_menus FOR ALL USING (auth.role() = 'authenticated');

-- Initial Seed Data for Dynamic Menus
INSERT INTO cbq_navigation_menus (target_type, parent_group, label, path, icon, permission_key, sort_order, is_active) VALUES
('public', 'school', '📅 Lịch công tác tuần & Trực BGH', '/lich-cong-tac', 'Calendar', null, 1, true),
('public', 'school', '👨‍🏫 Đội ngũ & Tổ chuyên môn', '/to-chuyen-mon', 'Users', null, 2, true),
('public', 'school', '🛵 Đăng ký Xe máy Học sinh', '/dang-ky-xe-may', 'Bike', null, 3, true),
('public', 'school', '📋 Sổ Chấm điểm Thi đua Trực tuần', '/cham-diem-thi-dua', 'Award', null, 4, true),
('public', 'school', '📜 Văn bản - Thông báo', '/van-ban', 'FileText', null, 5, true),
('public', 'school', '✍️ Góp ý Công việc & Đề án', '/gop-y', 'MessageSquare', null, 6, true)
ON CONFLICT DO NOTHING;


-- ==========================================
-- FILE: supabase_schema_rls_security.sql
-- ==========================================
-- ==============================================================================
-- CHƯƠNG TRÌNH KHẮC PHỤC BẢO MẬT & XÓA SẠCH LỖI RECURSION TRÊN CSDL SUPABASE
-- Trường THPT Cao Bá Quát • Hệ Thống Vận Hành Nhà Trường
-- ==============================================================================

-- 1. KHỞI TẠO TẤT CẢ CÁC BẢNG NẾU CHƯA TỒN TẠI

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

CREATE TABLE IF NOT EXISTS cbq_emulation_criteria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Nếp sống & Đồng phục',
  score_change integer NOT NULL DEFAULT -5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

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

CREATE TABLE IF NOT EXISTS cbq_user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'committee_member',
  committee_id uuid,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

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

-- ==============================================================================
-- 2. TỰ ĐỘNG LÀM SẠCH VÀ TRIỆT TIÊU BẤT KỲ POLICY CŨ NÀO GÂY ĐỆ QUY TRÊN CBQ_USER_ROLES
-- ==============================================================================

ALTER TABLE cbq_user_roles DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'cbq_user_roles') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON cbq_user_roles', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE cbq_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all user roles" ON cbq_user_roles 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ==============================================================================
-- 3. KÍCH HOẠT VÀ LÀM SẠCH POLICY CHO CÁC BẢNG KHÁC
-- ==============================================================================

ALTER TABLE cbq_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_parking_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_parking_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_weekly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_navigation_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read students" ON cbq_students;
CREATE POLICY "Public read students" ON cbq_students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth write students" ON cbq_students;
CREATE POLICY "Auth write students" ON cbq_students FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select parking" ON cbq_parking_registrations;
CREATE POLICY "Public select parking" ON cbq_parking_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert parking" ON cbq_parking_registrations;
CREATE POLICY "Public insert parking" ON cbq_parking_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth update delete parking" ON cbq_parking_registrations;
CREATE POLICY "Auth update delete parking" ON cbq_parking_registrations FOR ALL USING (true);

DROP POLICY IF EXISTS "Public select emulation logs" ON cbq_emulation_logs;
CREATE POLICY "Public select emulation logs" ON cbq_emulation_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert emulation logs" ON cbq_emulation_logs;
CREATE POLICY "Public insert emulation logs" ON cbq_emulation_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth update emulation logs" ON cbq_emulation_logs;
CREATE POLICY "Auth update emulation logs" ON cbq_emulation_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read menus" ON cbq_navigation_menus;
CREATE POLICY "Public read menus" ON cbq_navigation_menus FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth manage menus" ON cbq_navigation_menus;
CREATE POLICY "Auth manage menus" ON cbq_navigation_menus FOR ALL USING (true);

-- ==============================================================================
-- 4. TẠO INDEXES TỐI ƯU HIỆU NĂNG
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_students_code ON cbq_students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_class ON cbq_students(student_class);

CREATE INDEX IF NOT EXISTS idx_parking_plate ON cbq_parking_registrations(license_plate);
CREATE INDEX IF NOT EXISTS idx_parking_code ON cbq_parking_registrations(ticket_code);

CREATE INDEX IF NOT EXISTS idx_emulation_week ON cbq_emulation_logs(week_number);
CREATE INDEX IF NOT EXISTS idx_emulation_class ON cbq_emulation_logs(student_class);


-- ==========================================
-- FILE: supabase_schema_scholarship_feedback.sql
-- ==========================================
-- =========================================================
-- BẢNG QUẢN LÝ Ý KIẾN GÓP Ý DỰ THẢO ĐỀ ÁN QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ TUỔI HỌC TRÒ"
-- =========================================================

CREATE TABLE IF NOT EXISTS cbq_scholarship_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_unit TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    feedback_content TEXT NOT NULL,
    attached_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_scholarship_feedback ENABLE ROW LEVEL SECURITY;

-- Allow public insert
CREATE POLICY "Public insert scholarship feedback"
    ON cbq_scholarship_feedback FOR INSERT
    WITH CHECK (true);

-- Allow public read
CREATE POLICY "Public read scholarship feedback"
    ON cbq_scholarship_feedback FOR SELECT
    USING (true);

-- Allow admin full access
CREATE POLICY "Admin full scholarship feedback"
    ON cbq_scholarship_feedback FOR ALL
    USING (auth.role() = 'authenticated');


-- ==========================================
-- FILE: supabase_schema_school.sql
-- ==========================================
-- SQL Script for School Operations Extension (Weekly Schedule & Staff Directory)

-- 1. Table for Weekly Schedules & Duty Roster
CREATE TABLE IF NOT EXISTS cbq_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL, -- e.g. "LỊCH CÔNG TÁC TUẦN 01 (Từ 01/09/2026 đến 07/09/2026)"
  week_number integer DEFAULT 1,
  start_date date,
  end_date date,
  bgh_duty text, -- Trực BGH: Thầy Hiệu trưởng Lê Văn A
  teacher_duty text, -- Trực ban: Cô Nguyễn Thị B
  schedule_items jsonb DEFAULT '[]'::jsonb, -- Array of { day, time, content, location, chair, participants }
  note text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Table for Staff & Department Directory
CREATE TABLE IF NOT EXISTS cbq_staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text, -- e.g. "Hiệu trưởng", "Tổ trưởng Tổ Toán - Tin"
  department text NOT NULL, -- e.g. "Ban Giám Hiệu", "Tổ Toán - Tin", "Tổ Ngữ Văn"...
  avatar_url text,
  email text,
  phone text,
  bio text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active schedules" ON cbq_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users manage schedules" ON cbq_schedules FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view active staff" ON cbq_staff FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users manage staff" ON cbq_staff FOR ALL USING (auth.role() = 'authenticated');

-- Sample Initial Data for Schedules
INSERT INTO cbq_schedules (title, week_number, start_date, end_date, bgh_duty, teacher_duty, schedule_items, is_active)
VALUES (
  'LỊCH CÔNG TÁC TUẦN 01 (Từ 01/09/2026 đến 07/09/2026)',
  1,
  '2026-09-01',
  '2026-09-07',
  'Thầy Lê Văn A - Hiệu trưởng (Trực chính)',
  'Cô Nguyễn Thị B - Tổ trưởng Tổ Ngữ văn (Trực ban)',
  '[
    {"day": "Thứ Hai (01/09)", "time": "07:30", "content": "Chào cờ toàn trường & Quán triệt công tác chuẩn bị Lễ Kỷ Niệm 30 Năm", "location": "Sân trường", "chair": "BGH", "participants": "Toàn thể GV & HS"},
    {"day": "Thứ Hai (01/09)", "time": "14:00", "content": "Họp Hội đồng Sư phạm mở rộng duyệt kịch bản sự kiện", "location": "Phòng Hội đồng", "chair": "Hiệu trưởng", "participants": "Toàn thể Cán bộ Giáo viên"},
    {"day": "Thứ Ba (02/09)", "time": "08:00", "content": "Tổng duyệt chương trình Lễ Kỷ Niệm 30 Năm Thành Lập Trường", "location": "Sân khấu chính", "chair": "Ban Tổ Chức", "participants": "CÁC Tiểu ban & Đội văn nghệ"},
    {"day": "Thứ Tư (03/09)", "time": "07:30", "content": "CHÍNH THỨC TỔ CHỨC LỄ KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT", "location": "Khuôn viên nhà trường", "chair": "BGH & Lãnh đạo Sở", "participants": "Đại biểu, Cựu GV, Cựu HS & Toàn trường"},
    {"day": "Thứ Sáu (05/09)", "time": "07:30", "content": "LỄ KHAI GIẢNG NĂM HỌC MỚI 2026 - 2027", "location": "Sân trường", "chair": "Hiệu trưởng", "participants": "Toàn thể GV & Học sinh"}
  ]'::jsonb,
  true
) ON CONFLICT DO NOTHING;

-- Sample Initial Data for Staff
INSERT INTO cbq_staff (name, title, department, avatar_url, email, sort_order) VALUES
('Lê Thị Thảo', 'Hiệu trưởng', 'Ban Giám Hiệu', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80', 'hieutruong@thptcaobaquat.edu.vn', 1),
('Nguyễn Văn Nam', 'Phó Hiệu trưởng', 'Ban Giám Hiệu', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80', 'pht.nam@thptcaobaquat.edu.vn', 2),
('Trần Thị Hoa', 'Tổ trưởng Tổ Toán - Tin', 'Tổ Toán - Tin', 'https://images.unsplash.com/photo-1580894732413-87b1c4c1a5b8?w=500&q=80', 'hoa.toan@thptcaobaquat.edu.vn', 3),
('Phạm Đức Minh', 'Tổ trưởng Tổ Ngữ văn', 'Tổ Ngữ Văn', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', 'minh.van@thptcaobaquat.edu.vn', 4),
('Vũ Thị Lan', 'Tổ trưởng Tổ Tiếng Anh', 'Tổ Ngoại Ngữ', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80', 'lan.anh@thptcaobaquat.edu.vn', 5)
ON CONFLICT DO NOTHING;


-- ==========================================
-- FILE: supabase_schema_sports.sql
-- ==========================================
-- =========================================================
-- BẢNG QUẢN LÝ ĐĂNG KÝ VẬN ĐỘNG VIÊN THỂ THAO 30 NĂM
-- =========================================================

CREATE TABLE IF NOT EXISTS cbq_sports_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    sport_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cohort_year TEXT,
    unit_name TEXT NOT NULL,
    notes TEXT,
    user_category TEXT DEFAULT 'Cựu học sinh',
    fee_amount INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'Chờ nộp kinh phí',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_sports_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public insert
CREATE POLICY "Public insert sports registrations"
    ON cbq_sports_registrations FOR INSERT
    WITH CHECK (true);

-- Allow public read (to view public athlete list)
CREATE POLICY "Public read sports registrations"
    ON cbq_sports_registrations FOR SELECT
    USING (true);

-- Allow full access for authenticated users
CREATE POLICY "Admin full sports registrations"
    ON cbq_sports_registrations FOR ALL
    USING (auth.role() = 'authenticated');


-- ==========================================
-- FILE: supabase_schema_students.sql
-- ==========================================
-- SQL Script for School Student Roster Management

CREATE TABLE IF NOT EXISTS cbq_students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code text UNIQUE NOT NULL, -- e.g. "HS11A1-001"
  student_name text NOT NULL, -- e.g. "Nguyễn Văn An"
  student_class text NOT NULL, -- e.g. "11A1"
  grade_level text, -- "Khối 10", "Khối 11", "Khối 12"
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active students" ON cbq_students FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users manage students" ON cbq_students FOR ALL USING (auth.role() = 'authenticated');

-- Initial Sample Data for Student Roster
INSERT INTO cbq_students (student_code, student_name, student_class, grade_level) VALUES
('HS11A1-001', 'Nguyễn Văn An', '11A1', 'Khối 11'),
('HS11A1-002', 'Lê Thị Bình', '11A1', 'Khối 11'),
('HS12A3-005', 'Trần Thị Bích', '12A3', 'Khối 12'),
('HS12A3-008', 'Nguyễn Đức Cường', '12A3', 'Khối 12'),
('HS10A2-012', 'Phạm Minh Cường', '10A2', 'Khối 10'),
('HS10A2-015', 'Vũ Hoàng Dung', '10A2', 'Khối 10')
ON CONFLICT (student_code) DO UPDATE SET 
  student_name = EXCLUDED.student_name,
  student_class = EXCLUDED.student_class,
  grade_level = EXCLUDED.grade_level;


-- ==========================================
-- FILE: supabase_schema_voting.sql
-- ==========================================
-- =========================================================
-- SUPABASE SCHEMA: HỆ THỐNG BÌNH CHỌN TÁC PHẨM & CHỐNG GIAN LẬN
-- KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT
-- =========================================================

-- 1. BẢNG DANH SÁCH TÁC PHẨM DỰ THI
CREATE TABLE IF NOT EXISTS public.cbq_voting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, -- Tên tác phẩm / sản phẩm dự thi
    author_name TEXT NOT NULL, -- Tác giả / Tập thể lớp
    category TEXT DEFAULT 'Chung', -- Phân loại (Tranh vẽ, Video, Mô hình, Thơ...)
    image_url TEXT, -- Ảnh đại diện tác phẩm
    description TEXT, -- Ý nghĩa bài dự thi / bài thuyết minh
    votes_count INT DEFAULT 0, -- Số lượt bình chọn tự động
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG CHI TIẾT BÌNH CHỌN (CHỐNG GIAN LẬN 3 LỚP)
CREATE TABLE IF NOT EXISTS public.cbq_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES public.cbq_voting_entries(id) ON DELETE CASCADE,
    voter_name TEXT, -- Tên người bình chọn
    voter_code TEXT NOT NULL, -- Mã số học sinh / Mã thiệp / Số ĐT (Khóa chính chống trùng)
    device_token TEXT, -- Dấu vân tay trình duyệt / thiết bị
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voter_code UNIQUE(voter_code) -- Mỗi mã học sinh chỉ được bình chọn 1 lần trong cả cuộc thi
);

-- 3. CẤU HÌNH RLS POLICIES (BẢO MẬT & XÓA POLICY CŨ NẾU CÓ)
ALTER TABLE public.cbq_voting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read voting entries" ON public.cbq_voting_entries;
DROP POLICY IF EXISTS "Allow public insert votes" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow public read votes for count" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow admin all voting entries" ON public.cbq_voting_entries;
DROP POLICY IF EXISTS "Allow admin all votes" ON public.cbq_votes;

CREATE POLICY "Allow public read voting entries" ON public.cbq_voting_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert votes" ON public.cbq_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read votes for count" ON public.cbq_votes FOR SELECT USING (true);

-- Admin Full Policies
CREATE POLICY "Allow admin all voting entries" ON public.cbq_voting_entries FOR ALL USING (true);
CREATE POLICY "Allow admin all votes" ON public.cbq_votes FOR ALL USING (true);


