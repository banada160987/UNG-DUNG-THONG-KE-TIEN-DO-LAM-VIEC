-- 07_create_departments_table.sql
-- Kịch bản tạo bảng Quản lý Tổ Chuyên Môn

CREATE TABLE IF NOT EXISTS cbq_departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bật Row Level Security (nếu cần thiết, nếu ứng dụng chưa dùng RLS thì bỏ qua)
-- ALTER TABLE cbq_departments ENABLE ROW LEVEL SECURITY;

-- Di chuyển dữ liệu mặc định vào bảng
INSERT INTO cbq_departments (name, sort_order) VALUES 
('Ban Giám Hiệu', 1),
('Tổ Toán - Tin', 2),
('Tổ Ngữ Văn', 3),
('Tổ Ngoại Ngữ', 4),
('Tổ Lý - Hóa - Sinh', 5),
('Tổ Sử - Địa - GDCD', 6),
('Tổ Thể Dục - QQP', 7),
('Tổ Văn Phòng & Kế Toán', 8)
ON CONFLICT DO NOTHING;
