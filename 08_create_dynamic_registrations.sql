-- 08_create_dynamic_registrations.sql
-- Kịch bản tạo bảng Quản lý Đăng ký Nội Dung Động

-- 1. Bảng lưu trữ các đợt đăng ký (Campaigns)
CREATE TABLE IF NOT EXISTS cbq_registration_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  target_grades text[], -- Mảng lưu trữ danh sách khối được áp dụng, VD: ['Khối 10', 'Khối 11']. Rỗng = Áp dụng toàn trường.
  form_schema jsonb NOT NULL DEFAULT '[]'::jsonb, -- Cấu trúc các câu hỏi/lựa chọn trong form
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng lưu trữ phản hồi/kết quả đăng ký của học sinh
CREATE TABLE IF NOT EXISTS cbq_student_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES cbq_registration_campaigns(id) ON DELETE CASCADE,
  student_code text NOT NULL,
  student_name text NOT NULL,
  student_class text,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb, -- Câu trả lời của học sinh định dạng JSON
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Ràng buộc mỗi học sinh chỉ được đăng ký 1 lần cho mỗi chiến dịch
  UNIQUE(campaign_id, student_code)
);

-- Bật Row Level Security (nếu hệ thống đã được thiết lập RLS)
-- ALTER TABLE cbq_registration_campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cbq_student_registrations ENABLE ROW LEVEL SECURITY;
