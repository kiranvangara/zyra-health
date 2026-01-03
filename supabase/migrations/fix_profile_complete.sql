-- 1. Ensure patients table exists with all columns
create table if not exists patients (
  id uuid references auth.users(id) primary key,
  full_name text,
  email text,
  phone text,  -- Ensure this column exists
  created_at timestamp with time zone default now()
);

-- 2. Add phone column if it doesn't exist (for existing table)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'phone') then
    alter table patients add column phone text;
  end if;
end $$;

-- 3. Enable RLS
alter table patients enable row level security;

-- 4. Re-apply Policies (Drop first to avoid errors)
drop policy if exists "Users can view own profile" on patients;
create policy "Users can view own profile" 
  on patients for select 
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on patients;
create policy "Users can update own profile" 
  on patients for update 
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on patients;
create policy "Users can insert own profile" 
  on patients for insert 
  with check (auth.uid() = id);
