-- Add title column to medical_files
ALTER TABLE public.medical_files 
ADD COLUMN IF NOT EXISTS title TEXT; -- Make nullable initially for backward compat
