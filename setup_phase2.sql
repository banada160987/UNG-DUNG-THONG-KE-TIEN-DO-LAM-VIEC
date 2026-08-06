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
