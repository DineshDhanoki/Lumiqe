'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DemoResult {
    id: string;
    name: string;
    thumbnail: string;
    season: string;
    undertone: string;
    hex_color: string;
    confidence: number;
    palette: string[];
    description: string;
}

export default function DemoPreview() {
    const [demos, setDemos] = useState<DemoResult[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchDemos() {
            try {
                const res = await fetch('/api/proxy/demo-results');
                if (!res.ok) throw new Error('Failed to load demo data');
                const data = await res.json();
                setDemos(data);
            } catch {
                setError('Could not load demo examples. Ensure backend is running.');
            } finally {
                setLoading(false);
            }
        }
        fetchDemos();
    }, []);

    const activeDemo = demos[activeIndex];

    return (
        <section id="demo" className="py-24 px-6 relative bg-gradient-to-b from-transparent to-primary/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container/30 border border-primary/10 text-on-surface text-sm font-medium mb-4"
                    >
                        <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <span>Live Preview</span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="font-headline text-4xl md:text-5xl font-bold text-on-surface mb-6"
                    >
                        See the Engine in Action
                    </motion.h2>
                    <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
                        Real analyses from our core CV pipeline. Click below to see the exact color palettes calculated for different skin profiles.
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 min-h-[400px] border border-primary/10 rounded-3xl bg-surface-container/30 backdrop-blur-md">
                        <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">progress_activity</span>
                        <p className="text-on-surface-variant">Loading engine samples...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center p-20 min-h-[400px] border border-primary/20 rounded-3xl bg-primary/5 backdrop-blur-md">
                        <span className="material-symbols-outlined text-5xl text-primary mb-4">error</span>
                        <p className="text-primary">{error}</p>
                    </div>
                ) : demos.length > 0 && activeDemo ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border border-primary/10 rounded-3xl bg-surface/40 backdrop-blur-xl overflow-hidden shadow-2xl">

                        {/* Left Sidebar: Thumbnails */}
                        <div className="col-span-1 lg:col-span-3 bg-surface-container/30 border-r border-primary/10 p-6 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-visible">
                            {demos.map((demo, idx) => (
                                <button
                                    key={demo.id}
                                    onClick={() => setActiveIndex(idx)}
                                    className={`relative flex-shrink-0 flex items-center gap-4 p-3 rounded-xl transition-all ${idx === activeIndex ? 'bg-surface-container/50 border-primary/20' : 'hover:bg-surface-container/30 border-transparent'
                                        } border text-left`}
                                >
                                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${idx === activeIndex ? 'border-primary' : 'border-transparent'}`}>
                                        <div className="w-full h-full bg-stone-700 animate-pulse" /> {/* Placeholder fallback */}
                                        {/* Placeholder image tag since real images aren't present yet */}
                                        {/* <Image src={demo.thumbnail} alt={demo.name} fill className="object-cover" /> */}
                                    </div>
                                    <div className="hidden lg:block">
                                        <h4 className="text-on-surface font-medium">{demo.name}</h4>
                                        <p className="text-xs text-on-surface-variant">{demo.season}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Right Display: Analytics Result */}
                        <div className="col-span-1 lg:col-span-9 p-8 md:p-12 relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeDemo.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative z-10 flex flex-col h-full justify-center"
                                >
                                    <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                                        {/* Skin Swatch */}
                                        <div>
                                            <p className="text-sm font-semibold text-on-surface-variant mb-3 tracking-wider uppercase">Detected Tone</p>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-16 h-16 rounded-full shadow-lg border-2 border-outline-variant/30"
                                                    style={{ backgroundColor: activeDemo.hex_color }}
                                                />
                                                <div>
                                                    <p className="text-on-surface font-mono font-medium">{activeDemo.hex_color}</p>
                                                    <p className="text-xs text-on-surface-variant capitalize">{activeDemo.undertone} undertone</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Season Result */}
                                        <div className="md:ml-auto text-left md:text-right">
                                            <p className="text-sm font-semibold text-on-surface-variant mb-2 tracking-wider uppercase">Your Season</p>
                                            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-on-surface">
                                                {activeDemo.season}
                                            </h3>
                                            <div className="inline-flex mt-2 items-center gap-1 text-xs px-2 py-1 rounded bg-surface-container/50 text-on-surface-variant">
                                                Accuracy: {(activeDemo.confidence * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Palette Swatches */}
                                    <div>
                                        <p className="text-sm font-semibold text-on-surface-variant mb-4 tracking-wider uppercase">Optimal Palette</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                            {activeDemo.palette.map((color, i) => (
                                                <motion.div
                                                    key={`${color}-${i}`}
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="aspect-square rounded-2xl shadow-inner border border-outline-variant/20 flex items-end p-2"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    <span className="text-[10px] font-mono font-medium bg-black/40 text-white/90 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                        {color}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    <p className="mt-8 text-on-surface leading-relaxed max-w-2xl border-l-2 border-primary pl-4">
                                        {activeDemo.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Background gradient decorative */}
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 blur-3xl pointer-events-none transition-colors duration-1000"
                                style={{ backgroundColor: activeDemo.palette[0] }}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
