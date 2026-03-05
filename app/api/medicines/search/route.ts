import { NextResponse } from 'next/server';

// This project uses `output: 'export'` (static HTML).
// Dynamic API routes are not supported with static export.
// Medicine search is handled client-side via direct Supabase queries.
// See: app/components/MedicineSearch.tsx

export const dynamic = 'force-static';

export async function GET() {
    return NextResponse.json({
        message: 'Medicine search is handled client-side. Use the MedicineSearch component.',
    });
}
