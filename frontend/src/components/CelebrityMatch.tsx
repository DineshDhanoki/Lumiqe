'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface Celebrity {
    name: string;
    image?: string;
    image_hint?: string;
    note?: string;
}

interface CelebrityMatchProps {
    celebrities: Celebrity[];
    season?: string;
}

/**
 * Season-to-gradient mapping for card backgrounds.
 * Warm seasons get warm gradients; cool seasons get cool gradients.
 */
function seasonGradient(season: string): string {
    const lower = season.toLowerCase();
    if (lower.includes('winter')) {
        return 'from-blue-950/60 via-indigo-950/40 to-zinc-900/30';
    }
    if (lower.includes('spring')) {
        return 'from-amber-950/50 via-yellow-950/30 to-zinc-900/30';
    }
    if (lower.includes('summer')) {
        return 'from-rose-950/50 via-pink-950/30 to-zinc-900/30';
    }
    if (lower.includes('autumn')) {
        return 'from-orange-950/50 via-amber-950/30 to-zinc-900/30';
    }
    return 'from-surface-container/50 to-surface/30';
}

interface SeasonCelebrity {
    name: string;
    image_hint: string;
    note: string;
}

export default function CelebrityMatch({ celebrities, season }: CelebrityMatchProps) {
    const [seasonCelebs, setSeasonCelebs] = useState<SeasonCelebrity[]>([]);
    const [fetchedSeason, setFetchedSeason] = useState(false);

    // Fetch season-specific celebrity matches from the API
    useEffect(() => {
        if (!season || fetchedSeason) return;
        setFetchedSeason(true);

        const apiBase = API_BASE;
        fetch(`${apiBase}/api/celebrity/match?season=${encodeURIComponent(season)}`)
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (data?.celebrities) {
                    setSeasonCelebs(data.celebrities);
                }
            })
            .catch(() => {
                // Silently fall back to the props-based celebrities
            });
    }, [season, fetchedSeason]);

    // Prefer API-fetched season celebrities, fall back to prop celebrities
    const displayCelebs: Celebrity[] =
        seasonCelebs.length > 0
            ? seasonCelebs
            : celebrities;

    if (!displayCelebs || displayCelebs.length === 0) return null;

    const gradient = season ? seasonGradient(season) : 'from-zinc-900/50 to-zinc-800/30';

    return (
        <div className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="font-headline text-xl font-bold text-on-surface">Your Celebrity Color Twins</h3>
            </div>

            <p className="text-on-surface-variant mb-6 max-w-lg">
                These celebrities share your exact color season. Notice the colors they wear on the red carpet&mdash;they&apos;ve already paid the stylists to figure out what works.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayCelebs.slice(0, 3).map((celeb, idx) => (
                    <motion.div
                        key={celeb.name || idx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`bg-gradient-to-br ${gradient} border border-outline-variant/20 rounded-2xl p-5 flex flex-col items-center text-center`}
                    >
                        {/* Avatar placeholder with initials */}
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-outline-variant/30 mb-4 relative bg-surface-container flex items-center justify-center">
                            {celeb.image ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-surface to-surface-container animate-pulse" />
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={celeb.image}
                                        alt={celeb.name}
                                        className="absolute inset-0 w-full h-full object-cover relative z-10"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </>
                            ) : (
                                <span className="text-2xl font-bold text-on-surface-variant/50 z-10">
                                    {celeb.name
                                        .split(' ')
                                        .map(w => w[0])
                                        .join('')
                                        .slice(0, 2)}
                                </span>
                            )}
                        </div>

                        <h4 className="text-on-surface font-label font-semibold text-base mb-1">
                            {celeb.name}
                        </h4>

                        {celeb.note && (
                            <p className="text-on-surface-variant text-sm leading-relaxed">
                                {celeb.note}
                            </p>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
