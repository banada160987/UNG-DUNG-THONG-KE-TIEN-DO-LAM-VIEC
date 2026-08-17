-- =========================================================
-- BẢNG QUẢN LÝ Ý KIẾN GÓP Ý DỰ THẢO ĐỀ ÁN QUỸ HỌC BỔNG "CHẮP CÁNH ƯỚC MƠ TUỔI HỌC TRÒ"
-- =========================================================

CREATE TABLE IF NOT EXISTS cbq_scholarship_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_unit TEXT NOT NULL,
    representative_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    feedback_content TEXT NOT NULL,
    attached_file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_scholarship_feedback ENABLE ROW LEVEL SECURITY;

-- Allow public insert
CREATE POLICY "Public insert scholarship feedback"
    ON cbq_scholarship_feedback FOR INSERT
    WITH CHECK (true);

-- Allow public read
CREATE POLICY "Public read scholarship feedback"
    ON cbq_scholarship_feedback FOR SELECT
    USING (true);

-- Allow admin full access
CREATE POLICY "Admin full scholarship feedback"
    ON cbq_scholarship_feedback FOR ALL
    USING (auth.role() = 'authenticated');
