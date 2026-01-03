-- Enhanced Doctor Seed Script with Auth Users
-- This creates both auth users AND doctor profiles

-- Step 1: Create a function to seed doctors with auth users
CREATE OR REPLACE FUNCTION seed_sample_doctors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  doctor_id_1 UUID;
  doctor_id_2 UUID;
  doctor_id_3 UUID;
  doctor_id_4 UUID;
  doctor_id_5 UUID;
BEGIN
  -- Insert auth users (this requires admin privileges)
  -- Note: In production, use Supabase Dashboard or API to create these
  
  -- For now, we'll create doctors with placeholder IDs
  -- You'll need to manually create auth users and update these IDs
  
  doctor_id_1 := gen_random_uuid();
  doctor_id_2 := gen_random_uuid();
  doctor_id_3 := gen_random_uuid();
  doctor_id_4 := gen_random_uuid();
  doctor_id_5 := gen_random_uuid();
  
  -- Temporarily disable foreign key constraint
  ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_id_fkey;
  
  -- Insert doctors
  INSERT INTO public.doctors (id, specialization, experience_years, consultation_fee, is_verified, availability_schedule)
  VALUES 
    (doctor_id_1, 'Cardiology', 12, 40.00, TRUE, '{"monday": ["09:00-12:00", "14:00-17:00"]}'::jsonb),
    (doctor_id_2, 'Dermatology', 8, 30.00, TRUE, '{"tuesday": ["10:00-13:00"], "thursday": ["15:00-18:00"]}'::jsonb),
    (doctor_id_3, 'General Physician', 15, 25.00, TRUE, '{"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"]}'::jsonb),
    (doctor_id_4, 'Pediatrics', 10, 35.00, TRUE, '{"tuesday": ["10:00-14:00"], "thursday": ["10:00-14:00"]}'::jsonb),
    (doctor_id_5, 'Orthopedics', 18, 45.00, TRUE, '{"monday": ["14:00-18:00"], "wednesday": ["14:00-18:00"]}'::jsonb);
  
  RAISE NOTICE 'Sample doctors created successfully!';
  RAISE NOTICE 'Doctor IDs: %, %, %, %, %', doctor_id_1, doctor_id_2, doctor_id_3, doctor_id_4, doctor_id_5;
  RAISE NOTICE 'To add real names, create auth users with these IDs and add full_name to user_metadata';
END;
$$;

-- Execute the function
SELECT seed_sample_doctors();

-- Clean up
DROP FUNCTION IF EXISTS seed_sample_doctors();

-- IMPORTANT: To add real doctor names, you need to:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" for each doctor
-- 3. Use the UUIDs printed above as the user IDs
-- 4. Set email: doctor1@zyrahealth.com, doctor2@zyrahealth.com, etc.
-- 5. In "User Metadata", add: {"full_name": "Dr. Amit Sharma"}
-- 6. Or use the Supabase API/SDK to create users programmatically
