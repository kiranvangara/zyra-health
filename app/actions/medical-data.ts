import { supabase } from '../utils/supabase';

export const getAvailableSpecializations = async () => {
    // Fetch distinct specializations from doctors table
    const { data, error } = await supabase
        .from('doctors')
        .select('specialization')
        .eq('is_verified', true);

    if (error) {
        console.error('Error fetching specializations:', error);
        return [];
    }

    if (!data) return [];

    // Extract unique values, filter nulls, and sort
    const distinctSpecs = Array.from(new Set(data.map(d => d.specialization).filter(Boolean))).sort();

    return distinctSpecs;
};
