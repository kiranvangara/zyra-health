-- ============================================
-- Medicines Table for Autocomplete Search
-- Source: Extensive A-Z Medicines Dataset of India (Kaggle)
-- 24 columns, ~254K rows
-- ============================================

-- 1. Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create medicines table (all 24 CSV columns + extras)
CREATE TABLE IF NOT EXISTS public.medicines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC,
  is_discontinued BOOLEAN DEFAULT false,
  manufacturer_name TEXT,
  type TEXT DEFAULT 'Allopathy',
  pack_size_label TEXT,
  short_composition1 TEXT,
  short_composition2 TEXT,
  substitute0 TEXT,
  substitute1 TEXT,
  substitute2 TEXT,
  substitute3 TEXT,
  substitute4 TEXT,
  side_effects TEXT,
  use0 TEXT,
  use1 TEXT,
  use2 TEXT,
  use3 TEXT,
  use4 TEXT,
  chemical_class TEXT,
  habit_forming TEXT,
  therapeutic_class TEXT,
  action_class TEXT,
  drug_category TEXT,  -- future: 'List O', 'List A', 'List B'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create trigram index for fast fuzzy name search
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm 
  ON public.medicines USING gin (name gin_trgm_ops);

-- 4. Create standard index for composition lookups
CREATE INDEX IF NOT EXISTS idx_medicines_composition1 
  ON public.medicines (short_composition1);

-- 5. Create index for therapeutic class filtering
CREATE INDEX IF NOT EXISTS idx_medicines_therapeutic_class
  ON public.medicines (therapeutic_class);

-- 6. Enable RLS
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- 7. Public read access (medicines are reference data)
CREATE POLICY "Anyone can view medicines" ON public.medicines
  FOR SELECT USING (true);

-- 8. Only service role / admin can modify
CREATE POLICY "Service role can manage medicines" ON public.medicines
  FOR ALL USING (auth.role() = 'service_role');
