'use client';

import { motion } from 'framer-motion';

interface FreeTrialProps {
    onOpenAuth: () => void;
}

export default function FreeTrial({ onOpenAuth }: FreeTrialProps) {
    return (
        <section className="py-0 px-6">
            <div className="max-w-[1280px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="rounded-[3rem] bg-gradient-to-br from-surface-container-high to-background p-16 text-center border border-outline-variant/10 relative overflow-hidden"
                >
                    {/* Background glow blobs */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

                    <h2 className="text-5xl md:text-6xl font-display mb-8 relative z-10 text-on-surface">
                        Ready to Meet Your <br />Better Half?
                    </h2>
                    <p className="max-w-xl mx-auto text-on-surface-variant text-lg mb-12 relative z-10">
                        Stop guessing and start glowing. Join the elite who have mastered their visual identity through data.
                    </p>
                    <button
                        onClick={onOpenAuth}
                        className="relative z-10 px-12 py-6 bg-white text-black font-headline font-extrabold rounded-full tracking-tighter hover:scale-105 active:scale-95 transition-all"
                    >
                        START FREE ANALYSIS
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
