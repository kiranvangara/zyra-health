-- Create storage bucket for doctor profiles
INSERT INTO storage.buckets (id, name, public) 
VALUES ('doctor-profiles', 'doctor-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'doctor-profiles' );

-- Policy: Admin Write Access (or Authenticated Users for now)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'doctor-profiles' );

-- Policy: Authenticated Update
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'doctor-profiles' );
