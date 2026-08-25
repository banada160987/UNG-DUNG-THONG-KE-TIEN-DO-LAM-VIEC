-- 1. Create cbq_bus_packages table
CREATE TABLE IF NOT EXISTS cbq_bus_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_key TEXT NOT NULL,
    title TEXT NOT NULL,
    months_count INTEGER NOT NULL,
    fee_amount NUMERIC NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    hide_fee BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- B? SUNG: B?O M?T ROW LEVEL SECURITY (RLS)
-- ==========================================

-- B?t RLS cho b?ng cbq_bus_packages
ALTER TABLE cbq_bus_packages ENABLE ROW LEVEL SECURITY;

-- Cho ph�p t?t c? m?i ngu?i (k? c? Public ?n danh) xem danh s�ch g�i v� dang active
CREATE POLICY "Public can view active bus packages" 
ON cbq_bus_packages 
FOR SELECT USING (is_active = true);

-- Ch? cho ph�p ngu?i c� t�i kho?n (Admin/Nh�n vi�n) th�m/s?a/xo� c?u h�nh g�i
CREATE POLICY "Authenticated users manage bus packages" 
ON cbq_bus_packages 
FOR ALL USING (auth.role() = 'authenticated');

-- B?t RLS cho b?ng cbq_bus_settings (n?u c�)
-- 3. Bang cau hinh thoi gian
CREATE TABLE IF NOT EXISTS cbq_bus_settings (
  id integer PRIMARY KEY DEFAULT 1,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  is_open boolean DEFAULT true,
  notice_message text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
INSERT INTO cbq_bus_settings (id, is_open, notice_message) 
VALUES (1, true, 'He thong dang ky xe dua don dang mo.') 
ON CONFLICT (id) DO NOTHING;

ALTER TABLE cbq_bus_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view bus settings" ON cbq_bus_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users manage bus settings" ON cbq_bus_settings FOR ALL USING (auth.role() = 'authenticated');

