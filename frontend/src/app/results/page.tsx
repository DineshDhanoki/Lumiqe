'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Sparkles, Loader2 } from 'lucide-react';
import ResultsView from '@/components/ResultsView';
import { useLumiqeStore } from '@/lib/store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import AppLayout from '@/components/layout/AppLayout';

function ResultsContent() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const { status } = useSession();
    const setCurrentAnalysis = useLumiqeStore((s) => s.setCurrentAnalysis);
    const addToHistory = useLumiqeStore((s) => s.addToHistory);
    const updateUser = useLumiqeStore((s) => s.updateUser);

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
    } catch (e) {
        console.error('[results] Failed to parse celebrities param:', e);
    }

    let makeup = { lips: '', blush: '', eyeshadow: '' };
    try {
        const s = searchParams.get('makeup');
        if (s) makeup = JSON.parse(decodeURIComponent(s));
    } catch (e) {
        console.error('[results] Failed to parse makeup param:', e);
    }

    // Save analysis to Zustand store + localStorage (fallback)
    useEffect(() => {
        if (!searchParams.has('season')) return;
        const entry = {
            season, hexColor, undertone, confidence, contrastLevel,
            palette, metal, timestamp: Date.now(),
        };

        // Write to Zustand store
        const storeResult = {
            season,
            hex_color: hexColor,
            undertone,
            confidence,
            palette,
            avoid_colors: avoidColors,
            metal,
            created_at: new Date().toISOString(),
        };
        setCurrentAnalysis(storeResult);
        addToHistory(storeResult);
        if (status === 'authenticated') {
            updateUser({ season, palette });
        }

        // localStorage fallback for backward compat
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
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <span className="material-symbols-outlined text-5xl text-primary/40 mb-6">palette</span>
                    <h1 className="font-display text-3xl font-bold text-on-surface mb-4">{t('noAnalysisFound')}</h1>
                    <p className="text-on-surface-variant mb-8">{t('noAnalysisFoundDesc')}</p>
                    <Link href={status === 'authenticated' ? '/dashboard' : '/'} className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-headline font-bold text-sm tracking-widest uppercase hover:bg-primary transition-colors inline-block">
                        {status === 'authenticated' ? t('backToDashboard') : t('goBackHome')}
                    </Link>
                </div>
            </AppLayout>
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
            backHref={status === 'authenticated' ? '/dashboard' : '/'}
            backLabel={status === 'authenticated' ? 'Dashboard' : 'Back to Home'}
            showAccountNudge={status === 'unauthenticated'}
        />
    );
}

export default function Results() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="font-label text-sm">Loading results...</p>
            </div>
        }>
            <ResultsContent />
        </Suspense>
    );
}
