-- Add room_name column to appointments table for Daily.co integration
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS room_name TEXT;

-- Add index for faster room lookups
CREATE INDEX IF NOT EXISTS idx_appointments_room_name ON public.appointments(room_name);
