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
