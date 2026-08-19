-- Run this script in Supabase SQL Editor to set up the Magazine table

CREATE TABLE IF NOT EXISTS cbq_magazines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  pdf_url text,
  cover_image text,
  pages jsonb DEFAULT '[]'::jsonb, -- Array of { page_number, title, image_url }
  toc jsonb DEFAULT '[]'::jsonb,   -- Table of contents: Array of { title, page }
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_magazines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published magazines" ON cbq_magazines 
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authenticated users can manage magazines" ON cbq_magazines 
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert initial sample magazine data for 30th Anniversary Souvenir Magazine
INSERT INTO cbq_magazines (title, description, pdf_url, cover_image, pages, toc, is_published)
VALUES (
  'TẬP SAN KỶ NIỆM 30 NĂM THÀNH LẬP TRƯỜNG THPT CAO BÁ QUÁT',
  'Ấn phẩm đặc biệt ghi dấu hành trình 30 năm xây dựng, phát triển và tri ân các thế hệ nhà giáo, cựu học sinh trường THPT Cao Bá Quát (1996 - 2026).',
  '/tap-san-30-nam.pdf',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80',
  '[
    {"page_number": 1, "title": "Bìa Tập San", "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80"},
    {"page_number": 2, "title": "Lời Tựa & Thư Chúc Mừng", "image_url": "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1000&q=80"},
    {"page_number": 3, "title": "Lịch Sử 30 Năm Hình Thành", "image_url": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1000&q=80"},
    {"page_number": 4, "title": "Ban BGH Qua Các Thời Kỳ", "image_url": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1000&q=80"},
    {"page_number": 5, "title": "Tổ Chuyên Môn & Đoàn Đội", "image_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&q=80"},
    {"page_number": 6, "title": "Thơ Ca Tri Ân Thầy Cô", "image_url": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1000&q=80"},
    {"page_number": 7, "title": "Văn Xuôi & Ký Ức Mái Trường", "image_url": "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=1000&q=80"},
    {"page_number": 8, "title": "Thư Viện Ảnh Kỷ Niệm 30 Năm", "image_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1000&q=80"},
    {"page_number": 9, "title": "Cựu Học Sinh Tiêu Biểu", "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000&q=80"},
    {"page_number": 10, "title": "Trang Bìa Sau & Lời Cảm Ơn", "image_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1000&q=80"}
  ]'::jsonb,
  '[
    {"title": "1. Trang Bìa Tập San", "page": 1},
    {"title": "2. Lời Tựa & Thư Chúc Mừng", "page": 2},
    {"title": "3. Lịch Sử 30 Năm Hình Thành", "page": 3},
    {"title": "4. Ban BGH Qua Các Thời Kỳ", "page": 4},
    {"title": "5. Các Tổ Chuyên Môn", "page": 5},
    {"title": "6. Thơ Ca Tri Ân Thầy Cô", "page": 6},
    {"title": "7. Ký Ức Mái Trường (Văn xuôi)", "page": 7},
    {"title": "8. Thư Viện Ảnh Kỷ Niệm", "page": 8},
    {"title": "9. Cựu Học Sinh Tiêu Biểu", "page": 9},
    {"title": "10. Lời Cảm Ơn & Bìa Sau", "page": 10}
  ]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;
