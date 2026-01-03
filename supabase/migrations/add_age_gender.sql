-- Add age and gender columns to patients table
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'age') then
    alter table patients add column age integer;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'patients' and column_name = 'gender') then
    alter table patients add column gender text;
  end if;
end $$;

-- Reload schema cache to ensure API sees new columns
NOTIFY pgrst, 'reload config';
