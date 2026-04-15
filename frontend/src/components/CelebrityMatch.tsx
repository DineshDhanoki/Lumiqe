'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
            <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                <span className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant/60">Style Muses</span>
            </div>
            <h3 className="font-headline text-xl font-bold text-on-surface mb-3">Your Celebrity Color Twins</h3>
            <p className="text-on-surface-variant text-sm mb-8 max-w-lg">
                These celebrities share your exact color season. Notice the colors they wear on the red carpet&mdash;they&apos;ve already paid the stylists to figure out what works.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayCelebs.slice(0, 3).map((celeb, idx) => (
                    <motion.div
                        key={celeb.name || idx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative group"
                    >
                        {/* Image card */}
                        <div className={`relative overflow-hidden rounded-2xl aspect-[3/4] bg-gradient-to-br ${gradient} border border-outline-variant/20`}>
                            {celeb.image ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={celeb.image}
                                    alt={celeb.name}
                                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-5xl font-display font-bold text-on-surface-variant/20">
                                        {celeb.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                                    </span>
                                </div>
                            )}
                            {/* Bottom gradient + name */}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h4 className="text-on-surface font-label font-bold text-sm">{celeb.name}</h4>
                            </div>
                        </div>

                        {/* Offset info box — appears on hover */}
                        {celeb.note && (
                            <div className="mt-3 bg-surface-container/80 backdrop-blur-sm border border-primary/10 rounded-xl p-3 md:absolute md:mt-0 md:-bottom-2 md:-right-3 md:max-w-[85%] md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-300 md:z-10">
                                <p className="text-on-surface-variant text-xs leading-relaxed">{celeb.note}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
