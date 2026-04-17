import { Metadata } from 'next';
import Link from 'next/link';
import seasonsData from '@/data/seasons.json';

type SeasonData = (typeof seasonsData)[keyof typeof seasonsData];

const allSeasons = Object.keys(seasonsData) as (keyof typeof seasonsData)[];

function toSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

function fromSlug(slug: string): keyof typeof seasonsData | null {
    return allSeasons.find(s => toSlug(s) === slug) || null;
}

export function generateStaticParams() {
    return allSeasons.map(season => ({ season: toSlug(season) }));
}

interface Props {
    params: Promise<{ season: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { season: slug } = await params;
    const seasonName = fromSlug(slug);
    if (!seasonName) return { title: 'Season Not Found — Lumiqe' };

    const data = seasonsData[seasonName] as SeasonData;
    const title = `${seasonName} Color Season — Palette, Styling & Guide | Lumiqe`;
    const description = data.description || `Discover the ${seasonName} color palette, best colors, styling tips, and celebrity matches.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            siteName: 'Lumiqe',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

export default async function SeasonPage({ params }: Props) {
    const { season: slug } = await params;
    const seasonName = fromSlug(slug);

    if (!seasonName) {
        return (
            <main className="min-h-screen bg-[#09090B] flex items-center justify-center text-on-surface">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Season Not Found</h1>
                    <Link href="/" className="text-primary hover:underline">Go Home</Link>
                </div>
            </main>
        );
    }

    const data = seasonsData[seasonName] as SeasonData;
    const palette = data.palette || [];
    const avoid = data.avoid || [];
    const occasions = data.occasions || {};
    const capsule = data.capsule_wardrobe || [];
    const celebrities = data.celebrities || [];
    const accentHex = palette[1] || palette[0] || '#c4973e';

    // JSON-LD structured data — built from trusted static data only
    const jsonLdScript = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${seasonName} Color Season Guide`,
        description: data.description,
        author: { '@type': 'Organization', name: 'Lumiqe' },
        publisher: { '@type': 'Organization', name: 'Lumiqe', url: 'https://lumiqe.in' },
    });

    return (
        <main className="min-h-screen bg-[#09090B] text-on-surface">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript }}
            />

            {/* Top Nav */}
            <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-16"
                style={{ background: 'rgba(9,9,11,0.7)', backdropFilter: 'blur(12px)' }}>
                <Link href="/" className="font-display italic text-2xl tracking-tighter text-primary">Lumiqe</Link>
                <div className="flex items-center gap-6">
                    <Link href="/analyze" className="font-headline font-medium uppercase tracking-widest text-[10px] text-on-surface-variant hover:text-primary transition-colors">
                        Analyze
                    </Link>
                    <Link href="/shopping-agent" className="font-headline font-medium uppercase tracking-widest text-[10px] text-on-surface-variant hover:text-primary transition-colors">
                        Shopping
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
                {/* Background gradient using palette accent */}
                <div className="absolute inset-0 z-0" style={{ scale: '1.1' }}>
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `radial-gradient(ellipse at 60% 40%, ${accentHex}30 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, ${palette[0] || accentHex}20 0%, transparent 50%)`,
                            backgroundColor: '#131315',
                        }}
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #09090B 0%, transparent 50%, rgba(9,9,11,0.3) 100%)' }} />
                </div>

                <div className="relative z-10 text-center px-4">
                    <span className="font-headline font-bold uppercase tracking-[0.4em] text-primary text-[10px] mb-6 block">
                        Curated Analysis
                    </span>
                    <h1
                        className="font-display italic text-7xl md:text-9xl text-on-surface tracking-tighter leading-none mb-6"
                        style={{ textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                    >
                        {seasonName}
                    </h1>
                    <p className="font-display text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto italic font-light opacity-90">
                        {data.description}
                    </p>

                    {/* Attributes */}
                    <div className="flex flex-wrap justify-center gap-3 mt-8">
                        {data.contrast && (
                            <span className="px-4 py-1.5 rounded-full bg-surface-container/50 border border-primary/15 text-xs text-on-surface-variant font-mono">
                                {data.contrast} Contrast
                            </span>
                        )}
                        {data.value && (
                            <span className="px-4 py-1.5 rounded-full bg-surface-container/50 border border-primary/15 text-xs text-on-surface-variant font-mono">
                                {data.value} Value
                            </span>
                        )}
                        {data.chroma && (
                            <span className="px-4 py-1.5 rounded-full bg-surface-container/50 border border-primary/15 text-xs text-on-surface-variant font-mono">
                                {data.chroma} Chroma
                            </span>
                        )}
                        {data.metal && (
                            <span className="px-4 py-1.5 rounded-full bg-surface-container/50 border border-primary/15 text-xs text-on-surface-variant font-mono">
                                Best Metal: {data.metal}
                            </span>
                        )}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
                    <span className="font-mono text-[8px] uppercase tracking-widest">Scroll to explore</span>
                    <div className="w-px h-12 bg-primary" />
                </div>
            </section>

            {/* Color Palette Bento Grid */}
            {palette.length > 0 && (
                <section className="max-w-[1400px] mx-auto px-6 py-32">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[400px]">
                        {/* Left: Info */}
                        <div className="md:col-span-4 flex flex-col justify-between p-8 bg-surface-container border-l border-primary/20">
                            <div>
                                <h2 className="font-headline font-bold text-3xl mb-4 tracking-tight">The Palette</h2>
                                <p className="text-on-surface-variant font-light leading-relaxed mb-8">
                                    {data.tips || `The ${seasonName} palette is built around tones that harmonize naturally with your unique coloring.`}
                                </p>
                            </div>
                            <div className="space-y-3">
                                {palette.slice(0, 3).map((hex, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                                        <span className="font-mono text-[10px] text-primary">{hex.toUpperCase()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Color swatches grid */}
                        <div className={`md:col-span-8 grid gap-3 ${palette.length >= 6 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {palette.slice(0, 6).map((hex, i) => (
                                <div
                                    key={i}
                                    className="group cursor-crosshair relative overflow-hidden flex items-end p-5 transition-all duration-700 hover:scale-[1.02] min-h-[140px]"
                                    style={{ backgroundColor: hex }}
                                >
                                    <div
                                        className="font-display italic text-white/40 text-3xl select-none"
                                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                                    >
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="font-mono text-[9px] text-white/50">{hex.toUpperCase()}</span>
                                    </div>
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Colors to Avoid */}
            {avoid.length > 0 && (
                <section className="max-w-[1400px] mx-auto px-6 pb-20">
                    <div className="border-t border-primary/10 pt-16">
                        <div className="flex items-baseline justify-between mb-10">
                            <h2 className="font-display italic text-4xl text-on-surface">Colors to Avoid</h2>
                            <span className="font-mono text-[10px] text-primary uppercase tracking-widest">Clash Analysis</span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {avoid.map((hex, i) => (
                                <div key={i} className="text-center group">
                                    <div
                                        className="w-16 h-16 rounded-2xl border border-primary/10 relative overflow-hidden"
                                        style={{ backgroundColor: hex }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#09090B]/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-on-surface text-lg font-bold">✕</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-on-surface-variant font-mono mt-2 block">{hex.toUpperCase()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Celebrity Matches — "Seasonal Muses" */}
            {celebrities.length > 0 && (
                <section className="bg-surface-container-low py-32 overflow-hidden">
                    <div className="max-w-[1400px] mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-baseline mb-16">
                            <h2 className="font-display italic text-5xl md:text-7xl">Seasonal Muses</h2>
                            <p className="font-headline font-medium text-xs tracking-widest uppercase text-primary border-b border-primary/20 pb-1">
                                Archetypes of {seasonName}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {celebrities.map((celeb, i) => (
                                <div
                                    key={i}
                                    className="bg-surface-container border border-primary/10 p-5 hover:border-primary/20 transition-colors"
                                >
                                    <div
                                        className="w-10 h-10 rounded-full mb-4 flex items-center justify-center text-on-primary font-headline font-bold text-xs"
                                        style={{ backgroundColor: accentHex }}
                                    >
                                        {celeb.name.charAt(0)}
                                    </div>
                                    <h3 className="font-display italic text-lg text-on-surface mb-1">{celeb.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Editorial Styling Guide */}
            {data.tips && (
                <section className="max-w-[1400px] mx-auto px-6 py-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        <div className="md:sticky md:top-32 h-fit">
                            <span className="font-mono text-primary text-[10px] mb-4 block uppercase tracking-widest">Masterclass</span>
                            <h2 className="font-display italic text-5xl leading-tight mb-6">
                                Styling the<br />
                                <span className="text-primary">{seasonName}</span>
                            </h2>
                            <p className="text-on-surface-variant font-light mb-8 leading-relaxed">
                                How to translate AI-driven color theory into a tangible editorial wardrobe.
                            </p>
                            <Link
                                href="/analyze"
                                className="inline-block bg-primary-container text-on-primary font-headline font-bold text-[10px] uppercase tracking-widest px-8 py-4 rounded-[10px] hover:opacity-90 transition-opacity"
                            >
                                Analyze Your Colors
                            </Link>
                        </div>

                        <div className="md:col-span-2 space-y-16">
                            <div className="border-t border-primary/10 pt-12">
                                <span className="font-display italic text-primary text-2xl mb-3 block">01. Style Intelligence</span>
                                <h4 className="font-headline font-bold text-sm uppercase tracking-widest mb-4">Styling Principles</h4>
                                <p className="text-on-surface-variant font-light leading-loose">{data.tips}</p>
                            </div>

                            {/* Occasions */}
                            {Object.keys(occasions).length > 0 && (
                                <div className="border-t border-primary/10 pt-12">
                                    <span className="font-display italic text-primary text-2xl mb-3 block">02. Occasion Formulas</span>
                                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                                        {Object.entries(occasions).map(([occasion, info]) => {
                                            const occasionInfo = info as { formula?: string; colors?: string[]; key_pieces?: string[] };
                                            return (
                                                <div key={occasion} className="bg-surface-container border border-primary/10 p-5">
                                                    <h3 className="font-headline font-bold text-on-surface capitalize mb-2 text-sm uppercase tracking-wider">
                                                        {occasion.replace(/_/g, ' ')}
                                                    </h3>
                                                    {occasionInfo.formula && (
                                                        <p className="text-on-surface-variant text-sm mb-3 font-light">{occasionInfo.formula}</p>
                                                    )}
                                                    {(occasionInfo.colors || []).length > 0 && (
                                                        <div className="flex gap-2 mb-3">
                                                            {(occasionInfo.colors || []).map((hex: string, ci: number) => (
                                                                <div
                                                                    key={ci}
                                                                    className="w-5 h-5 rounded-full border border-primary/10"
                                                                    style={{ backgroundColor: hex }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <ul className="space-y-1">
                                                        {(occasionInfo.key_pieces || []).map((piece: string, pi: number) => (
                                                            <li key={pi} className="text-on-surface-variant text-xs font-light">— {piece}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Capsule Wardrobe */}
            {capsule.length > 0 && (
                <section className="bg-surface-container-low py-20">
                    <div className="max-w-[1400px] mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12">
                            <h2 className="font-display italic text-5xl md:text-6xl">The Capsule</h2>
                            <span className="font-mono text-[10px] text-primary uppercase tracking-widest">{capsule.length}-Piece Wardrobe</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                            {capsule.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-surface-container border border-primary/10 p-5 hover:border-primary/20 transition-colors">
                                    <div
                                        className="w-10 h-10 rounded-lg border border-primary/10 shrink-0"
                                        style={{ backgroundColor: item.hex }}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-on-surface text-sm font-medium truncate">{item.piece}</p>
                                        <p className="text-on-surface-variant text-xs font-light truncate mt-0.5">{item.why}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="bg-[#09090B] py-32 border-t border-primary/5">
                <div className="max-w-2xl mx-auto text-center px-6">
                    <span className="font-mono text-[10px] text-primary uppercase tracking-widest block mb-6">Precision Analysis</span>
                    <h2 className="font-display italic text-5xl md:text-6xl mb-6">
                        Think you&apos;re a {seasonName}?
                    </h2>
                    <p className="text-on-surface-variant mb-10 max-w-md mx-auto font-light leading-relaxed">
                        Upload a selfie and let our AI determine your exact color season in seconds.
                    </p>
                    <Link
                        href="/analyze"
                        className="inline-flex items-center gap-3 rounded-[10px] bg-primary-container text-on-primary font-headline font-bold py-4 px-10 text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        Analyze Now
                    </Link>
                </div>
            </section>

            {/* Browse Other Seasons */}
            <section className="max-w-[1400px] mx-auto px-6 py-20 border-t border-primary/5">
                <h2 className="font-display italic text-3xl mb-8 text-on-surface-variant">Other Seasons</h2>
                <div className="flex flex-wrap gap-2">
                    {allSeasons.filter(s => s !== seasonName).map(s => (
                        <Link
                            key={s}
                            href={`/seasons/${toSlug(s)}`}
                            className="px-5 py-2.5 bg-surface-container border border-primary/10 text-sm text-on-surface-variant hover:text-primary hover:border-primary/25 transition-colors font-mono"
                        >
                            {s}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-surface-container-lowest py-16 px-8 border-t border-white/5">
                <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <span className="font-display italic text-xl text-primary">Lumiqe</span>
                    <div className="flex gap-8">
                        <Link href="/pricing" className="font-headline text-[9px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Pricing</Link>
                        <Link href="/account" className="font-headline text-[9px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Account</Link>
                    </div>
                    <span className="font-mono text-[9px] text-on-surface-variant/40">© 2024 Lumiqe Intelligence. All rights reserved.</span>
                </div>
            </footer>
        </main>
    );
}
