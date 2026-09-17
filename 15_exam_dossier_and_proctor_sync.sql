-- ====================================================================
-- MIGRATION SCRIPT 15: EXAM DOSSIER SYSTEM & PROCTOR CSP INTEGRATION
-- Hệ Thống Kiểm Tra Hồ Sơ Đăng Ký Thi Tốt Nghiệp THPT (GDPT 2018 - 2+2)
-- ====================================================================

-- 1. Bổ sung các trường chuyên biệt cho Hồ sơ Thi TN THPT vào bảng cbq_students
ALTER TABLE cbq_students 
ADD COLUMN IF NOT EXISTS identity_card text,
ADD COLUMN IF NOT EXISTS birth_date text,
ADD COLUMN IF NOT EXISTS gender text DEFAULT 'Nam',
ADD COLUMN IF NOT EXISTS ethnicity text DEFAULT 'Kinh',
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS exam_electives jsonb DEFAULT '["Tiếng Anh", "Vật lý"]'::jsonb, -- 2 môn tự chọn
ADD COLUMN IF NOT EXISTS exam_graduation_area text DEFAULT 'Diện 1', -- Diện 1, Diện 2, Diện 3
ADD COLUMN IF NOT EXISTS exam_priority_code text DEFAULT '00', -- Mã ưu tiên: 01, 02, 03...
ADD COLUMN IF NOT EXISTS exam_photo_url text,
ADD COLUMN IF NOT EXISTS exam_status text DEFAULT 'pending', -- 'valid', 'error', 'pending'
ADD COLUMN IF NOT EXISTS exam_errors text;

-- 2. Bổ sung các trường phục vụ Phân công Giám thị (Proctor CSP) vào cbq_staff
ALTER TABLE cbq_staff
ADD COLUMN IF NOT EXISTS subject_specialty text, -- Môn chuyên môn (Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, Tin, TD...)
ADD COLUMN IF NOT EXISTS homeroom_class text, -- Lớp chủ nhiệm (VD: 12A01, 10A02...)
ADD COLUMN IF NOT EXISTS proctor_experience_years integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS is_proctor_eligible boolean DEFAULT true;

-- 3. Cập nhật dữ liệu Giáo viên mẫu với đầy đủ Tổ chuyên môn & Lớp chủ nhiệm
UPDATE cbq_staff SET 
  subject_specialty = 'Toán', 
  homeroom_class = '12A01', 
  is_proctor_eligible = true 
WHERE name ILIKE '%Trần Thị Hoa%' OR name ILIKE '%Hoa%';

UPDATE cbq_staff SET 
  subject_specialty = 'Ngữ Văn', 
  homeroom_class = '12A02', 
  is_proctor_eligible = true 
WHERE name ILIKE '%Phạm Đức Minh%' OR name ILIKE '%Minh%';

UPDATE cbq_staff SET 
  subject_specialty = 'Tiếng Anh', 
  homeroom_class = '12A03', 
  is_proctor_eligible = true 
WHERE name ILIKE '%Vũ Thị Lan%' OR name ILIKE '%Lan%';

-- 4. Bổ sung giáo viên nếu chưa tồn tại
INSERT INTO cbq_staff (name, title, department, subject_specialty, homeroom_class, is_proctor_eligible, is_active)
SELECT 'Nguyễn Văn Thắng', 'Giáo viên', 'Tổ Vật Lý - Công Nghệ', 'Vật Lý', '12A04', true, true
WHERE NOT EXISTS (SELECT 1 FROM cbq_staff WHERE name = 'Nguyễn Văn Thắng');

INSERT INTO cbq_staff (name, title, department, subject_specialty, homeroom_class, is_proctor_eligible, is_active)
SELECT 'Lê Hoàng Nam', 'Giáo viên', 'Tổ Hóa - Sinh', 'Hóa Học', '12A05', true, true
WHERE NOT EXISTS (SELECT 1 FROM cbq_staff WHERE name = 'Lê Hoàng Nam');

INSERT INTO cbq_staff (name, title, department, subject_specialty, homeroom_class, is_proctor_eligible, is_active)
SELECT 'Đặng Thu Hà', 'Giáo viên', 'Tổ Hóa - Sinh', 'Sinh Học', '12A06', true, true
WHERE NOT EXISTS (SELECT 1 FROM cbq_staff WHERE name = 'Đặng Thu Hà');

INSERT INTO cbq_staff (name, title, department, subject_specialty, homeroom_class, is_proctor_eligible, is_active)
SELECT 'Trần Quốc Tuấn', 'Giáo viên', 'Tổ Lịch Sử - Địa Lý', 'Lịch Sử', '12A07', true, true
WHERE NOT EXISTS (SELECT 1 FROM cbq_staff WHERE name = 'Trần Quốc Tuấn');

INSERT INTO cbq_staff (name, title, department, subject_specialty, homeroom_class, is_proctor_eligible, is_active)
SELECT 'Bùi Mai Phương', 'Giáo viên', 'Tổ Lịch Sử - Địa Lý', 'Địa Lý', '12A08', true, true
WHERE NOT EXISTS (SELECT 1 FROM cbq_staff WHERE name = 'Bùi Mai Phương');

INSERT INTO cbq_staff (name, title, department, subject_specialty, homeroom_class, is_proctor_eligible, is_active)
SELECT 'Phan Thanh Hải', 'Giáo viên', 'Tổ Toán - Tin', 'Tin Học', '12A09', true, true
WHERE NOT EXISTS (SELECT 1 FROM cbq_staff WHERE name = 'Phan Thanh Hải');

INSERT INTO cbq_staff (name, title, department, subject_specialty, homeroom_class, is_proctor_eligible, is_active)
SELECT 'Ngô Bảo Châu', 'Giáo viên', 'Tổ GDCD - Thể Dục', 'GDKT&PL', '12A10', true, true
WHERE NOT EXISTS (SELECT 1 FROM cbq_staff WHERE name = 'Ngô Bảo Châu');

-- 5. Xóa các mã học sinh thử nghiệm cũ nếu có để tránh trùng lặp
DELETE FROM cbq_students WHERE student_code IN (
  'HS12A01-001', 'HS12A01-002', 'HS12A01-003', 'HS12A01-004',
  'HS12A02-001', 'HS12A02-002', 'HS12A02-003',
  'HS12A03-001', 'HS12A03-002'
);

-- 6. Nạp danh sách Học sinh Khối 12 mẫu (chuẩn CCCD 12 số & Quy tắc 2+2)
INSERT INTO cbq_students (
  student_code, student_name, student_class, grade_level, 
  identity_card, birth_date, gender, ethnicity, phone, 
  exam_electives, exam_graduation_area, exam_status
) VALUES
('HS12A01-001', 'Nguyễn Văn An', '12A01', 'Khối 12', '079208012345', '2008-03-15', 'Nam', 'Kinh', '0901234567', '["Tiếng Anh", "Vật Lý"]'::jsonb, 'Diện 1', 'valid'),
('HS12A01-002', 'Trần Thị Mai', '12A01', 'Khối 12', '079308012346', '2008-07-22', 'Nữ', 'Kinh', '0902345678', '["Tiếng Anh", "Hóa Học"]'::jsonb, 'Diện 1', 'valid'),
('HS12A01-003', 'Lê Hoàng Nam', '12A01', 'Khối 12', '079208012347', '2008-11-05', 'Nam', 'Kinh', '0903456789', '["Vật Lý", "Hóa Học"]'::jsonb, 'Diện 1', 'valid'),
('HS12A01-004', 'Phạm Minh Đức (Lỗi 2+2)', '12A01', 'Khối 12', '079208012348', '2008-01-10', 'Nam', 'Kinh', '0904567890', '["Tiếng Anh", "Vật Lý", "Hóa Học"]'::jsonb, 'Diện 1', 'error'),
('HS12A02-001', 'Hoàng Thu Trang', '12A02', 'Khối 12', '079308012349', '2008-04-12', 'Nữ', 'Kinh', '0905678901', '["Lịch Sử", "Địa Lý"]'::jsonb, 'Diện 1', 'valid'),
('HS12A02-002', 'Vũ Quốc Bảo', '12A02', 'Khối 12', '079208012350', '2008-09-19', 'Nam', 'Kinh', '0906789012', '["Lịch Sử", "GDKT&PL"]'::jsonb, 'Diện 1', 'valid'),
('HS12A02-003', 'Đặng Kim Ngân (Lỗi CCCD)', '12A02', 'Khối 12', '0793080123', '2008-12-01', 'Nữ', 'Kinh', '0907890123', '["Tiếng Anh", "Địa Lý"]'::jsonb, 'Diện 1', 'error'),
('HS12A03-001', 'Bùi Đức Trọng', '12A03', 'Khối 12', '079208012351', '2008-05-30', 'Nam', 'Kinh', '0908901234', '["Tin Học", "Vật Lý"]'::jsonb, 'Diện 1', 'valid'),
('HS12A03-002', 'Dương Thùy Linh', '12A03', 'Khối 12', '079308012352', '2008-08-14', 'Nữ', 'Kinh', '0909012345', '["Tiếng Anh", "Sinh Học"]'::jsonb, 'Diện 1', 'valid');

-- 7. (Tùy chọn) Tạo Unique Constraint an toàn cho student_code nếu chưa có
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cbq_students_student_code_key'
  ) THEN
    ALTER TABLE cbq_students ADD CONSTRAINT cbq_students_student_code_key UNIQUE (student_code);
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
