-- Migration: enhance_doctor_profiles
-- Description: Add detailed profile attributes to doctors table

ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[], -- Array of strings e.g. ['English', 'Hindi']
ADD COLUMN IF NOT EXISTS education TEXT, -- e.g. "MBBS, MD - Cardiology"
ADD COLUMN IF NOT EXISTS registration_number TEXT; -- Compliance requirement

-- Add validation check for array (optional but good practice)
-- ALTER TABLE public.doctors ADD CONSTRAINT languages_check CHECK (array_length(languages_spoken, 1) > 0);
