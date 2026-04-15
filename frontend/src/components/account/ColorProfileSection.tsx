'use client';

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
        <section className="bg-surface-container rounded-3xl overflow-hidden">
            {/* Section header row */}
            <div className="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-high/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        water_drop
                    </span>
                    <h3 className="font-headline text-xl font-bold text-on-surface">{colorProfileLabel}</h3>
                </div>
                {season && (
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-mono tracking-widest uppercase">
                        {season}
                    </span>
                )}
            </div>

            <div className="p-8 relative overflow-hidden">
                {palette && palette.length > 0 ? (
                    <>
                        {/* Sub-label */}
                        <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-variant/60 mb-4">
                            {basedOnLatestScanLabel}
                        </p>

                        {/* Season name */}
                        {season && (
                            <div className="mb-6">
                                <p className="font-label text-[10px] uppercase tracking-widest text-primary/60 mb-0.5">{seasonLabel}</p>
                                <p className="font-display italic text-3xl text-on-surface">{season}</p>
                            </div>
                        )}

                        {/* Palette swatches */}
                        <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-on-surface-variant/60 mb-3">Core Palette</p>
                        <div className="flex flex-wrap gap-3 mb-8">
                            {palette.map((hex) => (
                                <div key={hex} className="group/swatch relative">
                                    <div
                                        className="w-12 h-12 rounded-full border-2 border-outline-variant/30 shadow-lg cursor-crosshair transition-transform hover:scale-110 hover:border-primary/50"
                                        style={{ backgroundColor: hex }}
                                    />
                                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/swatch:opacity-100 transition-opacity bg-surface/90 backdrop-blur-sm text-on-surface text-[9px] py-0.5 px-2 rounded font-mono border border-primary/10 whitespace-nowrap z-10">
                                        {hex}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/shopping-agent"
                                className="px-6 py-3 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                            >
                                {shopMyColorsLabel}
                            </Link>
                            <Link
                                href="/analyze"
                                className="px-6 py-3 rounded-full border border-outline-variant/30 text-on-surface-variant font-label text-xs uppercase tracking-widest hover:border-primary/30 hover:text-on-surface transition-colors"
                            >
                                {retakeScanLabel}
                            </Link>
                        </div>

                        {/* Decorative palette glow */}
                        <div
                            className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-[100px] opacity-15 pointer-events-none"
                            style={{ backgroundColor: palette[0] }}
                        />
                    </>
                ) : (
                    <div className="text-center py-10 bg-surface-container-high/20 rounded-2xl border border-primary/10">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 block mb-3">
                            auto_awesome
                        </span>
                        <p className="text-on-surface-variant text-sm mb-5">{notAnalyzedYetLabel}</p>
                        <Link
                            href="/analyze"
                            className="inline-block py-3 px-8 rounded-full bg-gradient-to-r from-primary-container to-primary text-on-primary text-xs font-label font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                        >
                            {startFreeScanLabel}
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
