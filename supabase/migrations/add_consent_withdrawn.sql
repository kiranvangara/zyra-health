-- Add consent_withdrawn column to patients table
-- Used by the "Withdraw Consent" feature in the profile page

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS consent_withdrawn BOOLEAN DEFAULT false;
