-- 1. Add Availability Fields to Doctors
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS weekly_schedule JSONB DEFAULT '{
  "mon": [{"start": "09:00", "end": "17:00"}], 
  "tue": [{"start": "09:00", "end": "17:00"}], 
  "wed": [{"start": "09:00", "end": "17:00"}], 
  "thu": [{"start": "09:00", "end": "17:00"}], 
  "fri": [{"start": "09:00", "end": "17:00"}] 
}',
ADD COLUMN IF NOT EXISTS time_zone TEXT DEFAULT 'UTC';

-- 2. Create Overrides Table (Vacations / Blocks)
CREATE TABLE IF NOT EXISTS public.doctor_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  override_type text CHECK (override_type IN ('vacation', 'blocked_slot')),
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on Overrides
ALTER TABLE public.doctor_overrides ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Overrides
-- Doctors can view/manage their own overrides
CREATE POLICY "Doctors can view own overrides" ON public.doctor_overrides
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own overrides" ON public.doctor_overrides
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own overrides" ON public.doctor_overrides
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own overrides" ON public.doctor_overrides
  FOR DELETE USING (auth.uid() = doctor_id);

-- Patients/Public can VIEW overrides (to filter slots)
CREATE POLICY "Public can view overrides" ON public.doctor_overrides
  FOR SELECT USING (true);
