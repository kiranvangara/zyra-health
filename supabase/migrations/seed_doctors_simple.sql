-- ALTERNATIVE: Simple seed script with hardcoded sample names
-- This version stores doctor names directly in a new column (easier for testing)

-- Step 1: Add a name column to doctors table (temporary for testing)
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Step 2: Temporarily disable foreign key constraint
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_id_fkey;

-- Step 3: Insert sample doctors with names
INSERT INTO public.doctors (id, display_name, specialization, experience_years, consultation_fee, is_verified, availability_schedule)
VALUES 
  (gen_random_uuid(), 'Dr. Amit Sharma', 'Cardiology', 12, 40.00, TRUE, '{"monday": ["09:00-12:00", "14:00-17:00"]}'::jsonb),
  (gen_random_uuid(), 'Dr. Priya Verma', 'Dermatology', 8, 30.00, TRUE, '{"tuesday": ["10:00-13:00"], "thursday": ["15:00-18:00"]}'::jsonb),
  (gen_random_uuid(), 'Dr. Rajesh Kumar', 'General Physician', 15, 25.00, TRUE, '{"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"]}'::jsonb),
  (gen_random_uuid(), 'Dr. Sneha Patel', 'Pediatrics', 10, 35.00, TRUE, '{"tuesday": ["10:00-14:00"], "thursday": ["10:00-14:00"]}'::jsonb),
  (gen_random_uuid(), 'Dr. Vikram Singh', 'Orthopedics', 18, 45.00, TRUE, '{"monday": ["14:00-18:00"], "wednesday": ["14:00-18:00"]}'::jsonb);

-- Success message
SELECT 'Sample doctors created successfully!' AS status;
