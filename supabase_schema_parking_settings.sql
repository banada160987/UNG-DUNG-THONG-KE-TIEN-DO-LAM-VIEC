-- Script tạo bảng cấu hình thời gian đăng ký (Parking/Bus Settings)
-- Chạy script này trong SQL Editor của Supabase

CREATE TABLE IF NOT EXISTS cbq_parking_settings (
  id integer PRIMARY KEY DEFAULT 1,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_parking_settings ENABLE ROW LEVEL SECURITY;

-- Tạo policies
CREATE POLICY "Public can view parking settings" ON cbq_parking_settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage parking settings" ON cbq_parking_settings FOR ALL USING (auth.role() = 'authenticated');

-- Chèn dữ liệu mặc định
INSERT INTO cbq_parking_settings (id, is_open, notice_message) 
VALUES (1, true, 'Hệ thống đăng ký hiện đang mở.') 
ON CONFLICT (id) DO NOTHING;
