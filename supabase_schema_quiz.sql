-- =========================================================
-- SUPABASE SCHEMA: HỆ THỐNG CUỘC THI TRẮC NGHIỆM & TỰ LUẬN
-- KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT (DÀNH CHO 1,000+ THÍ SINH)
-- =========================================================

-- 1. BẢNG DANH SÁCH CUỘC THI
CREATE TABLE IF NOT EXISTS public.cbq_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INT DEFAULT 15,
    start_time TEXT,
    end_time TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG NGÂN HÀNG CÂU HỎI (TRẮC NGHIỆM & TỰ LUẬN)
CREATE TABLE IF NOT EXISTS public.cbq_quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.cbq_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice', -- 'multiple_choice' hoac 'essay'
    options JSONB DEFAULT '[]'::jsonb, -- Mang cac lua chon ["A", "B", "C", "D"]
    correct_option_index INT DEFAULT 0, -- Vị trí đáp án đúng (0, 1, 2, 3)
    points INT DEFAULT 10,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG BÀI NỘP CỦA THÍ SINH
CREATE TABLE IF NOT EXISTS public.cbq_quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.cbq_quizzes(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_group TEXT, -- Lớp / Khóa (VD: Lớp 12A1 / Khóa 2002-2005)
    student_code TEXT, -- Mã số học sinh / mã thiệp
    phone TEXT,
    score NUMERIC DEFAULT 0, -- Điểm trắc nghiệm tự động
    essay_score NUMERIC DEFAULT 0, -- Điểm tự luận do Admin chấm
    total_score NUMERIC DEFAULT 0, -- Tổng điểm cuối cùng
    answers JSONB DEFAULT '{}'::jsonb, -- Chi tiết đáp án trắc nghiệm { question_id: selected_index }
    essay_answer TEXT, -- Bài làm tự luận cảm xúc
    time_taken_seconds INT DEFAULT 0, -- Thời gian làm bài (giây)
    is_graded BOOLEAN DEFAULT FALSE, -- Đã chấm bài tự luận chưa
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (XÓA CHÍNH SÁCH CŨ NẾU CÓ ĐỂ TRÁNH LỖI DUPLICATE)
ALTER TABLE public.cbq_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_quiz_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read quizzes" ON public.cbq_quizzes;
DROP POLICY IF EXISTS "Allow public read questions" ON public.cbq_quiz_questions;
DROP POLICY IF EXISTS "Allow public insert submissions" ON public.cbq_quiz_submissions;
DROP POLICY IF EXISTS "Allow public read submissions for leaderboard" ON public.cbq_quiz_submissions;
DROP POLICY IF EXISTS "Allow admin all quizzes" ON public.cbq_quizzes;
DROP POLICY IF EXISTS "Allow admin all questions" ON public.cbq_quiz_questions;
DROP POLICY IF EXISTS "Allow admin all submissions" ON public.cbq_quiz_submissions;

CREATE POLICY "Allow public read quizzes" ON public.cbq_quizzes FOR SELECT USING (true);
CREATE POLICY "Allow public read questions" ON public.cbq_quiz_questions FOR SELECT USING (true);
CREATE POLICY "Allow public insert submissions" ON public.cbq_quiz_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read submissions for leaderboard" ON public.cbq_quiz_submissions FOR SELECT USING (true);

-- Admin Full Management Policies
CREATE POLICY "Allow admin all quizzes" ON public.cbq_quizzes FOR ALL USING (true);
CREATE POLICY "Allow admin all questions" ON public.cbq_quiz_questions FOR ALL USING (true);
CREATE POLICY "Allow admin all submissions" ON public.cbq_quiz_submissions FOR ALL USING (true);
