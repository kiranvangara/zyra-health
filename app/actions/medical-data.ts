'use server';

import { supabase } from '../utils/supabase';
import { unstable_cache } from 'next/cache';

export const getAvailableSpecializations = unstable_cache(
    async () => {
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
    },
    ['doctor-specializations'], // Cache key
    {
        tags: ['doctor-specializations'], // Tag for revalidation
        revalidate: 3600 // Fallback revalidation every hour
    }
);
