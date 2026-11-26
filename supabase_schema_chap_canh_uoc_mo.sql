-- =========================================================================
-- BẢNG DỮ LIỆU PHÂN HỆ QUỸ "CHẮP CÁNH ƯỚC MƠ" - THPT CAO BÁ QUÁT
-- Hỗ trợ học sinh vượt khó học giỏi, tiếp sức đến trường, vinh danh nhà hảo tâm
-- =========================================================================

-- 1. BẢNG HỒ SƠ HỌC SINH NỘP ĐƠN XIN HỌC BỔNG
CREATE TABLE IF NOT EXISTS public.cbq_scholarship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_code TEXT UNIQUE NOT NULL,               -- Mã hồ sơ: HS-CCUM-2026-001
    student_name TEXT NOT NULL,                          -- Họ và tên học sinh
    student_class TEXT NOT NULL,                         -- Lớp học (10A01, 11A02, 12A05...)
    student_code TEXT,                                   -- Mã học sinh (nếu có)
    gender TEXT DEFAULT 'Nam',                           -- Giới tính (Nam / Nữ)
    birthday DATE,                                       -- Ngày sinh
    phone TEXT,                                          -- Số điện thoại học sinh / phụ huynh
    parent_name TEXT,                                    -- Họ tên phụ huynh / người giám hộ
    parent_phone TEXT,                                   -- Số điện thoại người giám hộ
    home_address TEXT,                                   -- Địa chỉ thường trú
    category TEXT NOT NULL,                              -- Hoàn cảnh / Diện ưu tiên
    academic_grade TEXT DEFAULT 'Tốt',                   -- Học lực gần nhất (Tốt / Khá / Đạt)
    conduct_grade TEXT DEFAULT 'Tốt',                    -- Rèn luyện / Hạnh kiểm gần nhất
    circumstance_story TEXT,                             -- Tự thuật hoàn cảnh gia đình
    dream_aspiration TEXT,                               -- Ước mơ tương lai & lời hứa phấn đấu
    evidence_urls JSONB DEFAULT '[]'::jsonb,             -- Danh sách link ảnh chứng nhận / minh chứng
    status TEXT DEFAULT 'pending',                       -- 'pending' (Chờ duyệt), 'approved' (Đã duyệt), 'rejected' (Từ chối)
    scholarship_term TEXT,                               -- Đợt xét duyệt (VD: Đợt 1 - Học kỳ I năm học 2026-2027)
    granted_amount NUMERIC DEFAULT 0,                    -- Số tiền học bổng được phê duyệt (VNĐ)
    granted_item TEXT,                                   -- Hiện vật trao tặng kèm theo (Xe đạp, sách vở...)
    review_note TEXT,                                    -- Nhận xét / Kết luận của Hội đồng xét duyệt
    approved_by TEXT,                                    -- Người duyệt / Ban Giám hiệu
    approved_at TIMESTAMPTZ,                             -- Thời gian phê duyệt
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index tra cứu nhanh
CREATE INDEX IF NOT EXISTS idx_scholarship_app_class ON public.cbq_scholarship_applications(student_class);
CREATE INDEX IF NOT EXISTS idx_scholarship_app_status ON public.cbq_scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_scholarship_app_code ON public.cbq_scholarship_applications(application_code);

-- 2. BẢNG SỔ QUỸ THU - CHI MINH BẠCH
CREATE TABLE IF NOT EXISTS public.cbq_scholarship_fund_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trans_type TEXT NOT NULL CHECK (trans_type IN ('income', 'expense')), -- 'income' (Thu đóng góp) | 'expense' (Chi học bổng)
    amount NUMERIC NOT NULL CHECK (amount >= 0),                          -- Số tiền (VNĐ)
    donor_or_recipient TEXT NOT NULL,                                     -- Người nộp tiền hoặc người nhận học bổng / đơn vị thụ hưởng
    category TEXT NOT NULL,                                               -- Danh mục (Ủng hộ tiền mặt, Trao học bổng, Trợ cấp đột xuất...)
    receipt_code TEXT,                                                    -- Mã phiếu thu / chi (PT-CCUM-001, PC-CCUM-001)
    trans_date DATE DEFAULT CURRENT_DATE,                                 -- Ngày phát sinh
    note TEXT,                                                            -- Diễn giải chi tiết
    recorded_by TEXT DEFAULT 'Ban Quản Lý Quỹ',                           -- Người lập phiếu
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_trans_type ON public.cbq_scholarship_fund_transactions(trans_type);
CREATE INDEX IF NOT EXISTS idx_fund_trans_date ON public.cbq_scholarship_fund_transactions(trans_date);

-- 3. BẢNG CẤU HÌNH QUỸ & TÀI KHOẢN TIẾP NHẬN
CREATE TABLE IF NOT EXISTS public.cbq_scholarship_fund_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    is_open_application BOOLEAN DEFAULT true,                            -- Mở nhận hồ sơ
    application_deadline DATE,                                            -- Hạn chót nhận hồ sơ
    current_term_name TEXT DEFAULT 'Đợt 1 - Năm học 2026-2027',           -- Tên đợt xét học bổng hiện tại
    bank_name TEXT DEFAULT 'Vietcombank',                                -- Ngân hàng tiếp nhận
    bank_account_number TEXT DEFAULT '1028688888',                        -- Số tài khoản
    bank_account_name TEXT DEFAULT 'QUY HOC BONG CHAP CANH UOC MO THPT CAO BA QUAT',
    bank_branch TEXT DEFAULT 'Chi nhánh Gia Lâm - Hà Nội',
    qr_template TEXT DEFAULT 'compact2',
    hotline TEXT DEFAULT '024.3827.1856',
    default_scholarship_amount NUMERIC DEFAULT 2000000,                   -- Mức học bổng đề xuất (2.000.000 VNĐ)
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Khởi tạo dữ liệu cấu hình mặc định nếu chưa có
INSERT INTO public.cbq_scholarship_fund_settings (id, is_open_application, current_term_name, bank_name, bank_account_number, bank_account_name, hotline)
VALUES ('default', true, 'Đợt 1 - Năm học 2026-2027', 'Vietcombank', '1028688888', 'QUY HOC BONG CHAP CANH UOC MO THPT CAO BA QUAT', '024.3827.1856')
ON CONFLICT (id) DO NOTHING;

-- BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.cbq_scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_scholarship_fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbq_scholarship_fund_settings ENABLE ROW LEVEL SECURITY;

-- Policy cho phép nộp đơn và tra cứu công khai
CREATE POLICY "Cho phep cong khai doc va nop don xin hoc bong" ON public.cbq_scholarship_applications
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Cho phep cong khai doc va ghi so quy" ON public.cbq_scholarship_fund_transactions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Cho phep doc va sua cau hinh quy" ON public.cbq_scholarship_fund_settings
    FOR ALL USING (true) WITH CHECK (true);
