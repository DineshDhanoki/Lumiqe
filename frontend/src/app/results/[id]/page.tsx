'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sparkles } from 'lucide-react';
import ResultsView from '@/components/ResultsView';
import { SkeletonResultsPage } from '@/components/ui/Skeleton';
import { apiFetch } from '@/lib/api';

interface AnalysisData {
    id: string;
    season: string;
    hex_color: string;
    undertone: string;
    confidence: number;
    contrast_level: string;
    palette: string[];
    avoid_colors: string[];
    metal: string;
    full_result: {
        description?: string;
        celebrities?: { name: string; image: string }[];
        makeup?: { lips: string; blush: string; eyeshadow: string };
        tips?: string;
        [key: string]: unknown;
    };
    created_at: string | null;
}

export default function AnalysisResultPage() {
    const { id } = useParams<{ id: string }>();
    const { data: session } = useSession();
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id || !session) return;
        setLoading(true);
        apiFetch(`/api/analysis/${id}`, {}, session)
            .then(async (res) => {
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.detail?.detail || 'Failed to load analysis');
                }
                return res.json();
            })
            .then((data) => setAnalysis(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id, session]);

    if (loading) return <SkeletonResultsPage />;

    if (error || !analysis) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
                <Sparkles className="w-12 h-12 text-red-500 mb-6" />
                <h1 className="text-3xl font-bold text-white mb-4">Analysis Not Found</h1>
                <p className="text-white/60 mb-8">{error || 'This analysis does not exist or you do not have access.'}</p>
                <Link href="/dashboard" className="px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors inline-block">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <ResultsView
            season={analysis.season}
            description={analysis.full_result.description || ''}
            hexColor={analysis.hex_color}
            undertone={analysis.undertone}
            confidence={analysis.confidence}
            contrastLevel={analysis.contrast_level}
            palette={analysis.palette}
            avoidColors={analysis.avoid_colors}
            metal={analysis.metal}
            tips={analysis.full_result.tips || ''}
            celebrities={analysis.full_result.celebrities || []}
            makeup={analysis.full_result.makeup || { lips: '', blush: '', eyeshadow: '' }}
            backHref="/dashboard"
            backLabel="Dashboard"
            analysisId={analysis.id}
        />
    );
}
