-- Chạy script này trong Supabase SQL Editor
CREATE TABLE IF NOT EXISTS cbq_gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  uploaded_by text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Cho phép mọi người xem ảnh đã duyệt
CREATE POLICY "Cho phép đọc ảnh public" ON cbq_gallery
  FOR SELECT USING (is_approved = true);

-- Bật RLS (Row Level Security) - Tùy chọn
ALTER TABLE cbq_gallery ENABLE ROW LEVEL SECURITY;
