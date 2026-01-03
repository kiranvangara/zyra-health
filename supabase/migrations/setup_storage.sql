-- Supabase Storage Setup for Medical Records
-- Run these commands in Supabase SQL Editor

-- 1. Create storage bucket (you can also do this in Supabase Dashboard -> Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', false);

-- 2. Set up RLS policies for the bucket

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-records' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-records' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow doctors to view files for their patients (optional, for future use)
CREATE POLICY "Doctors can view patient files during appointments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-records' AND
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.doctor_id = auth.uid()
    AND appointments.patient_id::text = (storage.foldername(name))[1]
  )
);
