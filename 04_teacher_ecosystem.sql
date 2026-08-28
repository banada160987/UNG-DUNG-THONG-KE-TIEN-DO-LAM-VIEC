-- =======================================================
-- MIGRATION SCRIPT: TEACHER ECOSYSTEM
-- =======================================================

-- 1. Bảng Tài khoản Giáo viên
CREATE TABLE IF NOT EXISTS cbq_teacher_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    homeroom_class TEXT, -- Lớp chủ nhiệm (có thể null nếu chỉ là GV bộ môn)
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Thêm tài khoản test (Mật khẩu mặc định là 123456, bạn nên đổi sau)
INSERT INTO cbq_teacher_users (username, password_hash, full_name, homeroom_class)
VALUES ('gv.nguyenvana', '123456', 'Nguyễn Văn A', '10A1')
ON CONFLICT (username) DO NOTHING;

-- 2. Bảng Các đợt thu tiền (Fee Campaigns)
CREATE TABLE IF NOT EXISTS cbq_fee_campaigns (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    campaign_name TEXT NOT NULL, -- VD: Quỹ lớp Học kỳ 1, Tiền BHYT
    amount_per_student INTEGER NOT NULL, -- Số tiền/1 HS
    deadline DATE,
    created_by TEXT NOT NULL, -- username của GVCN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Lịch sử Nộp tiền của Học sinh (Fee Transactions)
CREATE TABLE IF NOT EXISTS cbq_fee_transactions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES cbq_fee_campaigns(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    amount_paid INTEGER NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'Tiền mặt', -- Tiền mặt, Chuyển khoản
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
