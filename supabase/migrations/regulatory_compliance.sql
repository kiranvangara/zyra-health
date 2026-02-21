-- Regulatory Compliance Migration
-- Adds qualification column to doctors and creates consent_logs audit table

-- 1. Add qualification column to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS qualification TEXT;

-- 2. Create consent_logs table (append-only audit trail)
CREATE TABLE IF NOT EXISTS consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    consent_type TEXT NOT NULL,          -- 'data_processing', 'teleconsultation'
    consent_given BOOLEAN NOT NULL DEFAULT true,
    ip_address TEXT,
    user_agent TEXT,
    context JSONB DEFAULT '{}',          -- e.g. { "appointment_id": "...", "doctor_id": "..." }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by user
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_type ON consent_logs(consent_type);

-- RLS: Users can only read their own consent records
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent logs"
    ON consent_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent logs"
    ON consent_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies — consent_logs is append-only
