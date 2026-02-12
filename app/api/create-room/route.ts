import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { appointmentId } = await request.json();

        const apiKey = process.env.DAILY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Daily.co API key not configured' }, { status: 500 });
        }

        // Create a Daily.co room
        const response = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                name: `medivera-${appointmentId}`,
                properties: {
                    enable_screenshare: true,
                    enable_chat: true,
                    start_video_off: false,
                    start_audio_off: false,
                    max_participants: 2, // Patient + Doctor only
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Daily.co API error:', error);
            return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
        }

        const room = await response.json();

        return NextResponse.json({
            url: room.url,
            roomName: room.name
        });
    } catch (error: any) {
        console.error('Error creating Daily.co room:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
