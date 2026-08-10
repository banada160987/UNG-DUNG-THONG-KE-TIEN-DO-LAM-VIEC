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
