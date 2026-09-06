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
