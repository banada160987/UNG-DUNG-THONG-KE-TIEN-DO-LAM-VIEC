-- =======================================================
-- MIGRATION SCRIPT: STUDENT ROLES EXTENDED MODULES
-- =======================================================

-- 1. Bảng Báo cáo chuyên cần học tập (Dành cho Lớp phó HT)
CREATE TABLE IF NOT EXISTS cbq_academic_reports (
    id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    subject TEXT NOT NULL,
    missing_homework_students TEXT,
    not_memorized_students TEXT,
    notes TEXT,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Điểm danh Sự kiện (Dành cho Bí thư)
CREATE TABLE IF NOT EXISTS cbq_event_attendance (
    id SERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    class_name TEXT NOT NULL,
    attended_students TEXT NOT NULL,
    total_attended INTEGER DEFAULT 0,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
