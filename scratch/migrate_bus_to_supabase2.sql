-- SCRIPT KHỞI TẠO BẢNG VÀ ĐỒNG BỘ 19 BẢN GHI XE ĐƯA ĐÓN SANG SUPABASE 2

-- 1. Tạo bảng cbq_bus_packages
CREATE TABLE IF NOT EXISTS cbq_bus_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    months_count INTEGER NOT NULL,
    fee_amount NUMERIC NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hide_fee BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo bảng cbq_bus_settings
CREATE TABLE IF NOT EXISTS cbq_bus_settings (
  id integer PRIMARY KEY DEFAULT 1,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Tạo bảng cbq_bus_registrations
CREATE TABLE IF NOT EXISTS cbq_bus_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_code TEXT UNIQUE,
    student_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    student_code TEXT NOT NULL,
    address TEXT,
    distance_km TEXT,
    pickup_point TEXT,
    route_type TEXT DEFAULT '2-way',
    package_type TEXT,
    start_date DATE,
    end_date DATE,
    fee_amount NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật RLS và thêm chính sách cơ bản
ALTER TABLE cbq_bus_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_bus_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_bus_registrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view active bus packages" ON cbq_bus_packages;
    DROP POLICY IF EXISTS "Authenticated users manage bus packages" ON cbq_bus_packages;
    DROP POLICY IF EXISTS "Public read bus settings" ON cbq_bus_settings;
    DROP POLICY IF EXISTS "Public full access bus registrations" ON cbq_bus_registrations;
END $$;

CREATE POLICY "Public can view active bus packages" ON cbq_bus_packages FOR SELECT USING (true);
CREATE POLICY "Authenticated users manage bus packages" ON cbq_bus_packages FOR ALL USING (true);
CREATE POLICY "Public read bus settings" ON cbq_bus_settings FOR SELECT USING (true);
CREATE POLICY "Public full access bus registrations" ON cbq_bus_registrations FOR ALL USING (true);

-- 4. Chèn cấu hình xe đưa đón
INSERT INTO cbq_bus_settings (id, start_time, end_time, is_open, notice_message)
VALUES (1, '2026-08-23 13:42:00+00', '2026-09-08 16:59:00+00', true, 'Hệ thống đăng ký đang mở')
ON CONFLICT (id) DO UPDATE SET
  is_open = EXCLUDED.is_open,
  notice_message = EXCLUDED.notice_message;

-- 5. Chèn các gói cước xe đưa đón
INSERT INTO cbq_bus_packages (id, package_key, title, months_count, fee_amount, description, sort_order, is_active, hide_fee) VALUES
('e58d709e-2808-4263-b0b1-484d50e088c8', 'month', 'Đăng ký Theo Tháng', 1, 50000, 'Thời hạn 1 tháng', 0, true, true),
('514c6001-d4ae-4fc3-8669-cdd147b3f9b9', 'term', 'Đăng ký Theo Học Kỳ (5 tháng)', 5, 200000, 'Thời hạn 1 Học kỳ', 0, true, true),
('9a7f5bce-f2de-49c3-bfcb-da2e221a9ccc', 'year', 'Đăng ký Cả Năm Học (9 tháng)', 9, 400000, 'Thời hạn trọn cả năm học', 0, true, true),
('c02ba1ce-aaa6-4b9e-a8b4-638f3b20466c', 'month_2way', '2 Chieu - Theo Thang', 1, 300000, 'Thoi han 1 thang, dua don 2 chieu', 1, false, true),
('8ce14c9b-f4a1-4a4b-bfe3-e808b769b154', 'term_2way', '2 Chieu - Theo Học Kỳ', 5, 1400000, 'Dua don 2 chieu, thoi han 5 thang', 2, false, true),
('31d1b035-71ae-400b-8286-b391461fa4b7', 'month_1way', '1 Chieu - Theo Thang', 1, 180000, 'Thoi han 1 thang, dua don 1 chieu', 3, false, true)
ON CONFLICT (package_key) DO UPDATE SET
  title = EXCLUDED.title,
  fee_amount = EXCLUDED.fee_amount;

-- 6. Chèn 19 bản ghi đăng ký xe đưa đón đã lấy từ Supabase 1
INSERT INTO cbq_bus_registrations (id, ticket_code, student_name, student_class, student_code, address, distance_km, pickup_point, route_type, package_type, start_date, end_date, fee_amount, status, created_at) VALUES
('b0147f41-2081-4a57-9b1f-f22c841cad07', 'BUS-10A15-590', 'NGUYỄN MINH HUY', '10A15', '66000713-00-14227', '132 đào duy từ, phường buôn ma thuột', '12', 'Ngã tư điện biên phủ và quang trung', '2-way', 'month', '2026-09-07', '2026-10-07', 50000, 'active', '2026-09-07 14:03:41.848711+00'),
('cb606afc-e638-4bb0-b8dc-5d1f74c476c7', 'BUS-10A05-325', 'Ngô Nguyễn Khánh Linh', '10A05', '66000713-00-14359', '98/14 nguyễn cơ thạch phường thành nhất', '13', 'Ngã ba cuối đường nguyễn cơ thạch', '2-way', 'month', '2026-09-07', '2026-10-07', 50000, 'active', '2026-09-07 10:53:05.017885+00'),
('57d6ef75-dc96-4f45-8998-4810132ae03e', 'BUS-10A02-797', 'Vương Quốc Anh', '10A02', '66000713-00-13932', '51 Đỗ Nhuận Phường Bmt', '5', 'Nhà 51 đỗ nhuận', '2-way', 'month', '2026-09-07', '2026-10-07', 50000, 'active', '2026-09-07 09:53:16.311342+00'),
('642855bc-11d7-4cb6-8aa1-0200224bd246', 'BUS-10A12-913', 'NGUYỄN THỊ MINH THƯ', '10A12', '66000713-00-14228', '248/2/2 xố viết nghệ tĩnh', '8', 'đầu đường bãi đất trống', '2-way', 'month', '2026-09-07', '2026-10-07', 50000, 'active', '2026-09-07 09:21:21.61603+00'),
('cbc239f8-3903-4d46-ba2a-75146116f621', 'BUS-10A02-452', 'Hoàng Đức Huy', '10A02', '66000713-00-14219', 'Số 1 Nguyễn Thị Minh Khai, Phường Buôn Ma Thuột', '8', 'Số 1 Nguyễn Thị Minh Khai, Phường Buôn Ma Thuột', '2-way', 'term', '2026-09-01', '2027-02-01', 200000, 'active', '2026-09-01 15:56:39.810725+00'),
('ec548a59-bb86-4199-8378-6de9598afb17', 'BUS-10A07-302', 'NGUYỄN GIA BẢO VY', '10A07', '66000713-00-14076', '181/62A Quang Trung', '14', 'Cổng sau trường tiểu học Lê Hồng Phong', '2-way', 'month', '2026-09-01', '2027-02-01', 50000, 'active', '2026-09-01 13:33:02.550089+00'),
('82795709-5eec-48c8-8760-e2782737ae8d', 'BUS-10A12-437', 'Hoàng Phương Anh', '10A12', '66000713-00-14309', '71 đào duy từ phường thành công', '8', '71 đào duy từ', '2-way', 'term', '2026-09-01', '2027-02-01', 200000, 'active', '2026-09-01 13:29:11.118009+00'),
('60c68a6e-0e8d-42db-a1bc-fb78771d43d6', 'BUS-11A02-724', 'Nguyễn Huân Gia Hân', '11A02', '66000713-00-13415', 'Số nhà 110, tổ dân phố 11, phường tân an', '9', 'Trước nhà', '2-way', 'month', '2026-08-27', '2026-09-27', 50000, 'active', '2026-08-27 15:05:34.029902+00'),
('715406c4-4f4c-4deb-9400-76b8fa83ad47', 'BUS-10A05-274', 'Phạm Đình Thiện', '10A05', '66000713-00-14024', '313 Nguyễn thị định,phường thành nhất', '15', '313 Nguyễn thị định ,phường thành nhất', '2-way', 'term', '2026-08-27', '2027-01-27', 200000, 'active', '2026-08-27 14:57:03.065502+00'),
('32ddbcbf-08dd-40e2-b5ee-b3adbda18f97', 'BUS-10A10-102', 'PHẠM THỊ QUỲNH THƯ', '10A10', '66000713-00-13972', 'Hẻm 39A y ngông nối dài', '14', 'Đầu hẻm 39A y ngông nối dài', '2-way', 'month', '2026-08-27', '2026-09-27', 50000, 'active', '2026-08-27 04:48:28.32939+00'),
('2e40fd5e-1ae9-4799-ad92-3b385a66c9d0', 'BUS-10A09-612', 'Trần Nguyễn Trà Giang', '10A09', '66000713-00-14021', '178 Quang Trung', '15', '178 Quang Trung', '2-way', 'month', '2026-08-27', '2026-09-27', 50000, 'active', '2026-08-27 02:32:40.398055+00'),
('1e7a7656-a55b-40fd-873c-565ab1fb5f4a', 'BUS-10A09-492', 'Nguyễn Văn Tùng', '10A09', '66000713-00-14026', '102A/5  Nguyễn Tất Thành', '12', '102 Nguyễn Tất Thành', '2-way', 'month', '2026-08-27', '2026-09-27', 50000, 'active', '2026-08-27 02:16:07.22295+00'),
('1974f6f9-c391-4c5a-a8b9-6bad864958e1', 'BUS-10A05-873', 'Nguyễn Trần Thúy Vân', '10A05', '66000713-00-14336', '61 hoàng hoa thám', '13', '61 hoàng hoa thám', '2-way', 'term', '2026-08-25', '2027-01-25', 200000, 'active', '2026-08-25 12:02:01.948414+00'),
('5cc2c550-65ca-4185-b73c-f53dc24eab39', 'BUS-10A05-920', 'Hồ Gia Huy', '10A05', '66000713-00-13964', '03 cống quỳnh phường tân an thành phố buôn ma thuột', '7', '03 cống quỳnh,phường tân an,thành phố buôn ma thuột', '2-way', 'month', '2026-08-25', '2026-09-25', 50000, 'active', '2026-08-25 11:58:33.765085+00'),
('aa2ec314-28f8-4e26-b3ca-fc60669389c0', 'BUS-10A02-498', 'Nguyễn Tiến Đạt', '10A02', '66000713-00-13762', '891 Hà Huy Tập', '7', '891 Hà Huy Tập', '2-way', 'term', '2026-08-25', '2027-01-25', 200000, 'active', '2026-08-25 10:58:17.640566+00'),
('9eb317d7-4510-47af-b065-7067aecd0188', 'BUS-10A12-503', 'Nguyễn Quang Đức', '10A12', '66000713-00-14213', '129 Quang Trung phường Tân tiến', '10', '129 Quang Trung', '2-way', 'month_2way', '2026-08-25', '2026-09-25', 300000, 'active', '2026-08-25 06:14:15.966915+00'),
('68745bfb-13ba-4838-b835-21094cfc96f8', 'BUS-10A05-777', 'Trần Thị Ái Nhi', '10A05', '66000713-00-14018', 'Hem 72 trần Qúy cáp Tân Lập Đaklak', '9', 'Đầu hem 72 trần Qúy cáp Tân lập Đaklak', '2-way', 'term', '2026-08-25', '2027-01-25', 200000, 'active', '2026-08-25 05:36:59.325627+00'),
('e46d9a0c-9e35-4e10-bffb-d54c89fe27ef', 'BUS-10A06-460', 'H Tươi Êban', '10A06', '66000713-00-14143', '451/71 y moan', '7', 'trường tiểu học nơ trang lơng', '2-way', 'term_2way', '2026-08-25', '2027-01-25', 1400000, 'active', '2026-08-25 04:32:48.78296+00'),
('98726c9e-2bb5-4737-93f0-515f257435f7', 'BUS-10A03-294', 'Nguyễn Trần Bảo Châu', '10A03', '66000713-00-14356', '32/1 An Dương Vương', '13', '32 An dương vương', '2-way', 'month_2way', '2026-08-25', '2026-09-25', 300000, 'active', '2026-08-25 04:04:28.911696+00')
ON CONFLICT (id) DO NOTHING;
