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
            <main className="min-h-screen bg-black flex items-center justify-center text-on-surface">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Season Not Found</h1>
                    <Link href="/" className="text-red-400 hover:underline">Go Home</Link>
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
    const accentHex = palette[1] || palette[0] || '#DC2626';

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
        <main className="min-h-screen bg-black text-on-surface">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript }}
            />

            {/* Hero */}
            <section className="relative py-24 px-6 text-center overflow-hidden">
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `radial-gradient(ellipse at center, ${accentHex}40 0%, transparent 70%)`,
                    }}
                />
                <div className="relative z-10 max-w-3xl mx-auto">
                    <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-4">Color Season Guide</p>
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4">{seasonName}</h1>
                    <p className="text-on-surface-variant text-lg max-w-xl mx-auto mb-4">{data.description}</p>
                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        <span className="px-3 py-1 rounded-full bg-surface-container/30 border border-primary/10 text-sm text-on-surface-variant">
                            {data.contrast} Contrast
                        </span>
                        <span className="px-3 py-1 rounded-full bg-surface-container/30 border border-primary/10 text-sm text-on-surface-variant">
                            {data.value} Value
                        </span>
                        <span className="px-3 py-1 rounded-full bg-surface-container/30 border border-primary/10 text-sm text-on-surface-variant">
                            {data.chroma} Chroma
                        </span>
                        <span className="px-3 py-1 rounded-full bg-surface-container/30 border border-primary/10 text-sm text-on-surface-variant">
                            Best Metal: {data.metal}
                        </span>
                    </div>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16">

                {/* Palette */}
                <section>
                    <h2 className="text-2xl font-bold mb-6">Your Palette</h2>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {palette.map((hex, i) => (
                            <div key={i} className="text-center">
                                <div
                                    className="w-full aspect-square rounded-2xl border border-primary/10 mb-2"
                                    style={{ backgroundColor: hex }}
                                />
                                <span className="text-xs text-on-surface-variant font-mono">{hex.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Colors to Avoid */}
                {avoid.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Colors to Avoid</h2>
                        <div className="flex flex-wrap gap-4">
                            {avoid.map((hex, i) => (
                                <div key={i} className="text-center">
                                    <div
                                        className="w-14 h-14 rounded-xl border border-primary/10 relative"
                                        style={{ backgroundColor: hex }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant text-lg font-bold">
                                            &#10005;
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-on-surface-variant font-mono mt-1 block">{hex.toUpperCase()}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Celebrity Matches */}
                {celebrities.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Celebrity Color Matches</h2>
                        <div className="flex flex-wrap gap-4">
                            {celebrities.map((celeb, i) => (
                                <div key={i} className="bg-surface-container/50 border border-primary/10 rounded-xl px-5 py-3">
                                    <span className="text-on-surface-variant text-sm font-medium">{celeb.name}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Styling Tips */}
                {data.tips && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Styling Tips</h2>
                        <p className="text-on-surface-variant leading-relaxed">{data.tips}</p>
                    </section>
                )}

                {/* Occasions */}
                {Object.keys(occasions).length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Styling by Occasion</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(occasions).map(([occasion, info]) => {
                                const occasionInfo = info as { formula?: string; colors?: string[]; key_pieces?: string[] };
                                return (
                                <div key={occasion} className="bg-surface-container/50 border border-primary/10 rounded-2xl p-5">
                                    <h3 className="text-white font-bold capitalize mb-2">
                                        {occasion.replace(/_/g, ' ')}
                                    </h3>
                                    <p className="text-on-surface-variant text-sm mb-3">{occasionInfo.formula}</p>
                                    <div className="flex gap-2 mb-3">
                                        {(occasionInfo.colors || []).map((hex: string, i: number) => (
                                            <div
                                                key={i}
                                                className="w-6 h-6 rounded-full border border-primary/10"
                                                style={{ backgroundColor: hex }}
                                            />
                                        ))}
                                    </div>
                                    <ul className="space-y-1">
                                        {(occasionInfo.key_pieces || []).map((piece: string, i: number) => (
                                            <li key={i} className="text-on-surface-variant text-xs">- {piece}</li>
                                        ))}
                                    </ul>
                                </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Capsule Wardrobe */}
                {capsule.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-6">10-Piece Capsule Wardrobe</h2>
                        <div className="grid md:grid-cols-2 gap-3">
                            {capsule.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-surface-container/50 border border-primary/10 rounded-xl p-4">
                                    <div
                                        className="w-10 h-10 rounded-lg border border-primary/10 shrink-0"
                                        style={{ backgroundColor: item.hex }}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{item.piece}</p>
                                        <p className="text-on-surface-variant text-xs truncate">{item.why}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA */}
                <section className="text-center py-12">
                    <h2 className="text-3xl font-bold mb-4">
                        Think you&apos;re a {seasonName}?
                    </h2>
                    <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
                        Upload a selfie and let our AI determine your exact color season in seconds.
                    </p>
                    <Link
                        href="/analyze"
                        className="inline-flex items-center gap-2 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-bold py-3 px-8 transition-all shadow-[0_0_30px_-5px_rgba(220,38,38,0.5)]"
                    >
                        Analyze Now
                    </Link>
                </section>

                {/* Browse Other Seasons */}
                <section>
                    <h2 className="text-xl font-bold mb-4 text-on-surface-variant">Other Seasons</h2>
                    <div className="flex flex-wrap gap-2">
                        {allSeasons.filter(s => s !== seasonName).map(s => (
                            <Link
                                key={s}
                                href={`/seasons/${toSlug(s)}`}
                                className="px-4 py-2 rounded-full bg-surface-container/30 border border-primary/10 text-sm text-on-surface-variant hover:text-on-surface hover:border-primary/20 transition-colors"
                            >
                                {s}
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
