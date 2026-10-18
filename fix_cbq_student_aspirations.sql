-- ==============================================================================
-- KHẮC PHỤC LỖI: relation "public.cbq_student_aspirations" does not exist (ERROR 42P01)
-- DỰ ÁN: HỆ THỐNG ĐIỀU HÀNH & TIỆN ÍCH THPT CAO BÁ QUÁT
-- Chức năng: Khởi tạo bảng Hòm thư Tâm tư & Sàng lọc sức khỏe tinh thần DASS-21
-- ==============================================================================

-- 1. TẠO BẢNG CHUYÊN BIỆT public.cbq_student_aspirations
CREATE TABLE IF NOT EXISTS public.cbq_student_aspirations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT DEFAULT '',
    class_name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    category TEXT DEFAULT 'co_so_vat_chat',
    urgency TEXT DEFAULT 'Bình thường',
    is_anonymous BOOLEAN DEFAULT true,
    content TEXT NOT NULL,
    feedback_content TEXT,
    feedback_items JSONB DEFAULT '[]'::jsonb,
    organization_unit TEXT DEFAULT '',
    representative_name TEXT DEFAULT '',
    dass21_scores JSONB DEFAULT NULL,
    admin_note TEXT DEFAULT '',
    status TEXT DEFAULT 'pending', -- 'pending' (chờ xử lý), 'verified' (đã tiếp nhận), 'resolved' (đã giải quyết)
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. KÍCH HOẠT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.cbq_student_aspirations ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp chính sách cũ nếu có
DROP POLICY IF EXISTS "Public insert aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Admin read aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Public select aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Public update aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Public delete aspirations" ON public.cbq_student_aspirations;
DROP POLICY IF EXISTS "Public full access cbq_student_aspirations" ON public.cbq_student_aspirations;

-- 3. THIẾT LẬP CHÍNH SÁCH BẢO MẬT RLS

-- A. Cho phép học sinh toàn trường gửi tâm tư (công khai hoặc ẩn danh 100%)
CREATE POLICY "Public insert aspirations" 
ON public.cbq_student_aspirations 
FOR INSERT 
WITH CHECK (true);

-- B. Cho phép đọc danh sách thư (Phục vụ Cổng quản trị BGH / Ban tư vấn tâm lý)
CREATE POLICY "Public select aspirations" 
ON public.cbq_student_aspirations 
FOR SELECT 
USING (true);

-- C. Cho phép Cán bộ quản lý cập nhật trạng thái đã tiếp nhận / ghi chú chỉ đạo BGH
CREATE POLICY "Public update aspirations" 
ON public.cbq_student_aspirations 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- D. Cho phép Cán bộ quản trị xóa thư không hợp lệ
CREATE POLICY "Public delete aspirations" 
ON public.cbq_student_aspirations 
FOR DELETE 
USING (true);

-- 4. TỐI ƯU HÓA CHỈ MỤC TRUY VẤN (INDEXES)
CREATE INDEX IF NOT EXISTS idx_student_aspirations_created_at ON public.cbq_student_aspirations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_aspirations_category ON public.cbq_student_aspirations(category);
CREATE INDEX IF NOT EXISTS idx_student_aspirations_class ON public.cbq_student_aspirations(class_name);
CREATE INDEX IF NOT EXISTS idx_student_aspirations_verified ON public.cbq_student_aspirations(is_verified);

-- 5. ĐỒNG BỘ DỮ LIỆU TỪ HÒM THƯ CŨ (NẾU ĐÃ CÓ TRONG cbq_feedback_responses)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cbq_feedback_responses') THEN
        INSERT INTO public.cbq_student_aspirations (
            id,
            student_name,
            class_name,
            phone,
            email,
            category,
            urgency,
            is_anonymous,
            content,
            feedback_content,
            feedback_items,
            organization_unit,
            representative_name,
            is_verified,
            created_at
        )
        SELECT 
            r.id,
            COALESCE(r.representative_name, 'Học sinh CBQ'),
            COALESCE(r.organization_unit, ''),
            COALESCE(r.phone, ''),
            COALESCE(r.email, ''),
            COALESCE(r.agreement_level, 'co_so_vat_chat'),
            COALESCE(r.feedback_items->0->>'urgency', 'Bình thường'),
            COALESCE((r.feedback_items->0->>'isAnonymous')::boolean, true),
            COALESCE(r.feedback_content, ''),
            COALESCE(r.feedback_content, ''),
            COALESCE(r.feedback_items, '[]'::jsonb),
            COALESCE(r.organization_unit, ''),
            COALESCE(r.representative_name, ''),
            COALESCE(r.is_verified, false),
            r.created_at
        FROM public.cbq_feedback_responses r
        WHERE r.topic_id = 'e98a1000-cb00-4b9a-9000-00000000cb01'
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- 6. KÍCH HOẠT REALTIME SUPABASE CHO BẢNG NÀY (ĐỂ CHUÔNG BGH REO TỨC THÌ)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cbq_student_aspirations;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Bỏ qua nếu bảng đã có trong publication
END $$;
