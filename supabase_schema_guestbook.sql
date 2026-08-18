-- BẢNG SỔ LƯU BÚT ĐIỆN TỬ (GUESTBOOK)

CREATE TABLE IF NOT EXISTS public.cbq_guestbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT NOT NULL,
    author_category TEXT NOT NULL DEFAULT 'Khách mời',
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật Row Level Security
ALTER TABLE public.cbq_guestbook ENABLE ROW LEVEL SECURITY;

-- 1. Cho phép Public đọc bài viết (đã được duyệt)
CREATE POLICY "Public can view approved guestbook entries" 
ON public.cbq_guestbook FOR SELECT 
USING (is_approved = true);

-- 2. Cho phép Public tạo bài viết mới (mặc định is_approved = true)
CREATE POLICY "Public can insert guestbook entries" 
ON public.cbq_guestbook FOR INSERT 
WITH CHECK (true);

-- 3. Cho phép Public cập nhật (chỉ dùng để tăng số lượng likes_count)
CREATE POLICY "Public can like guestbook entries" 
ON public.cbq_guestbook FOR UPDATE 
USING (true);

-- 4. Cho phép Admin toàn quyền
CREATE POLICY "Admin full access guestbook" 
ON public.cbq_guestbook FOR ALL 
USING (auth.role() = 'authenticated');
