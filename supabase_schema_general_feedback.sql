-- =========================================================
-- HỆ THỐNG QUẢN LÝ & CẤU HÌNH GÓP Ý CÔNG VIỆC / ĐỀ ÁN TRƯỜNG THPT CAO BÁ QUÁT
-- =========================================================

-- 1. Bảng Chủ đề / Công việc cần lấy ý kiến
CREATE TABLE IF NOT EXISTS cbq_feedback_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    dispatch_number TEXT,
    description TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    contact_info TEXT,
    attached_doc_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Bảng Phản hồi / Ý kiến đóng góp cho từng công việc
CREATE TABLE IF NOT EXISTS cbq_feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES cbq_feedback_topics(id) ON DELETE CASCADE,
    organization_unit TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    agreement_level TEXT DEFAULT 'thong_nhat',
    feedback_content TEXT NOT NULL,
    attached_file_url TEXT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_feedback_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbq_feedback_responses ENABLE ROW LEVEL SECURITY;

-- Policies for Topics
DROP POLICY IF EXISTS "Public read topics" ON cbq_feedback_topics;
DROP POLICY IF EXISTS "Admin manage topics" ON cbq_feedback_topics;

CREATE POLICY "Public read topics" ON cbq_feedback_topics FOR SELECT USING (true);
CREATE POLICY "Admin manage topics" ON cbq_feedback_topics FOR ALL USING (true);

-- Policies for Responses
DROP POLICY IF EXISTS "Public read responses" ON cbq_feedback_responses;
DROP POLICY IF EXISTS "Public insert responses" ON cbq_feedback_responses;
DROP POLICY IF EXISTS "Admin manage responses" ON cbq_feedback_responses;

CREATE POLICY "Public read responses" ON cbq_feedback_responses FOR SELECT USING (true);
CREATE POLICY "Public insert responses" ON cbq_feedback_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage responses" ON cbq_feedback_responses FOR ALL USING (true);

-- SEED CHỦ ĐỀ MẶC ĐỊNH: ĐỀ ÁN QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ TUỔI HỌC TRÒ"
INSERT INTO cbq_feedback_topics (id, title, dispatch_number, description, deadline, contact_info, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
    'Dự thảo Đề án Thành lập Quỹ Học bổng "Chắp cánh ước mơ tuổi học trò" Trường THPT Cao Bá Quát',
    'Công văn số 409/SGDĐT-VP & Kế hoạch 53/KH-TrTHPTCBQ',
    'Căn cứ Công văn 409/SGDĐT-VP ngày 11/02/2026 của Sở GD&ĐT và Kế hoạch 53/KH-TrTHPTCBQ ngày 12/3/2026. Đề nghị BCH Đảng ủy, BTV Đoàn trường, các Tổ chuyên môn & Tổ Văn phòng gửi góp ý về dự thảo Đề án Quỹ học bổng.',
    '2026-08-19T23:59:59+07:00',
    'Đồng chí Nghiêm Xuân Bảo – Nhân viên Tổ Văn phòng',
    true
)
ON CONFLICT (id) DO NOTHING;
