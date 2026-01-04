-- Add consultation_fee_usd to doctors table
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS consultation_fee_usd DECIMAL(10, 2);

-- Ensure other profile fields exist (just in case)
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[],
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Reload schema cache is automatic in Supabase usually, but good to know the query succeeded.
SELECT 'Schema Updated Successfully' as status;
