-- ==============================================================================
-- SUPABASE SCHEMA: HỆ THỐNG QUẢN LÝ & PHÊ DUYỆT HỒ SƠ TỔ CHUYÊN MÔN
-- Quy trình 3 cấp: Giáo viên -> Tổ trưởng Chuyên môn (TTCM) -> Ban Giám Hiệu (BGH)
-- Trường THPT Cao Bá Quát
-- ==============================================================================

-- 1. BẢNG DANH MỤC CÁC LOẠI HỒ SƠ QUY ĐỊNH
CREATE TABLE IF NOT EXISTS public.cbq_dossier_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'teacher', -- 'teacher' (Cá nhân) hoặc 'department' (Tổ)
    frequency TEXT DEFAULT 'weekly', -- 'weekly' (Hàng tuần), 'monthly', 'term', 'yearly'
    description TEXT,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bơm dữ liệu danh mục mặc định theo Thông tư 32/2020/TT-BGDĐT
INSERT INTO public.cbq_dossier_categories (code, title, target_type, frequency, description, is_required)
VALUES 
    ('GIAO_AN_TUAN', 'Kế hoạch bài dạy (Giáo án tuần)', 'teacher', 'weekly', 'Nộp trước khi lên lớp 2-3 ngày theo tuần học', true),
    ('KH_GIAO_DUC_CA_NHAN', 'Kế hoạch giáo dục cá nhân', 'teacher', 'yearly', 'Nộp vào đầu năm học', true),
    ('SO_CHU_NHIEM', 'Sổ công tác Chủ nhiệm (dành cho GVCN)', 'teacher', 'term', 'Cập nhật theo học kỳ', false),
    ('KH_TO_CHUYEN_MON', 'Kế hoạch giáo dục của Tổ chuyên môn', 'department', 'yearly', 'Do Tổ trưởng lập và nộp cho BGH duyệt', true),
    ('BIEN_BAN_HOP_TO', 'Biên bản sinh hoạt Tổ chuyên môn', 'department', 'monthly', 'Định kỳ 2 tuần hoặc 1 tháng / lần', true),
    ('SO_BOI_DUONG_HSG', 'Sổ bồi dưỡng HSG & Phụ đạo HS yếu', 'department', 'term', 'Báo cáo công tác bồi dưỡng', false)
ON CONFLICT (code) DO UPDATE SET 
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 2. BẢNG CHI TIẾT NỘP HỒ SƠ & GIÁO ÁN
CREATE TABLE IF NOT EXISTS public.cbq_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.cbq_dossier_categories(id) ON DELETE SET NULL,
    category_code TEXT,
    department_name TEXT NOT NULL, -- 'Tổ Toán - Tin', 'Tổ Ngữ Văn'...
    teacher_name TEXT NOT NULL,
    teacher_code TEXT,
    school_year TEXT NOT NULL DEFAULT '2025-2026',
    term TEXT DEFAULT 'HK1',
    week_number INT DEFAULT 1,
    title TEXT NOT NULL,
    file_url TEXT, -- File PDF/Word upload trên Supabase/Server
    drive_url TEXT, -- Link Google Drive / Docs dự phòng
    status TEXT DEFAULT 'pending', -- 'pending' (Chờ duyệt), 'approved' (Đã duyệt), 'rejected' (Yêu cầu sửa lại)
    reviewer_name TEXT,
    reviewer_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG THANH TRA & ĐÁNH GIÁ CỦA BGH / LÃNH ĐẠO
CREATE TABLE IF NOT EXISTS public.cbq_dossier_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES public.cbq_dossiers(id) ON DELETE CASCADE,
    inspector_name TEXT NOT NULL,
    inspector_role TEXT NOT NULL DEFAULT 'BGH', -- 'TTCM', 'BGH', 'THANH_TRA'
    rating_score TEXT DEFAULT 'Tốt', -- 'Tốt', 'Đạt', 'Cần bổ sung'
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CẤU HÌNH RLS SECURITY POLICIES
ALTER TABLE public.cbq_dossier_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_dossier_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.cbq_dossier_categories;
DROP POLICY IF EXISTS "Public read dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public insert dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public update dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public delete dossiers" ON public.cbq_dossiers;
DROP POLICY IF EXISTS "Public read inspections" ON public.cbq_dossier_inspections;
DROP POLICY IF EXISTS "Public insert inspections" ON public.cbq_dossier_inspections;

CREATE POLICY "Public read categories" ON public.cbq_dossier_categories FOR SELECT USING (true);

CREATE POLICY "Public read dossiers" ON public.cbq_dossiers FOR SELECT USING (true);
CREATE POLICY "Public insert dossiers" ON public.cbq_dossiers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update dossiers" ON public.cbq_dossiers FOR UPDATE USING (true);
CREATE POLICY "Public delete dossiers" ON public.cbq_dossiers FOR DELETE USING (true);

CREATE POLICY "Public read inspections" ON public.cbq_dossier_inspections FOR SELECT USING (true);
CREATE POLICY "Public insert inspections" ON public.cbq_dossier_inspections FOR INSERT WITH CHECK (true);

-- 5. TẠO INDEXES TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_dossiers_dept ON public.cbq_dossiers(department_name);
CREATE INDEX IF NOT EXISTS idx_dossiers_teacher ON public.cbq_dossiers(teacher_name);
CREATE INDEX IF NOT EXISTS idx_dossiers_status ON public.cbq_dossiers(status);
CREATE INDEX IF NOT EXISTS idx_dossiers_week ON public.cbq_dossiers(week_number);
