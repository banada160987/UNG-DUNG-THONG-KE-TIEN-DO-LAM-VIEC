-- ==============================================================================
-- SQL MIGRATION: 14_sync_club_emulation_discipline.sql
-- TÍCH HỢP ĐỒNG BỘ ĐIỂM THI ĐUA & NỀ NẾP TỪ CÂU LẠC BỘ SANG LỚP CHỦ NHIỆM
-- ==============================================================================

-- 1. Đảm bảo bảng Tiêu chí thi đua cbq_emulation_criteria tồn tại và đầy đủ
CREATE TABLE IF NOT EXISTS cbq_emulation_criteria (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL, -- e.g. "Hoạt động Câu Lạc Bộ", "Nếp sống & Đồng phục", "Vệ sinh & Cảnh quan", "Học tập & Truy bài", "Sĩ số & Kỷ luật", "Khen thưởng & Xung kích"
  title text NOT NULL,
  score_change numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Đảm bảo bảng Nhật ký thi đua cbq_emulation_logs có các cột phục vụ truy vết đích danh
CREATE TABLE IF NOT EXISTS cbq_emulation_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number integer NOT NULL DEFAULT 1,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  student_class text NOT NULL,
  grade_level text,
  criteria_id text,
  criteria_title text NOT NULL,
  category text NOT NULL,
  score_change numeric NOT NULL,
  reason text,
  reason_note text, -- Tương thích cả 2 trường
  student_code text,
  student_name text,
  reporter_name text DEFAULT 'Đội Cờ Đỏ',
  status text DEFAULT 'approved',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Thêm các cột bổ sung nếu bảng đã tồn tại từ trước
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_emulation_logs' AND column_name = 'student_code') THEN
    ALTER TABLE cbq_emulation_logs ADD COLUMN student_code text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_emulation_logs' AND column_name = 'student_name') THEN
    ALTER TABLE cbq_emulation_logs ADD COLUMN student_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_emulation_logs' AND column_name = 'reason_note') THEN
    ALTER TABLE cbq_emulation_logs ADD COLUMN reason_note text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_emulation_logs' AND column_name = 'criteria_id') THEN
    ALTER TABLE cbq_emulation_logs ADD COLUMN criteria_id text;
  END IF;
END $$;

-- 3. Cấu hình RLS an toàn
ALTER TABLE cbq_emulation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_emulation_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public view criteria" ON cbq_emulation_criteria;
  DROP POLICY IF EXISTS "Auth manage criteria" ON cbq_emulation_criteria;
  DROP POLICY IF EXISTS "Public view logs" ON cbq_emulation_logs;
  DROP POLICY IF EXISTS "Public insert logs" ON cbq_emulation_logs;
  DROP POLICY IF EXISTS "Public update logs" ON cbq_emulation_logs;
  DROP POLICY IF EXISTS "Public delete logs" ON cbq_emulation_logs;
END $$;

CREATE POLICY "Public view criteria" ON cbq_emulation_criteria FOR SELECT USING (true);
CREATE POLICY "Auth manage criteria" ON cbq_emulation_criteria FOR ALL USING (true);

CREATE POLICY "Public view logs" ON cbq_emulation_logs FOR SELECT USING (true);
CREATE POLICY "Public insert logs" ON cbq_emulation_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update logs" ON cbq_emulation_logs FOR UPDATE USING (true);
CREATE POLICY "Public delete logs" ON cbq_emulation_logs FOR DELETE USING (true);

-- 4. Nạp bộ Tiêu chí thi đua chuẩn (bao gồm Hoạt động Câu Lạc Bộ & Nề nếp trường)
DELETE FROM cbq_emulation_criteria WHERE category = 'Hoạt động Câu Lạc Bộ';

INSERT INTO cbq_emulation_criteria (category, title, score_change, is_active) VALUES
-- Tiêu chí Câu Lạc Bộ
('Hoạt động Câu Lạc Bộ', 'Học sinh tham gia sinh hoạt CLB tích cực & đúng giờ', 2, true),
('Hoạt động Câu Lạc Bộ', 'Học sinh đạt thành tích / sản phẩm CLB xuất sắc', 5, true),
('Hoạt động Câu Lạc Bộ', 'Học sinh vắng sinh hoạt CLB không phép', -2, true),
('Hoạt động Câu Lạc Bộ', 'Học sinh đến muộn / vi phạm nội quy CLB', -1, true),

-- Tiêu chí Nề nếp & Đồng phục
('Nếp sống & Đồng phục', 'Không đeo thẻ học sinh / Không mặc đồng phục quy định', -5, true),
('Nếp sống & Đồng phục', 'Đi học muộn / Nắm tóc, tác phong sai quy định', -5, true),
('Nếp sống & Đồng phục', 'Sử dụng điện thoại trong giờ học không được phép', -5, true),

-- Tiêu chí Vệ sinh & Cơ sở vật chất
('Vệ sinh & Cảnh quan', 'Vệ sinh lớp / Sân trường muộn hoặc không sạch', -5, true),
('Vệ sinh & Cảnh quan', 'Quên tắt điện, quạt, máy chiếu khi ra khỏi phòng', -5, true),
('Vệ sinh & Cảnh quan', 'Làm hư hỏng / Bôi bẩn bàn ghế, tài sản nhà trường', -10, true),

-- Tiêu chí Học tập & Truy bài
('Học tập & Truy bài', 'Truy bài đầu giờ mất trật tự / Không chuẩn bị bài', -5, true),
('Học sinh vắng không phép', 'Học sinh nghỉ học không có đơn xin phép', -5, true),
('Học sinh bỏ tiết / Trốn tiết', 'Học sinh bỏ tiết, trốn học, ra ngoài không phép', -10, true),

-- Tiêu chí Tuyên dương & Khen thưởng
('Khen thưởng & Xung kích', 'Tuyên dương tập thể Chi đoàn xuất sắc tuần', 10, true),
('Khen thưởng & Xung kích', 'Đạt nhiều hoa điểm tốt (Điểm 9 - 10) trong tuần', 5, true),
('Khen thưởng & Xung kích', 'Tham gia nhiệt tình công tác tình nguyện / Đội cờ đỏ', 5, true)
ON CONFLICT DO NOTHING;
