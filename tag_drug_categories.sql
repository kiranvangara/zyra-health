-- ============================================
-- Drug Category Tagging: List O / A / B
-- Per Telemedicine Practice Guidelines 2020
-- ============================================
-- List O (OTC)     = Can prescribe in first teleconsultation (audio/video/chat)
-- List A           = First consultation requires VIDEO only (not audio/chat)  
-- List B           = Only for FOLLOW-UP prescriptions (not first consult)
-- Prohibited       = Cannot prescribe via teleconsultation at all
-- ============================================

-- Step 1: Reset all categories
UPDATE public.medicines SET drug_category = NULL;

-- ============================================
-- LIST O — OTC / Safe for first teleconsultation
-- ============================================

-- Vitamins, minerals, supplements
UPDATE public.medicines SET drug_category = 'List O'
WHERE therapeutic_class = 'VITAMINS MINERALS NUTRIENTS';

-- Common OTC pain/fever medications (Paracetamol, basic analgesics)
UPDATE public.medicines SET drug_category = 'List O'
WHERE therapeutic_class = 'PAIN ANALGESICS'
  AND action_class IN ('Analgesic & Antipyretic-PCM', 'Vitamins');

-- OTC GI drugs (antacids, basic digestive aids)
UPDATE public.medicines SET drug_category = 'List O'
WHERE therapeutic_class = 'GASTRO INTESTINAL'
  AND action_class IN ('Antacid', 'Antiflatulent', 'Prokinetics', 'Laxatives- Osmotic');

-- OTC respiratory (basic cough syrups, mucolytics)  
UPDATE public.medicines SET drug_category = 'List O'
WHERE therapeutic_class = 'RESPIRATORY'
  AND action_class IN ('Mucolytics', 'Cough suppressant');

-- OTC derma (basic creams, moisturizers, antifungal topicals)
UPDATE public.medicines SET drug_category = 'List O'
WHERE therapeutic_class = 'DERMA'
  AND action_class IN ('Fungal ergosterol synthesis inhibitor', 'Keratolytics', 'Emollients & Skin Protectants');

-- Vaccines (informational — prescribed in clinic, not via teleconsult)
UPDATE public.medicines SET drug_category = 'List O'
WHERE therapeutic_class = 'VACCINES';

-- Stomatologicals (mouth/dental OTC)
UPDATE public.medicines SET drug_category = 'List O'
WHERE therapeutic_class = 'STOMATOLOGICALS';

-- ============================================
-- LIST A — Requires VIDEO for first consultation
-- ============================================

-- Anti-infectives (antibiotics, antivirals, antifungals)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'ANTI INFECTIVES'
  AND drug_category IS NULL;

-- Anti-malarials
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'ANTI MALARIALS';

-- Cardiac drugs (antihypertensives, statins, etc.)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'CARDIAC';

-- Anti-diabetic drugs
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'ANTI DIABETIC';

-- Hormones (thyroid, steroids, insulin)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'HORMONES';

-- Gynaecological
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'GYNAECOLOGICAL';

-- Ophthal / Otologicals (prescription eye/ear drops)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class IN ('OPHTHAL', 'OPHTHAL OTOLOGICALS', 'OTOLOGICALS')
  AND drug_category IS NULL;

-- Blood-related (anticoagulants, iron infusions)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'BLOOD RELATED';

-- Urology
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'UROLOGY';

-- Anti-neoplastics (cancer drugs — require specialist video)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'ANTI NEOPLASTICS';

-- Pain analgesics that aren't OTC (NSAIDs, opioid-adjacent)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'PAIN ANALGESICS'
  AND drug_category IS NULL
  AND habit_forming = 'No';

-- GI drugs that aren't OTC (PPIs, H2 blockers, prescription-strength)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'GASTRO INTESTINAL'
  AND drug_category IS NULL;

-- Respiratory that aren't OTC (inhalers, prescription bronchodilators)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'RESPIRATORY'
  AND drug_category IS NULL;

-- Derma that aren't OTC (prescription steroids, retinoids)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'DERMA'
  AND drug_category IS NULL;

-- Sex stimulants (PDE5 inhibitors etc.)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'SEX STIMULANTS REJUVENATORS';

-- Others (unclassified — default to List A for safety)
UPDATE public.medicines SET drug_category = 'List A'
WHERE therapeutic_class = 'OTHERS'
  AND drug_category IS NULL
  AND habit_forming = 'No';

-- ============================================
-- LIST B — Follow-up only
-- ============================================

-- Neuro/CNS drugs (antidepressants, antiepileptics, antipsychotics)
-- These are Schedule H1 — restrict to follow-up only
UPDATE public.medicines SET drug_category = 'List B'
WHERE therapeutic_class = 'NEURO CNS'
  AND habit_forming = 'No';

-- ============================================
-- PROHIBITED — Cannot prescribe via teleconsultation
-- ============================================

-- All habit-forming drugs (Schedule X, narcotics, psychotropics)
UPDATE public.medicines SET drug_category = 'Prohibited'
WHERE habit_forming = 'Yes';

-- Any remaining Neuro/CNS that are habit-forming (already caught above, 
-- but being explicit)
UPDATE public.medicines SET drug_category = 'Prohibited'
WHERE therapeutic_class = 'NEURO CNS'
  AND habit_forming = 'Yes';

-- Remaining pain analgesics that are habit-forming
UPDATE public.medicines SET drug_category = 'Prohibited'
WHERE therapeutic_class = 'PAIN ANALGESICS'
  AND drug_category IS NULL;

-- ============================================
-- Catch-all: anything still NULL → List A (safe default)
-- ============================================
UPDATE public.medicines SET drug_category = 'List A'
WHERE drug_category IS NULL
  AND is_discontinued = false;

-- ============================================
-- Verification: Check distribution
-- ============================================
SELECT drug_category, COUNT(*) as count 
FROM public.medicines 
WHERE is_discontinued = false
GROUP BY drug_category 
ORDER BY count DESC;
