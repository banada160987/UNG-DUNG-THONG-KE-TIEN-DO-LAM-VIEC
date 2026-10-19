-- =====================================================================================
-- BẢN NÂNG CẤP TỐI ƯU HÓA CHỊU TẢI CAO & TIẾT KIỆM BĂNG THÔNG CHO 1.500 NHÂN SỰ
-- HỆ THỐNG ĐIỀU HÀNH & TIỆN ÍCH TRƯỜNG THPT CAO BÁ QUÁT - ĐẮK LẮK
-- Chạy đoạn mã này trong mục SQL Editor của Supabase (Khuyến nghị Supabase 2)
-- Lưu ý: Không bôi đen (highlight) đoạn nào khi bấm nút "Run" để chạy toàn bộ file.
-- =====================================================================================

-- BƯỚC 1: TẠO BẢNG HỌC LIỆU SỐ PHÂN QUYỀN
CREATE TABLE IF NOT EXISTS public.cbq_edu_materials (
    id TEXT PRIMARY KEY,
    teacher_name TEXT NOT NULL,
    teacher_id TEXT,
    subject TEXT NOT NULL,
    grade TEXT NOT NULL,
    target_classes JSONB DEFAULT '[]'::jsonb,
    title TEXT NOT NULL,
    description TEXT,
    material_type TEXT DEFAULT 'document',
    content_url TEXT NOT NULL,
    file_size TEXT,
    is_free_for_target_classes BOOLEAN DEFAULT TRUE,
    is_monetized BOOLEAN DEFAULT FALSE,
    price NUMERIC DEFAULT 0,
    bank_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BƯỚC 2: TẠO BẢNG KHẢO THÍ THÔNG MINH GDPT 2018
CREATE TABLE IF NOT EXISTS public.cbq_smart_assessments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT DEFAULT 'Khối 10',
    target_classes JSONB DEFAULT '[]'::jsonb,
    duration_minutes INT DEFAULT 45,
    teacher_name TEXT,
    status TEXT DEFAULT 'active',
    questions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BƯỚC 3: TẠO BẢNG BÀI NỘP VÀ KẾT QUẢ CHẤM ĐIỂM
CREATE TABLE IF NOT EXISTS public.cbq_assessment_submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL REFERENCES public.cbq_smart_assessments(id) ON DELETE CASCADE,
    exam_title TEXT,
    subject TEXT,
    student_code TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    answers JSONB DEFAULT '{}'::jsonb,
    grade_result JSONB DEFAULT '{}'::jsonb,
    total_score NUMERIC DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- BƯỚC 4: TẠO CHỈ MỤC B-TREE INDEX TĂNG TỐC TRUY VẤN < 2MS (GIẢI PHÓNG CONNECTION POOL)
CREATE INDEX IF NOT EXISTS idx_materials_subject_grade 
ON public.cbq_edu_materials (subject, grade);

CREATE INDEX IF NOT EXISTS idx_materials_teacher 
ON public.cbq_edu_materials (teacher_id);

CREATE INDEX IF NOT EXISTS idx_assessments_status_grade 
ON public.cbq_smart_assessments (status, grade);

CREATE INDEX IF NOT EXISTS idx_assessments_created_at 
ON public.cbq_smart_assessments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_exam_id 
ON public.cbq_assessment_submissions (exam_id);

CREATE INDEX IF NOT EXISTS idx_submissions_student_code 
ON public.cbq_assessment_submissions (LOWER(TRIM(student_code)));

CREATE INDEX IF NOT EXISTS idx_submissions_student_class 
ON public.cbq_assessment_submissions (student_class);

CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at 
ON public.cbq_assessment_submissions (submitted_at DESC);

-- BƯỚC 5: THIẾT LẬP BẢO MẬT HÀNG (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.cbq_edu_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_smart_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_assessment_submissions ENABLE ROW LEVEL SECURITY;

-- Chính sách bảng cbq_edu_materials
DROP POLICY IF EXISTS "Allow read public edu materials" ON public.cbq_edu_materials;
CREATE POLICY "Allow read public edu materials" 
ON public.cbq_edu_materials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert edu materials" ON public.cbq_edu_materials;
CREATE POLICY "Allow insert edu materials" 
ON public.cbq_edu_materials FOR INSERT WITH CHECK (true);

-- Chính sách bảng cbq_smart_assessments
DROP POLICY IF EXISTS "Allow read public assessments" ON public.cbq_smart_assessments;
CREATE POLICY "Allow read public assessments" 
ON public.cbq_smart_assessments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert assessments" ON public.cbq_smart_assessments;
CREATE POLICY "Allow insert assessments" 
ON public.cbq_smart_assessments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update assessments" ON public.cbq_smart_assessments;
CREATE POLICY "Allow update assessments" 
ON public.cbq_smart_assessments FOR UPDATE USING (true);

-- Chính sách bảng cbq_assessment_submissions
DROP POLICY IF EXISTS "Allow insert exam submissions" ON public.cbq_assessment_submissions;
CREATE POLICY "Allow insert exam submissions" 
ON public.cbq_assessment_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read exam submissions" ON public.cbq_assessment_submissions;
CREATE POLICY "Allow read exam submissions" 
ON public.cbq_assessment_submissions FOR SELECT USING (true);
