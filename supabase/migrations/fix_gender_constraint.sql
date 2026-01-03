-- 1. Drop the existing restrictive constraint
alter table patients drop constraint if exists patients_gender_check;

-- 2. Add a compatible constraint (allowing Male, Female, Other)
-- Note: NULLs automatically pass this check.
alter table patients add constraint patients_gender_check 
check (gender in ('Male', 'Female', 'Other'));
