/**
 * Seed script: Import medicines from Kaggle CSV into Supabase
 * 
 * Usage:
 *   1. Download "Extensive A-Z Medicines Dataset of India" CSV from Kaggle
 *   2. Place it at: data/medicines.csv
 *   3. Run: npx ts-node scripts/seed-medicines.ts
 * 
 * Dataset: https://www.kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://isforydcyxhppjyxdlpi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
    console.error('   Set it with: export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MedicineRow {
    name: string;
    price: number | null;
    is_discontinued: boolean;
    manufacturer_name: string | null;
    type: string | null;
    pack_size_label: string | null;
    short_composition1: string | null;
    short_composition2: string | null;
    substitute0: string | null;
    substitute1: string | null;
    substitute2: string | null;
    substitute3: string | null;
    substitute4: string | null;
    side_effects: string | null;
    use0: string | null;
    use1: string | null;
    use2: string | null;
    use3: string | null;
    use4: string | null;
    chemical_class: string | null;
    habit_forming: string | null;
    therapeutic_class: string | null;
    action_class: string | null;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseCSV(filePath: string): MedicineRow[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Parse header to find column indices
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[₹()]/g, '').trim());
    console.log(`📋 CSV Headers (${headers.length} columns):`, headers);

    const getIdx = (possibleNames: string[]): number => {
        for (const name of possibleNames) {
            const idx = headers.findIndex(h => h.includes(name));
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const nameIdx = getIdx(['name']);
    const priceIdx = getIdx(['price']);
    const discontinuedIdx = getIdx(['is_discontinued', 'discontinued']);
    const manufacturerIdx = getIdx(['manufacturer_name', 'manufacturer']);
    const typeIdx = getIdx(['type']);
    const packIdx = getIdx(['pack_size_label', 'pack_size']);
    const comp1Idx = getIdx(['short_composition1', 'composition1']);
    const comp2Idx = getIdx(['short_composition2', 'composition2']);
    const sub0Idx = getIdx(['substitute0']);
    const sub1Idx = getIdx(['substitute1']);
    const sub2Idx = getIdx(['substitute2']);
    const sub3Idx = getIdx(['substitute3']);
    const sub4Idx = getIdx(['substitute4']);
    const sideEffectsIdx = getIdx(['consolidated_side_effects', 'side_effects']);
    const use0Idx = getIdx(['use0']);
    const use1Idx = getIdx(['use1']);
    const use2Idx = getIdx(['use2']);
    const use3Idx = getIdx(['use3']);
    const use4Idx = getIdx(['use4']);
    const chemicalClassIdx = getIdx(['chemical class', 'chemical_class']);
    const habitFormingIdx = getIdx(['habit forming', 'habit_forming']);
    const therapeuticClassIdx = getIdx(['therapeutic class', 'therapeutic_class']);
    const actionClassIdx = getIdx(['action class', 'action_class']);

    if (nameIdx === -1) {
        throw new Error('Could not find "name" column in CSV');
    }

    const getField = (fields: string[], idx: number): string | null => {
        if (idx === -1 || !fields[idx] || fields[idx].trim() === '') return null;
        return fields[idx].trim();
    };

    const medicines: MedicineRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (!fields[nameIdx] || fields[nameIdx].trim() === '') continue;

        const isDiscontinued = discontinuedIdx !== -1
            ? fields[discontinuedIdx]?.toLowerCase() === 'true'
            : false;

        // Skip discontinued medicines
        if (isDiscontinued) continue;

        const price = priceIdx !== -1 ? parseFloat(fields[priceIdx]) : null;

        medicines.push({
            name: fields[nameIdx]?.trim() || '',
            price: price && !isNaN(price) ? price : null,
            is_discontinued: false,
            manufacturer_name: getField(fields, manufacturerIdx),
            type: getField(fields, typeIdx),
            pack_size_label: getField(fields, packIdx),
            short_composition1: getField(fields, comp1Idx),
            short_composition2: getField(fields, comp2Idx),
            substitute0: getField(fields, sub0Idx),
            substitute1: getField(fields, sub1Idx),
            substitute2: getField(fields, sub2Idx),
            substitute3: getField(fields, sub3Idx),
            substitute4: getField(fields, sub4Idx),
            side_effects: getField(fields, sideEffectsIdx),
            use0: getField(fields, use0Idx),
            use1: getField(fields, use1Idx),
            use2: getField(fields, use2Idx),
            use3: getField(fields, use3Idx),
            use4: getField(fields, use4Idx),
            chemical_class: getField(fields, chemicalClassIdx),
            habit_forming: getField(fields, habitFormingIdx),
            therapeutic_class: getField(fields, therapeuticClassIdx),
            action_class: getField(fields, actionClassIdx),
        });
    }

    return medicines;
}

async function seedMedicines() {
    const csvPath = path.join(__dirname, '..', 'data', 'medicines.csv');

    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV file not found at: ${csvPath}`);
        console.error('   Download from: https://www.kaggle.com/datasets/shudhanshusingh/az-medicine-dataset-of-india');
        console.error('   Place the CSV at: data/medicines.csv');
        process.exit(1);
    }

    console.log('📖 Reading CSV...');
    const medicines = parseCSV(csvPath);
    console.log(`✅ Parsed ${medicines.length} active medicines (discontinued filtered out)`);

    // Batch insert (Supabase has a ~1000 row limit per insert)
    const BATCH_SIZE = 500;
    let inserted = 0;

    console.log('🚀 Inserting into Supabase...');

    for (let i = 0; i < medicines.length; i += BATCH_SIZE) {
        const batch = medicines.slice(i, i + BATCH_SIZE);

        const { error } = await supabase
            .from('medicines')
            .insert(batch);

        if (error) {
            console.error(`\n❌ Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
            // Continue with next batch
            continue;
        }

        inserted += batch.length;
        const pct = Math.round((inserted / medicines.length) * 100);
        process.stdout.write(`\r   Progress: ${inserted}/${medicines.length} (${pct}%)`);
    }

    console.log(`\n\n🎉 Done! Inserted ${inserted} medicines into Supabase.`);
}

seedMedicines().catch(console.error);
