-- =========================================================
-- BẢNG QUẢN LÝ ĐĂNG KÝ VẬN ĐỘNG VIÊN THỂ THAO 30 NĂM
-- =========================================================

CREATE TABLE IF NOT EXISTS cbq_sports_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    sport_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cohort_year TEXT,
    unit_name TEXT NOT NULL,
    notes TEXT,
    user_category TEXT DEFAULT 'Cựu học sinh',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE cbq_sports_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public insert
CREATE POLICY "Public insert sports registrations"
    ON cbq_sports_registrations FOR INSERT
    WITH CHECK (true);

-- Allow public read (to view public athlete list)
CREATE POLICY "Public read sports registrations"
    ON cbq_sports_registrations FOR SELECT
    USING (true);

-- Allow full access for authenticated users
CREATE POLICY "Admin full sports registrations"
    ON cbq_sports_registrations FOR ALL
    USING (auth.role() = 'authenticated');
