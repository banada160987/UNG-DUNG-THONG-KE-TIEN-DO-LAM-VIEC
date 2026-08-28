-- =======================================================
-- MIGRATION SCRIPT: STUDENT ROLES & PROFESSIONAL MODULES
-- =======================================================

-- 1. Bảng lưu trữ tài khoản Học sinh (nếu chưa có)
CREATE TABLE IF NOT EXISTS cbq_student_users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    student_class TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Bổ sung chức vụ cho học sinh (nếu bảng đã có từ trước nhưng thiếu cột role)
ALTER TABLE cbq_student_users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member'; -- member, class_president, vp_academics, inspector, youth_union_secretary

-- 2. Bảng Sổ đầu bài điện tử (Dành cho Lớp trưởng)
CREATE TABLE IF NOT EXISTS cbq_class_journals (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    study_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_number INTEGER NOT NULL, -- Tiết mấy (1-10)
    subject TEXT NOT NULL,
    teacher_name TEXT,
    absent_students TEXT, -- Danh sách vắng
    notes TEXT, -- Nhận xét tiết học
    status TEXT DEFAULT 'pending', -- pending, approved (Đợi GVCN duyệt)
    logged_by TEXT NOT NULL, -- username của Lớp trưởng
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bảng Phân công trực nhật (Dành cho Lớp trưởng)
CREATE TABLE IF NOT EXISTS cbq_duty_rosters (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    duty_date DATE NOT NULL,
    assigned_students TEXT NOT NULL,
    task_description TEXT,
    is_completed BOOLEAN DEFAULT false,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Bảng Chấm điểm nề nếp (Dành cho Cờ đỏ)
CREATE TABLE IF NOT EXISTS cbq_discipline_records (
    id SERIAL PRIMARY KEY,
    inspected_class TEXT NOT NULL,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    violation_type TEXT NOT NULL, -- VD: Không đeo thẻ, Xả rác, Trễ học
    point_deduction INTEGER DEFAULT 0,
    evidence_url TEXT, -- Link ảnh chụp nếu có
    notes TEXT,
    logged_by TEXT NOT NULL, -- username của Cờ đỏ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Bảng Quản lý Quỹ đoàn/Quỹ lớp (Dành cho Bí thư)
CREATE TABLE IF NOT EXISTS cbq_youth_union_funds (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL, -- 'thu' hoặc 'chi'
    description TEXT NOT NULL,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
