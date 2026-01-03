-- Enable RLS on patients table if not already enabled
alter table patients enable row level security;

-- Allow users to view their own profile (if not exists)
create policy "Users can view own profile"
  on patients for select
  using (auth.uid() = id);

-- Allow users to update their own profile
-- This was missing and caused the error
create policy "Users can update own profile"
  on patients for update
  using (auth.uid() = id);

-- Allow users to insert their profile (during signup)
create policy "Users can insert own profile"
  on patients for insert
  with check (auth.uid() = id);
