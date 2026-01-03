-- Add medical_files table for storing uploaded documents
CREATE TABLE IF NOT EXISTS public.medical_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.medical_files ENABLE ROW LEVEL SECURITY;

-- Patients can view their own files
CREATE POLICY "Users can view their own medical files"
    ON public.medical_files FOR SELECT
    USING (auth.uid() = patient_id);

-- Patients can upload their own files
CREATE POLICY "Users can upload their own medical files"
    ON public.medical_files FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- Patients can delete their own files
CREATE POLICY "Users can delete their own medical files"
    ON public.medical_files FOR DELETE
    USING (auth.uid() = patient_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_medical_files_patient ON public.medical_files(patient_id);
