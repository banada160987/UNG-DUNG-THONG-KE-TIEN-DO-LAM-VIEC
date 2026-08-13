-- Chạy script này trong Supabase SQL Editor để tạo kho lưu trữ ảnh (Storage Bucket)

-- 1. Tạo bucket tên là 'gallery' và đặt ở chế độ Public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Cho phép tất cả mọi người được xem ảnh trong bucket 'gallery'
CREATE POLICY "Cho phép mọi người xem ảnh" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'gallery');

-- 3. Cho phép upload ảnh vào bucket 'gallery' (Tạm thời mở public để Admin có thể upload từ web)
CREATE POLICY "Cho phép upload ảnh" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'gallery');

-- 4. Cho phép xóa ảnh
CREATE POLICY "Cho phép xóa ảnh" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'gallery');
