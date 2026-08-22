-- SQL Script for Student Motorbike Parking Management Module

CREATE TABLE IF NOT EXISTS cbq_parking_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code text UNIQUE NOT NULL, -- e.g. "PARK-11A1-001"
  student_name text NOT NULL,
  student_code text, -- Mã học sinh (nếu có)
  student_class text NOT NULL, -- e.g. "11A1", "12A3"
  grade_level text, -- "Khối 10", "Khối 11", "Khối 12"
  license_plate text NOT NULL, -- Biển số xe (e.g. "29B1-123.45")
  vehicle_type text DEFAULT 'Xe máy điện', -- "Xe máy điện", "Xe máy 50cc", "Xe máy >50cc"
  vehicle_color text, -- e.g. "Đen Đỏ"
  package_type text NOT NULL DEFAULT 'month', -- 'month' (Tháng), 'term' (Học kỳ), 'quarter' (Quý), 'year' (Cả năm)
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  fee_amount numeric DEFAULT 0,
  status text DEFAULT 'active', -- 'pending' (Chờ duyệt), 'active' (Đang hoạt động), 'expired' (Hết hạn)
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cbq_parking_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view parking registrations" ON cbq_parking_registrations FOR SELECT USING (true);
CREATE POLICY "Public can register parking" ON cbq_parking_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users manage parking" ON cbq_parking_registrations FOR ALL USING (auth.role() = 'authenticated');

-- Initial Sample Data for Motorbike Parking
INSERT INTO cbq_parking_registrations 
(ticket_code, student_name, student_code, student_class, grade_level, license_plate, vehicle_type, vehicle_color, package_type, start_date, end_date, fee_amount, status)
VALUES
('PARK-11A1-001', 'Nguyễn Văn An', 'HS11A1-01', '11A1', 'Khối 11', '29B1-567.89', 'Xe máy điện', 'Đen nhám', 'term', '2026-09-01', '2027-01-15', 200000, 'active'),
('PARK-12A3-002', 'Trần Thị Bích', 'HS12A3-05', '12A3', 'Khối 12', '29H1-888.66', 'Xe máy 50cc', 'Trắng đỏ', 'year', '2026-09-01', '2027-05-31', 450000, 'active'),
('PARK-10A2-003', 'Phạm Minh Cường', 'HS10A2-12', '10A2', 'Khối 10', '29K1-345.12', 'Xe máy điện', 'Xanh dương', 'month', '2026-09-01', '2026-09-30', 50000, 'active')
ON CONFLICT (ticket_code) DO NOTHING;
