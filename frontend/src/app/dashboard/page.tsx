'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';
import { useLumiqeStore } from '@/lib/store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import AppLayout from '@/components/layout/AppLayout';
import RescanNudge from '@/components/dashboard/RescanNudge';
import StyleIdentityCards from '@/components/dashboard/StyleIdentityCards';
import TodaysOutfit from '@/components/dashboard/TodaysOutfit';
import QuickActions from '@/components/dashboard/QuickActions';
import DiscoveryQuizzes from '@/components/dashboard/DiscoveryQuizzes';
import SkincareGuide from '@/components/dashboard/SkincareGuide';
import AnalysisHistory from '@/components/dashboard/AnalysisHistory';
import EmptyCTA from '@/components/dashboard/EmptyCTA';
import EmailVerificationBanner from '@/components/dashboard/EmailVerificationBanner';

interface AnalysisEntry {
    id?: string;
    season: string;
    hexColor: string;
    undertone: string;
    confidence: number;
    contrastLevel: string;
    palette: string[];
    metal: string;
    timestamp: number;
}

interface BodyShapeData { shape: string; timestamp: number; }
interface StylePersonalityData { personality: string; timestamp: number; }

interface DailyOutfitSlotItem {
    id: string;
    dominant_color: string;
    match_score: number;
    image_filename: string;
    category: string | null;
}

interface DailyOutfitData {
    date: string;
    slots: Record<string, DailyOutfitSlotItem | null>;
    filled_count: number;
    total_slots: number;
}

const RESCAN_THRESHOLD_DAYS = 60;

function daysAgoFromTimestamp(timestamp: number): number {
    return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

function mapToAnalysisEntry(r: {
    id?: string;
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    contrast_level?: string;
    palette: string[];
    metal?: string;
    created_at?: string | null;
}): AnalysisEntry {
    return {
        id: r.id,
        season: r.season,
        hexColor: r.hex_color,
        undertone: r.undertone,
        confidence: r.confidence,
        contrastLevel: r.contrast_level ?? 'Medium',
        palette: r.palette,
        metal: r.metal ?? 'Gold',
        timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    };
}

export default function Dashboard() {
    const { t } = useTranslation();
    const { data: session, status } = useSession();
    const [lastAnalysis, setLastAnalysis] = useState<AnalysisEntry | null>(null);
    const [history, setHistory] = useState<AnalysisEntry[]>([]);
    const [bodyShape, setBodyShape] = useState<BodyShapeData | null>(null);
    const [stylePersonality, setStylePersonality] = useState<StylePersonalityData | null>(null);
    const [dailyOutfit, setDailyOutfit] = useState<DailyOutfitData | null>(null);
    const [dailyOutfitEmpty, setDailyOutfitEmpty] = useState(false);
    const [dailyOutfitError, setDailyOutfitError] = useState(false);

    const storeHistory = useLumiqeStore((s) => s.history);
    const storeQuiz = useLumiqeStore((s) => s.quiz);
    const storeHydrated = useLumiqeStore((s) => s.hydrated);

    useEffect(() => {
        if (storeQuiz.body_shape) {
            setBodyShape({ shape: storeQuiz.body_shape, timestamp: storeQuiz.completed_at ? new Date(storeQuiz.completed_at).getTime() : Date.now() });
        } else {
            try {
                const bs = localStorage.getItem('lumiqe-body-shape');
                if (bs) setBodyShape(JSON.parse(bs));
            } catch { /* ignore */ }
        }

        if (storeQuiz.style_personality) {
            setStylePersonality({ personality: storeQuiz.style_personality, timestamp: storeQuiz.completed_at ? new Date(storeQuiz.completed_at).getTime() : Date.now() });
        } else {
            try {
                const sp = localStorage.getItem('lumiqe-style-personality');
                if (sp) setStylePersonality(JSON.parse(sp));
            } catch { /* ignore */ }
        }
    }, [storeQuiz]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        apiFetch('/api/daily-outfit')
            .then((res) => {
                if (res.status === 404) { setDailyOutfitEmpty(true); return null; }
                return res.ok ? res.json() : null;
            })
            .then((data: DailyOutfitData | null) => { if (data) setDailyOutfit(data); })
            .catch((err) => { console.error('[dashboard] Daily outfit fetch failed:', err); setDailyOutfitError(true); });
    }, [status]);

    const _loadFromLocalStorage = useCallback(() => {
        try {
            const last = localStorage.getItem('lumiqe-last-analysis');
            if (last) setLastAnalysis(JSON.parse(last));
            const hist = localStorage.getItem('lumiqe-history');
            if (hist) setHistory(JSON.parse(hist));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (status === 'loading') return;

        if (session) {
            apiFetch('/api/analysis/?limit=20')
                .then((res) => res.ok ? res.json() : Promise.reject())
                .then((items: Array<{ id: string; season: string; hex_color: string; undertone: string; confidence: number; contrast_level: string; palette: string[]; metal: string; created_at: string | null }>) => {
                    if (!items.length) return;
                    const mapped = items.map(mapToAnalysisEntry);
                    setHistory(mapped);
                    setLastAnalysis(mapped[0]);
                })
                .catch(() => {
                    if (storeHydrated && storeHistory.length > 0) {
                        const mapped = storeHistory.map(mapToAnalysisEntry);
                        setHistory(mapped);
                        setLastAnalysis(mapped[0]);
                    } else {
                        _loadFromLocalStorage();
                    }
                });
        } else if (storeHydrated && storeHistory.length > 0) {
            const mapped = storeHistory.map(mapToAnalysisEntry);
            setHistory(mapped);
            setLastAnalysis(mapped[0]);
        } else {
            _loadFromLocalStorage();
        }
    }, [session, status, _loadFromLocalStorage, storeHydrated, storeHistory]);

    const aiStylistHref = lastAnalysis
        ? `/results?season=${encodeURIComponent(lastAnalysis.season)}&hexColor=${encodeURIComponent(lastAnalysis.hexColor)}&undertone=${lastAnalysis.undertone}&confidence=${lastAnalysis.confidence}&contrastLevel=${lastAnalysis.contrastLevel}&metal=${lastAnalysis.metal}&palette=${lastAnalysis.palette.join(',')}`
        : '/analyze';

    const rescanDaysAgo = lastAnalysis ? daysAgoFromTimestamp(lastAnalysis.timestamp) : 0;

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {status === 'authenticated' && <EmailVerificationBanner />}

                {/* Page header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary mb-2">
                        {t('dashboardSubtitle')}
                    </p>
                    <h1 className="font-display text-5xl md:text-6xl font-bold text-on-surface leading-none">
                        {t('dashboardTitle')} <br />
                        <span className="italic text-primary">Continues</span>
                    </h1>
                </motion.div>

                {lastAnalysis && rescanDaysAgo >= RESCAN_THRESHOLD_DAYS && (
                    <RescanNudge daysAgo={rescanDaysAgo} />
                )}

                {/* 12-col grid — main content left, style profile right */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left / center column */}
                    <div className="xl:col-span-8 space-y-10">
                        <StyleIdentityCards
                            lastAnalysis={lastAnalysis}
                            bodyShape={bodyShape}
                            stylePersonality={stylePersonality}
                        />

                        {status === 'authenticated' && (
                            <TodaysOutfit
                                dailyOutfit={dailyOutfit}
                                isEmpty={dailyOutfitEmpty}
                                isError={dailyOutfitError}
                                onRetry={() => { setDailyOutfitError(false); setDailyOutfit(null); }}
                            />
                        )}

                        <DiscoveryQuizzes />

                        {lastAnalysis?.undertone && (
                            <SkincareGuide undertone={lastAnalysis.undertone} />
                        )}

                        {history.length > 0 && (
                            <AnalysisHistory history={history} />
                        )}

                        {!lastAnalysis && <EmptyCTA />}
                    </div>

                    {/* Right column — quick actions */}
                    <div className="xl:col-span-4 space-y-6">
                        <QuickActions aiStylistHref={aiStylistHref} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
