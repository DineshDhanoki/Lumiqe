'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import ResultsView from '@/components/ResultsView';

function ResultsContent() {
    const searchParams = useSearchParams();
    const { status } = useSession();

    const season       = searchParams.get('season')       || 'Unknown Season';
    const description  = searchParams.get('description')  || '';
    const hexColor     = searchParams.get('hexColor')      || '#000000';
    const undertone    = searchParams.get('undertone')     || 'neutral';
    const confidence   = parseFloat(searchParams.get('confidence') || '0.0');
    const palette      = searchParams.get('palette')?.split(',')      || [];
    const avoidColors  = searchParams.get('avoidColors')?.split(',')  || [];
    const metal        = searchParams.get('metal')        || 'Gold';
    const tips         = searchParams.get('tips')         || '';
    const contrastLevel = searchParams.get('contrastLevel') || 'Medium';

    let celebrities: { name: string; image: string }[] = [];
    try {
        const s = searchParams.get('celebrities');
        if (s) celebrities = JSON.parse(decodeURIComponent(s));
    } catch { /* ignore */ }

    let makeup = { lips: '', blush: '', eyeshadow: '' };
    try {
        const s = searchParams.get('makeup');
        if (s) makeup = JSON.parse(decodeURIComponent(s));
    } catch { /* ignore */ }

    // Save analysis to localStorage for dashboard history
    useEffect(() => {
        if (!searchParams.has('season')) return;
        const entry = {
            season, hexColor, undertone, confidence, contrastLevel,
            palette, metal, timestamp: Date.now(),
        };
        try {
            const prev = JSON.parse(localStorage.getItem('lumiqe-history') || '[]');
            const updated = [entry, ...prev].slice(0, 10);
            localStorage.setItem('lumiqe-history', JSON.stringify(updated));
            localStorage.setItem('lumiqe-last-analysis', JSON.stringify(entry));
        } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!searchParams.has('season')) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
                <Sparkles className="w-12 h-12 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">No Analysis Found</h1>
                <p className="text-white/60 mb-8">Please start from the home page and upload a photo.</p>
                <Link href="/" className="px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors inline-block">
                    Go Back Home
                </Link>
            </div>
        );
    }

    return (
        <ResultsView
            season={season}
            description={description}
            hexColor={hexColor}
            undertone={undertone}
            confidence={confidence}
            contrastLevel={contrastLevel}
            palette={palette}
            avoidColors={avoidColors}
            metal={metal}
            tips={tips}
            celebrities={celebrities}
            makeup={makeup}
            backHref="/"
            backLabel="Back to Home"
            showAccountNudge={status === 'unauthenticated'}
        />
    );
}

export default function Results() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center gap-4 text-white/50">
                <Sparkles className="w-8 h-8 text-red-500 animate-pulse" />
                <p>Loading your results...</p>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
