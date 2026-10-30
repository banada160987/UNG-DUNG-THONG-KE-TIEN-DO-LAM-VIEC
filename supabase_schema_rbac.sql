-- SQL Script for Dynamic Navigation Menus & Granular Permission Matrix (RBAC)

-- 1. Chuẩn hóa bảng phân quyền tài khoản cbq_user_roles
ALTER TABLE public.cbq_user_roles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

-- Dọn dẹp các dòng trùng lặp (nếu có) trước khi tạo ràng buộc UNIQUE
DELETE FROM public.cbq_user_roles a USING public.cbq_user_roles b
WHERE a.ctid < b.ctid AND a.user_id = b.user_id;

-- Bổ sung ràng buộc UNIQUE cho user_id (tránh lỗi ON CONFLICT khi upsert)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cbq_user_roles_user_id_key'
    ) THEN
        ALTER TABLE public.cbq_user_roles 
        ADD CONSTRAINT cbq_user_roles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

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
