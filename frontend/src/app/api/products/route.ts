import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get('season');

    // Simulate network
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!season) {
        return NextResponse.json(
            { error: 'Season parameter is required' },
            { status: 400 }
        );
    }

    // Mock Products
    const mockProducts = [
        {
            id: '1',
            name: 'Burgundy Silk Blouse',
            brand: 'Zara',
            price: 49.99,
            image_url: 'https://placehold.co/400x600/800000/FFFFFF?text=Blouse',
            match_score: 0.98,
            purchase_link: 'https://zara.com',
        },
        {
            id: '2',
            name: 'Olive Green Trench',
            brand: 'H&M',
            price: 89.99,
            image_url: 'https://placehold.co/400x600/556B2F/FFFFFF?text=Trench',
            match_score: 0.95,
            purchase_link: 'https://hm.com',
        },
        {
            id: '3',
            name: 'Terracotta Knit Sweater',
            brand: 'Uniqlo',
            price: 39.90,
            image_url: 'https://placehold.co/400x600/D2691E/FFFFFF?text=Sweater',
            match_score: 0.92,
            purchase_link: 'https://uniqlo.com',
        },
        {
            id: '4',
            name: 'Chocolate Brown Pants',
            brand: 'Mango',
            price: 59.99,
            image_url: 'https://placehold.co/400x600/8B4513/FFFFFF?text=Pants',
            match_score: 0.89,
            purchase_link: 'https://mango.com',
        },
        {
            id: '5',
            name: 'Gold Statement Earrings',
            brand: 'Mejuri',
            price: 120.00,
            image_url: 'https://placehold.co/400x600/FFD700/000000?text=Gold',
            match_score: 0.88,
            purchase_link: 'https://mejuri.com',
        },
        {
            id: '6',
            name: 'Deep Red Lipstick',
            brand: 'MAC',
            price: 24.00,
            image_url: 'https://placehold.co/400x600/4A0404/FFFFFF?text=Lipstick',
            match_score: 0.99,
            purchase_link: 'https://maccosmetics.com',
        },
    ];

    return NextResponse.json({ products: mockProducts });
}
