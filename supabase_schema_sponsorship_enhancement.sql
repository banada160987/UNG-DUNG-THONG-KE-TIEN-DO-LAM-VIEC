-- =========================================================================
-- PHÂN HỆ NÂNG CẤP: BẢO TRỢ HỌC SINH KHÓ KHĂN & MINH BẠCH NGUỒN TIỀN MTQ
-- Dành cho: GVCN, Đoàn Thanh niên, Ban Giám hiệu và Mạnh Thường Quân
-- =========================================================================

-- 1. Thêm các cột phục vụ Bảo trợ & Giám sát nguồn tiền vào bảng cbq_scholarship_applications
ALTER TABLE IF EXISTS public.cbq_scholarship_applications 
ADD COLUMN IF NOT EXISTS proposed_by_role TEXT DEFAULT 'homeroom_teacher', -- 'homeroom_teacher' | 'youth_union' | 'student'
ADD COLUMN IF NOT EXISTS proposer_name TEXT,                             -- Tên GVCN hoặc cán bộ Đoàn đề xuất
ADD COLUMN IF NOT EXISTS proposer_phone TEXT,                            -- SĐT người đề xuất
ADD COLUMN IF NOT EXISTS sponsorship_status TEXT DEFAULT 'pending_approval', 
-- 'pending_approval' (Chờ BGH duyệt)
-- 'ready_for_sponsor' (Lãnh đạo ĐÃ DUYỆT - sẵn sàng nhận bảo trợ)
-- 'sponsored' (Đã có Mạnh thường quân nhận bảo trợ)
-- 'completed' (Đã trao đủ kinh phí)
ADD COLUMN IF NOT EXISTS sponsor_id TEXT,                                 -- Mã hoặc ID Mạnh thường quân
ADD COLUMN IF NOT EXISTS sponsor_name TEXT,                               -- Tên Mạnh thường quân / Doanh nghiệp
ADD COLUMN IF NOT EXISTS sponsor_phone TEXT,                              -- SĐT Mạnh thường quân
ADD COLUMN IF NOT EXISTS sponsor_code TEXT,                               -- Mã truy cập bảo mật của MTQ
ADD COLUMN IF NOT EXISTS target_support_amount NUMERIC DEFAULT 2000000,   -- Mức kinh phí cần hỗ trợ (VNĐ)
ADD COLUMN IF NOT EXISTS funded_amount NUMERIC DEFAULT 0,                 -- Số tiền MTQ đã chuyển vào quỹ
ADD COLUMN IF NOT EXISTS delivered_amount NUMERIC DEFAULT 0,              -- Số tiền nhà trường đã trao tận tay học sinh
ADD COLUMN IF NOT EXISTS delivery_date DATE,                              -- Ngày trao tiền gần nhất
ADD COLUMN IF NOT EXISTS delivery_proof_urls JSONB DEFAULT '[]'::jsonb,   -- Ảnh chụp lễ trao, biên bản ký nhận
ADD COLUMN IF NOT EXISTS progress_reports JSONB DEFAULT '[]'::jsonb,      -- Nhật ký tiến bộ học tập, thư cảm ơn
ADD COLUMN IF NOT EXISTS messages_from_sponsor JSONB DEFAULT '[]'::jsonb; -- Lời nhắn động viên của MTQ gửi học sinh

-- 2. BẢNG MẠNH THƯỜNG QUÂN (TÀI KHOẢN & PHÂN QUYỀN TRUY CẬP)
CREATE TABLE IF NOT EXISTS public.cbq_sponsor_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_code TEXT UNIQUE NOT NULL,                       -- Mã bảo mật truy cập: MTQ-CBQ-XXXX
    full_name TEXT NOT NULL,                                 -- Họ tên MTQ / Tên Doanh nghiệp / Khóa Cựu HS
    phone TEXT NOT NULL,                                     -- SĐT liên hệ
    email TEXT,                                              -- Email
    organization TEXT,                                       -- Đơn vị / Cơ quan / Khóa cựu học sinh
    pin_code TEXT DEFAULT '123456',                          -- Mã PIN bảo mật 6 số để đăng nhập cổng MTQ
    total_committed NUMERIC DEFAULT 0,                       -- Tổng tiền cam kết tài trợ
    total_delivered NUMERIC DEFAULT 0,                       -- Tổng tiền đã trao tận tay học sinh
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index tra cứu
CREATE INDEX IF NOT EXISTS idx_sponsor_acc_code ON public.cbq_sponsor_accounts(sponsor_code);
CREATE INDEX IF NOT EXISTS idx_scholarship_sponsorship_status ON public.cbq_scholarship_applications(sponsorship_status);
CREATE INDEX IF NOT EXISTS idx_scholarship_sponsor_code ON public.cbq_scholarship_applications(sponsor_code);

-- RLS Policies
ALTER TABLE public.cbq_sponsor_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phep doc va ghi tai khoan MTQ" ON public.cbq_sponsor_accounts
    FOR ALL USING (true) WITH CHECK (true);
