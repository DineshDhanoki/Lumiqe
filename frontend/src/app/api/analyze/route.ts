import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: 'No valid file uploaded' },
                { status: 400 }
            );
        }

        // Mock Analysis Result
        const mockResult = {
            season: 'Deep Autumn',
            palette: ['#4A0404', '#8B4513', '#D2691E', '#556B2F', '#800000', '#FFD700'],
            description: 'You have warm, deep coloring. Rich, saturated warm tones look best on you.',
            confidence: 0.92,
        };

        return NextResponse.json(mockResult);
    } catch {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
