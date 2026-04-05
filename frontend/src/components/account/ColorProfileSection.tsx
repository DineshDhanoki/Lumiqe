'use client';

import { Droplets, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ColorProfileSectionProps {
    season: string | null;
    palette: string[] | null;
    colorProfileLabel: string;
    basedOnLatestScanLabel: string;
    seasonLabel: string;
    shopMyColorsLabel: string;
    retakeScanLabel: string;
    notAnalyzedYetLabel: string;
    startFreeScanLabel: string;
}

export default function ColorProfileSection({
    season,
    palette,
    colorProfileLabel,
    basedOnLatestScanLabel,
    seasonLabel,
    shopMyColorsLabel,
    retakeScanLabel,
    notAnalyzedYetLabel,
    startFreeScanLabel,
}: ColorProfileSectionProps) {
    return (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden">
            <div className="flex items-start justify-between mb-8 z-10 relative">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-5 h-5 text-red-400" />
                        <h3 className="text-xl font-bold text-white">{colorProfileLabel}</h3>
                    </div>
                    <p className="text-white/50 text-sm">{basedOnLatestScanLabel}</p>
                </div>

                {season && (
                    <div className="text-right">
                        <div className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">{seasonLabel}</div>
                        <div className="text-2xl font-extrabold text-white">{season}</div>
                    </div>
                )}
            </div>

            {palette && palette.length > 0 ? (
                <div className="z-10 relative">
                    <div className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-3">Core Palette</div>
                    <div className="flex flex-wrap gap-3">
                        {palette.map((hex) => (
                            <div key={hex} className="group relative">
                                <div
                                    className="w-12 h-12 rounded-full border-2 border-white/10 shadow-lg cursor-pointer transition-transform hover:scale-110 hover:border-white/50"
                                    style={{ backgroundColor: hex }}
                                />
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] py-1 px-2 rounded tracking-wider shadow-xl border border-white/10 z-20">
                                    {hex}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex gap-4">
                        <Link
                            href="/shopping-agent"
                            className="flex-1 py-3 px-6 rounded-full bg-white text-black font-bold text-sm text-center hover:bg-gray-200 transition"
                        >
                            {shopMyColorsLabel}
                        </Link>
                        <Link
                            href="/analyze"
                            className="py-3 px-6 rounded-full bg-white/5 text-white border border-white/10 text-sm font-semibold hover:bg-white/10 transition"
                        >
                            {retakeScanLabel}
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 z-10 relative bg-black/20 rounded-2xl border border-white/5">
                    <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60 mb-4">{notAnalyzedYetLabel}</p>
                    <Link
                        href="/analyze"
                        className="inline-block py-2 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
                    >
                        {startFreeScanLabel}
                    </Link>
                </div>
            )}

            {/* Decorative glow behind palette */}
            {palette && palette.length > 0 && (
                <div
                    className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: palette[0] }}
                />
            )}
        </div>
    );
}
