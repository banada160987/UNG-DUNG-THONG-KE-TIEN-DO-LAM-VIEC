-- SQL Script for Motorbike Parking Fee Configuration & Security Control

CREATE TABLE IF NOT EXISTS cbq_parking_packages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_key text UNIQUE NOT NULL, -- e.g. 'month', 'quarter', 'term', 'year'
  title text NOT NULL, -- e.g. "Đăng ký Theo Tháng"
  months_count integer DEFAULT 1, -- Số tháng hiệu lực
  fee_amount numeric NOT NULL DEFAULT 50000, -- Mức phí VNĐ
  description text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_parking_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active parking packages" ON cbq_parking_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users manage parking packages" ON cbq_parking_packages FOR ALL USING (auth.role() = 'authenticated');

-- Sample Initial Configured Packages
INSERT INTO cbq_parking_packages (package_key, title, months_count, fee_amount, description, sort_order, is_active)
VALUES
('month', 'Đăng ký Theo Tháng', 1, 50000, 'Thời hạn 1 tháng (50.000 VNĐ)', 1, true),
('quarter', 'Đăng ký Theo Quý (3 tháng)', 3, 130000, 'Thời hạn 3 tháng (Tiết kiệm 20.000 VNĐ)', 2, true),
('term', 'Đăng ký Theo Học Kỳ (5 tháng)', 5, 200000, 'Thời hạn 1 Học kỳ (Tiết kiệm 50.000 VNĐ)', 3, true),
('year', 'Đăng ký Cả Năm Học (9 tháng)', 9, 400000, 'Thời hạn trọn cả năm học (Tiết kiệm 50.000 VNĐ)', 4, true)
ON CONFLICT (package_key) DO UPDATE SET 
  title = EXCLUDED.title,
  fee_amount = EXCLUDED.fee_amount,
  description = EXCLUDED.description;
