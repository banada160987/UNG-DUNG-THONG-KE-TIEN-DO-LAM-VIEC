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
