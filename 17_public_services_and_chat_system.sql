-- =========================================================================
-- HỆ THỐNG DỊCH VỤ CÔNG TRỰC TUYẾN & NHẮN TIN NỘI BỘ (CBQ CHAT & DVC)
-- TRƯỜNG THPT CAO BÁ QUÁT - QUỐC OAI, HÀ NỘI
-- Phục vụ: Phụ Huynh Học Sinh, Giáo Viên, Ban Giám Hiệu
-- =========================================================================

-- 1. BẢNG TIẾP NHẬN DỊCH VỤ CÔNG TRỰC TUYẾN (DVC)
CREATE TABLE IF NOT EXISTS public.cbq_public_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,                  -- Mã hồ sơ tra cứu (VD: CBQ-DVC-2026-0891)
    procedure_type VARCHAR(100) NOT NULL,               -- Loại thủ tục (xac_nhan_hoc_sinh, sao_y_hoc_ba, don_xin_nghi_hoc, chuyen_truong)
    procedure_title VARCHAR(255) NOT NULL,              -- Tiêu đề thủ tục hiển thị
    student_name VARCHAR(150) NOT NULL,                 -- Họ và tên học sinh
    student_code VARCHAR(50),                           -- Mã học sinh
    student_class VARCHAR(50) NOT NULL,                 -- Lớp học
    birth_date VARCHAR(50),                             -- Ngày sinh
    gender VARCHAR(20) DEFAULT 'Nam',                   -- Giới tính
    identity_card VARCHAR(50),                          -- Số CCCD học sinh (12 số)
    parent_name VARCHAR(150) NOT NULL,                  -- Họ và tên phụ huynh / người nộp
    parent_phone VARCHAR(50) NOT NULL,                  -- Số điện thoại phụ huynh liên hệ / Zalo
    parent_email VARCHAR(100),                          -- Email phụ huynh (nếu có)
    reason TEXT NOT NULL,                               -- Mục đích / Lý do xin giấy
    attachment_urls TEXT[] DEFAULT '{}',                -- Ảnh đính kèm (ảnh CCCD, đơn thuốc...)
    delivery_method VARCHAR(50) DEFAULT 'digital_pdf',  -- Hình thức nhận (digital_pdf, hard_copy_at_school)
    status VARCHAR(50) DEFAULT 'pending',               -- pending, processing, approved, rejected, completed
    rejection_reason TEXT,                              -- Lý do từ chối (nếu có)
    digital_certificate_code VARCHAR(100),              -- Mã xác thực mộc số điện tử SHA-256
    processed_at TIMESTAMPTZ,                           -- Thời gian xử lý duyệt
    processed_by VARCHAR(150),                          -- Cán bộ phê duyệt
    admin_notes TEXT,                                   -- Ghi chú nội bộ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chỉ mục tối ưu tra cứu hồ sơ
CREATE INDEX IF NOT EXISTS idx_cbq_public_services_code ON public.cbq_public_services(code);
CREATE INDEX IF NOT EXISTS idx_cbq_public_services_phone ON public.cbq_public_services(parent_phone);
CREATE INDEX IF NOT EXISTS idx_cbq_public_services_status ON public.cbq_public_services(status);
CREATE INDEX IF NOT EXISTS idx_cbq_public_services_class ON public.cbq_public_services(student_class);

-- Mở quyền cho bảng dịch vụ công
ALTER TABLE public.cbq_public_services DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.cbq_public_services TO anon, authenticated, public;


-- 2. BẢNG TIN NHẮN NỘI BỘ (CBQ REALTIME CHAT)
CREATE TABLE IF NOT EXISTS public.cbq_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id VARCHAR(100) NOT NULL,                  -- Mã kênh (general, class-12a1, dept-toan, support-dvc...)
    channel_name VARCHAR(150) NOT NULL,                -- Tên hiển thị kênh
    sender_id VARCHAR(100),                             -- ID người gửi (user email / phone)
    sender_name VARCHAR(150) NOT NULL,                 -- Tên người gửi hiển thị
    sender_role VARCHAR(50) DEFAULT 'parent',          -- admin, teacher, parent, student
    sender_avatar VARCHAR(255),                        -- Avatar người gửi
    content TEXT NOT NULL,                             -- Nội dung tin nhắn
    attachments JSONB DEFAULT '[]'::jsonb,             -- Ảnh / Tệp đính kèm [{name, url, type, size}]
    likes_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,             -- Đánh dấu thông báo quan trọng
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chỉ mục tối ưu tải tin nhắn theo kênh
CREATE INDEX IF NOT EXISTS idx_cbq_chat_messages_channel ON public.cbq_chat_messages(channel_id, created_at DESC);

-- Mở quyền cho bảng tin nhắn
ALTER TABLE public.cbq_chat_messages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.cbq_chat_messages TO anon, authenticated, public;

-- Đăng ký realtime replication cho tin nhắn tức thời
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cbq_public_services;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cbq_chat_messages;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
