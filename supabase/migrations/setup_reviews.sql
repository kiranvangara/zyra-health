-- Create Reviews Table
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  doctor_id uuid references doctors(id) not null,
  patient_id uuid references auth.users(id) not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  is_approved boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table reviews enable row level security;

-- Policies

-- Public (Anyone) can read APPROVED reviews
create policy "Public can view approved reviews"
  on reviews for select
  using (is_approved = true);

-- Patients can insert their own reviews
create policy "Patients can insert reviews"
  on reviews for insert
  with check (auth.uid() = patient_id);

-- Admins can view ALL reviews (using service role or is_admin check if we had one, 
-- but for now rely on service role/admin client in actions.ts ignoring RLS)

-- Admins can update approval status (via service role/admin client)
