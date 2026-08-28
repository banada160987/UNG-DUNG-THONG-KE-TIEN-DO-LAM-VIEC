-- =======================================================
-- MIGRATION SCRIPT: DIGITAL VAULT (SỐ HÓA VĂN BẰNG)
-- =======================================================

-- 1. Bảng lưu trữ Văn bằng, Giấy tờ số hóa
CREATE TABLE IF NOT EXISTS cbq_digital_documents (
    id SERIAL PRIMARY KEY,
    document_code TEXT UNIQUE NOT NULL, -- Mã tra cứu QR code duy nhất
    student_name TEXT NOT NULL,         -- Tên học sinh nhận
    student_class TEXT NOT NULL,        -- Lớp của học sinh
    document_type TEXT NOT NULL,        -- Loại giấy tờ (Giấy khen, Giấy chứng nhận,...)
    title TEXT NOT NULL,                -- Tiêu đề (VD: Chứng nhận Học sinh Giỏi)
    content TEXT,                       -- Nội dung chi tiết (nếu có)
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Ngày cấp
    issued_by TEXT NOT NULL,            -- Tên người/đơn vị cấp (VD: BGH, Đoàn trường)
    status TEXT DEFAULT 'Active',       -- Trạng thái: Active, Revoked (Thu hồi)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tạo một vài bản ghi mẫu để test
INSERT INTO cbq_digital_documents (document_code, student_name, student_class, document_type, title, content, issued_by)
VALUES 
('CBQ-2026-GK001', 'Nguyễn Văn A', '10A1', 'Giấy khen', 'Giấy khen Học sinh Giỏi', 'Đã có thành tích xuất sắc trong học tập học kỳ 1.', 'Hiệu trưởng'),
('CBQ-2026-CN002', 'Trần Thị B', '11A2', 'Giấy chứng nhận', 'Chứng nhận Cán bộ Đoàn xuất sắc', 'Đóng góp tích cực cho phong trào thanh niên.', 'BCH Đoàn trường')
ON CONFLICT (document_code) DO NOTHING;
