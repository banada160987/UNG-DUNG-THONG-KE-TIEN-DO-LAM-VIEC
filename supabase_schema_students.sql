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
