-- =========================================================================
-- ĐỀ ÁN QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ 2.0" - HỆ SINH THÁI ĐỒNG HÀNH TOÀN DIỆN
-- TRƯỜNG THPT CAO BÁ QUÁT
-- Bao gồm:
-- 1. Hồ sơ Hành trình Trưởng thành Số (Digital Growth Journey & Badges)
-- 2. Mạng lưới Cố vấn Đồng hành 1-1 (Alumni & Teacher Mentorship Network)
-- 3. Sổ cái Xác thực Minh bạch Số chống giả mạo (Verifiable Transparency Ledger)
-- =========================================================================

-- 1. Bổ sung các trường Quỹ 2.0 vào bảng hồ sơ học sinh cbq_scholarship_applications
ALTER TABLE IF EXISTS public.cbq_scholarship_applications
ADD COLUMN IF NOT EXISTS verification_hash TEXT,                            -- Mã băm xác thực chống giả mạo: CBQ-UOCMO-XXXXX
ADD COLUMN IF NOT EXISTS growth_timeline JSONB DEFAULT '[]'::jsonb,         -- Dòng thời gian trưởng thành (các cột mốc tiến bộ, thư tay, ảnh thực tế)
ADD COLUMN IF NOT EXISTS mentor_id UUID,                                    -- Cố vấn được gán phụ trách
ADD COLUMN IF NOT EXISTS mentor_name TEXT,                                  -- Họ tên Cố vấn đồng hành
ADD COLUMN IF NOT EXISTS student_badges JSONB DEFAULT '[]'::jsonb;          -- Danh sách huy hiệu vươn lên ('Vượt khó học tốt', 'Tiến bộ vượt bậc'...)

-- 2. BẢNG MẠNG LƯỚI CỐ VẤN ĐỒNG HÀNH (CBQ SCHOLARSHIP MENTORS)
CREATE TABLE IF NOT EXISTS public.cbq_scholarship_mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,                                                -- Họ và tên Cố vấn
    phone TEXT NOT NULL,                                                    -- SĐT liên hệ
    email TEXT,                                                             -- Email
    mentor_type TEXT DEFAULT 'alumni',                                      -- 'alumni' (Cựu HS) | 'teacher' (Giáo viên) | 'university_student' | 'expert'
    alumni_class_year TEXT,                                                 -- Khóa cựu học sinh (Ví dụ: Khóa 2016-2019 / Niên khóa 40 năm)
    current_organization TEXT,                                              -- Đơn vị học tập/công tác (ĐH Bách Khoa, Ngoại Thương, Kỹ sư, Bác sĩ...)
    expertise_areas JSONB DEFAULT '[]'::jsonb,                              -- Lĩnh vực cố vấn ('Khối A Toán-Lý-Hóa', 'Định hướng CNTT', 'Kỹ năng sống'...)
    bio TEXT,                                                               -- Lời tự giới thiệu & thông điệp đồng hành
    status TEXT DEFAULT 'pending_approval',                                 -- 'pending_approval' | 'active' | 'inactive'
    assigned_students_count INTEGER DEFAULT 0,                              -- Số học sinh đang hỗ trợ
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BẢNG GHÉP ĐÔI CỐ VẤN & HỌC SINH (MENTORSHIP PAIRINGS)
CREATE TABLE IF NOT EXISTS public.cbq_scholarship_mentorship_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES public.cbq_scholarship_mentors(id) ON DELETE CASCADE,
    mentor_name TEXT NOT NULL,
    application_id UUID REFERENCES public.cbq_scholarship_applications(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    target_career_aspiration TEXT,                                          -- Định hướng nguyện vọng Đại học / Nghề nghiệp của học sinh
    matching_note TEXT,                                                     -- Ghi chú ghép đôi từ BGH
    status TEXT DEFAULT 'active',                                           -- 'active' | 'completed' | 'paused'
    session_logs JSONB DEFAULT '[]'::jsonb,                                 -- Nhật ký các buổi chia sẻ/tư vấn
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BẢNG SỔ CÁI XÁC THỰC MINH BẠCH SỐ (VERIFIABLE TRANSPARENCY LEDGER)
CREATE TABLE IF NOT EXISTS public.cbq_scholarship_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_code TEXT UNIQUE NOT NULL,                                 -- Mã tra cứu công khai: CBQ-UOCMO-2026-XXXX
    application_id UUID REFERENCES public.cbq_scholarship_applications(id) ON DELETE SET NULL,
    student_masked_name TEXT NOT NULL,                                      -- Tên học sinh viết tắt bảo mật: Nguyễn V. A
    student_class TEXT NOT NULL,                                            -- Lớp: 10A01
    disbursed_amount NUMERIC NOT NULL,                                      -- Số tiền trao tận tay: 2.000.000 đ
    disbursed_date DATE NOT NULL,                                           -- Ngày trao kinh phí
    term_name TEXT DEFAULT 'Đợt 1 - Năm học 2026-2027',                     -- Tên đợt học bổng
    sponsor_masked_name TEXT NOT NULL,                                      -- Nhà tài trợ: Quý Mạnh Thường Quân / Cựu HS Khóa 2000
    handover_officer TEXT NOT NULL,                                         -- Đại diện BGH / Đoàn trường trao
    purpose TEXT DEFAULT 'Học bổng Chắp cánh ước mơ kỳ I',
    document_ref TEXT,                                                      -- Số hiệu biên bản theo NĐ30 (VD: BB-CBQ/2026/01)
    is_verified BOOLEAN DEFAULT true,                                       -- Trạng thái xác thực mộc đỏ nhà trường
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index tra cứu siêu tốc
CREATE INDEX IF NOT EXISTS idx_mentors_status ON public.cbq_scholarship_mentors(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_mentor_id ON public.cbq_scholarship_mentorship_pairs(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_app_id ON public.cbq_scholarship_mentorship_pairs(application_id);
CREATE INDEX IF NOT EXISTS idx_verifications_code ON public.cbq_scholarship_verifications(verification_code);

-- RLS Policies
ALTER TABLE public.cbq_scholarship_mentors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phep doc va ghi danh sach Co van" ON public.cbq_scholarship_mentors
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.cbq_scholarship_mentorship_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phep doc va ghi cap doi Co van" ON public.cbq_scholarship_mentorship_pairs
    FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.cbq_scholarship_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phep doc va ghi so cai xac thuc" ON public.cbq_scholarship_verifications
    FOR ALL USING (true) WITH CHECK (true);
