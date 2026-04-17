'use client';

import { motion } from 'framer-motion';

interface BestAvoidColorsProps {
    bestColors: string[];
    avoidColors: string[];
}

export default function BestAvoidColors({ bestColors, avoidColors }: BestAvoidColorsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container/50 border border-primary/10 rounded-3xl p-6 md:p-8"
        >
            <div className="grid grid-cols-2 gap-6 md:gap-10">
                {/* Wear These */}
                <div>
                    <div className="flex items-center gap-2 mb-5">
                        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-primary">Ideal Pairings</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {bestColors.map((hex) => (
                            <div
                                key={hex}
                                className="group relative w-10 h-10 md:w-14 md:h-14 rounded-full border border-outline-variant/20 shadow-md hover:scale-110 transition-transform duration-200 cursor-crosshair"
                                style={{ backgroundColor: hex }}
                            >
                                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-on-surface font-mono transition-opacity whitespace-nowrap z-10">
                                    {hex}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Avoid These */}
                <div>
                    <div className="flex items-center gap-2 mb-5">
                        <span className="material-symbols-outlined text-primary/70 text-base">cancel</span>
                        <p className="font-label text-[10px] font-bold tracking-[0.25em] uppercase text-primary/70">Avoid These</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {avoidColors.map((hex) => (
                            <div
                                key={hex}
                                className="group relative w-10 h-10 md:w-14 md:h-14 rounded-full border border-outline-variant/20 shadow-md hover:scale-110 transition-transform duration-200 cursor-crosshair"
                                style={{ backgroundColor: hex, filter: 'grayscale(0.4)' }}
                            >
                                {/* Diagonal slash */}
                                <div className="absolute inset-0 flex items-center justify-center rounded-full overflow-hidden opacity-50">
                                    <div className="w-full h-px bg-white/50 -rotate-45" />
                                </div>
                                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] text-on-surface font-mono transition-opacity whitespace-nowrap z-10">
                                    {hex}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
