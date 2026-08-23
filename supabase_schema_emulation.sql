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
