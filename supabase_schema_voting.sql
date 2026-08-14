-- =========================================================
-- SUPABASE SCHEMA: HỆ THỐNG BÌNH CHỌN TÁC PHẨM & CHỐNG GIAN LẬN
-- KỶ NIỆM 30 NĂM THPT CAO BÁ QUÁT
-- =========================================================

-- 1. BẢNG DANH SÁCH TÁC PHẨM DỰ THI
CREATE TABLE IF NOT EXISTS public.cbq_voting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, -- Tên tác phẩm / sản phẩm dự thi
    author_name TEXT NOT NULL, -- Tác giả / Tập thể lớp
    category TEXT DEFAULT 'Chung', -- Phân loại (Tranh vẽ, Video, Mô hình, Thơ...)
    image_url TEXT, -- Ảnh đại diện tác phẩm
    description TEXT, -- Ý nghĩa bài dự thi / bài thuyết minh
    votes_count INT DEFAULT 0, -- Số lượt bình chọn tự động
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG CHI TIẾT BÌNH CHỌN (CHỐNG GIAN LẬN 3 LỚP)
CREATE TABLE IF NOT EXISTS public.cbq_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES public.cbq_voting_entries(id) ON DELETE CASCADE,
    voter_name TEXT, -- Tên người bình chọn
    voter_code TEXT NOT NULL, -- Mã số học sinh / Mã thiệp / Số ĐT (Khóa chính chống trùng)
    device_token TEXT, -- Dấu vân tay trình duyệt / thiết bị
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voter_code UNIQUE(voter_code) -- Mỗi mã học sinh chỉ được bình chọn 1 lần trong cả cuộc thi
);

-- 3. CẤU HÌNH RLS POLICIES (BẢO MẬT & XÓA POLICY CŨ NẾU CÓ)
ALTER TABLE public.cbq_voting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read voting entries" ON public.cbq_voting_entries;
DROP POLICY IF EXISTS "Allow public insert votes" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow public read votes for count" ON public.cbq_votes;
DROP POLICY IF EXISTS "Allow admin all voting entries" ON public.cbq_voting_entries;
DROP POLICY IF EXISTS "Allow admin all votes" ON public.cbq_votes;

CREATE POLICY "Allow public read voting entries" ON public.cbq_voting_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert votes" ON public.cbq_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read votes for count" ON public.cbq_votes FOR SELECT USING (true);

-- Admin Full Policies
CREATE POLICY "Allow admin all voting entries" ON public.cbq_voting_entries FOR ALL USING (true);
CREATE POLICY "Allow admin all votes" ON public.cbq_votes FOR ALL USING (true);
