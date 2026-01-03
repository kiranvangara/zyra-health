-- 1. Explicitly check for and add 'full_name'
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'full_name') then
    alter table patients add column full_name text;
  end if;
end $$;

-- 2. Explicitly check for and add 'phone' (re-verify)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'phone') then
    alter table patients add column phone text;
  end if;
end $$;

-- 3. Force PostgREST to reload the schema cache
-- This is critical if the column exists but the API doesn't see it yet
NOTIFY pgrst, 'reload config';
