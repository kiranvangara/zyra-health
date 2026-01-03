import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/app/utils/stripe-server';

export async function POST(request: NextRequest) {
    try {
        const { amount, doctorId } = await request.json();

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: { doctorId },
        });

        return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
