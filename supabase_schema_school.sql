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
