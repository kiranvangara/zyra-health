-- Add consultation_fee_usd column to doctors table
ALTER TABLE public.doctors
ADD COLUMN IF NOT EXISTS consultation_fee_usd NUMERIC;

-- Optional: Set a default based on INR fee (approx / 80) for existing records
-- UPDATE public.doctors SET consultation_fee_usd = ROUND(consultation_fee / 85, 0) WHERE consultation_fee_usd IS NULL;
