'use client';

import { motion } from 'framer-motion';

export default function DemoPreview() {
    return (
        <section id="demo" className="py-0 px-6">
            <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[300px]">
                {/* Main Preview Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="lg:col-span-8 lg:row-span-2 rounded-3xl bg-surface-container overflow-hidden relative border border-outline-variant/10"
                    style={{ background: 'linear-gradient(135deg, #201f22 0%, #131315 100%)' }}
                >
                    {/* Warm gradient overlay */}
                    <div className="absolute inset-0 opacity-30"
                        style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(196,151,62,0.25) 0%, transparent 60%)' }} />

                    <div className="absolute inset-0 p-10 flex flex-col justify-center">
                        <div className="max-w-md backdrop-blur-xl bg-surface-container-lowest/40 p-8 rounded-2xl border border-white/5"
                            style={{ boxShadow: '0 40px 60px -15px rgba(196,151,62,0.08)' }}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-mono text-xs text-primary mb-1 tracking-widest">REAL-TIME ANALYSIS</h4>
                                    <p className="text-3xl font-display text-on-surface">Skin Metric V2.1</p>
                                </div>
                                <span className="material-symbols-outlined text-secondary">flare</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-on-surface-variant">Undertone</span>
                                    <span className="text-primary font-bold">Warm Gold</span>
                                </div>
                                <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                                    <div className="w-4/5 h-full bg-primary" />
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-on-surface-variant">Value (Depth)</span>
                                    <span className="text-secondary font-bold">Rich Deep</span>
                                </div>
                                <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                                    <div className="w-3/4 h-full bg-secondary" />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {['#3d2b1f', '#C4973E', '#63462d', '#18181F'].map((c) => (
                                    <div key={c} className="w-10 h-10 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Sub-card 1: Wardrobe Matching */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="lg:col-span-4 lg:row-span-1 rounded-3xl bg-surface-container-high p-8 flex flex-col justify-between border border-outline-variant/10"
                >
                    <span className="material-symbols-outlined text-primary text-4xl">dry_cleaning</span>
                    <div>
                        <h4 className="text-xl font-headline font-bold mb-2 text-on-surface">Wardrobe Matching</h4>
                        <p className="text-sm text-on-surface-variant">Instantly verify if any garment matches your season with AR overlay.</p>
                    </div>
                </motion.div>

                {/* Sub-card 2: AI Personal Stylist */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="lg:col-span-4 lg:row-span-1 rounded-3xl bg-secondary-container/20 p-8 flex flex-col justify-between border border-secondary/20"
                >
                    <span className="material-symbols-outlined text-secondary text-4xl">smart_toy</span>
                    <div>
                        <h4 className="text-xl font-headline font-bold mb-2 text-on-surface">AI Personal Stylist</h4>
                        <p className="text-sm text-on-surface-variant">24/7 expert advice for events, interviews, and daily curation.</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
