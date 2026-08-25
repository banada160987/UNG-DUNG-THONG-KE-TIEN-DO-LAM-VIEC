-- 1. Create cbq_bus_packages table
CREATE TABLE IF NOT EXISTS cbq_bus_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    package_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    months_count INTEGER NOT NULL,
    fee_amount NUMERIC NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hide_fee BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure package_key is unique just in case it was created without it previously
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cbq_bus_packages_package_key_key' 
           OR conname = 'cbq_bus_packages_package_key_unique'
    ) THEN
        ALTER TABLE cbq_bus_packages ADD CONSTRAINT cbq_bus_packages_package_key_key UNIQUE (package_key);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- constraint already exists
        NULL;
END $$;

-- Insert Default Bus Packages
INSERT INTO cbq_bus_packages (package_key, title, months_count, fee_amount, description, sort_order, is_active)
VALUES
('month_2way', '2 Chieu - Theo Thang', 1, 300000, 'Thoi han 1 thang, dua don 2 chieu (300.000 VNĐ)', 1, true),
('term_2way', '2 Chieu - Theo Hoc Ky', 5, 1400000, 'Dua don 2 chieu, thoi han 5 thang', 2, true),
('month_1way', '1 Chieu - Theo Thang', 1, 180000, 'Thoi han 1 thang, dua don 1 chieu (180.000 VNĐ)', 3, true)
ON CONFLICT (package_key) DO UPDATE SET 
  title = EXCLUDED.title,
  fee_amount = EXCLUDED.fee_amount,
  description = EXCLUDED.description;

-- 2. Add columns to cbq_bus_registrations if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'package_type') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN package_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'start_date') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN start_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'end_date') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN end_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'fee_amount') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN fee_amount NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cbq_bus_registrations' AND column_name = 'status') THEN
        ALTER TABLE cbq_bus_registrations ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) FOR BUS PACKAGES
-- ==========================================
ALTER TABLE cbq_bus_packages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view active bus packages" ON cbq_bus_packages;
    DROP POLICY IF EXISTS "Authenticated users manage bus packages" ON cbq_bus_packages;
END $$;

CREATE POLICY "Public can view active bus packages" 
ON cbq_bus_packages FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users manage bus packages" 
ON cbq_bus_packages FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- BUS SETTINGS TABLE AND RLS
-- ==========================================
CREATE TABLE IF NOT EXISTS cbq_bus_settings (
  id integer PRIMARY KEY DEFAULT 1,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

INSERT INTO cbq_bus_settings (id, is_open, notice_message) 
VALUES (1, true, 'He thong dang ky xe dua don hien dang mo.') 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE cbq_bus_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view bus settings" ON cbq_bus_settings;
    DROP POLICY IF EXISTS "Authenticated users manage bus settings" ON cbq_bus_settings;
END $$;

CREATE POLICY "Public can view bus settings" ON cbq_bus_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users manage bus settings" ON cbq_bus_settings FOR ALL USING (auth.role() = 'authenticated');
