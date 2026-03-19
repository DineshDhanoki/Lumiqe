'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface BestAvoidColorsProps {
    bestColors: string[];
    avoidColors: string[];
}

export default function BestAvoidColors({ bestColors, avoidColors }: BestAvoidColorsProps) {
    return (
        <div className="flex flex-col gap-6">
            {/* Best Colors */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-950/20 border border-green-500/20 rounded-3xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-bold text-green-100">Wear These</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {bestColors.map((hex) => (
                        <div
                            key={hex}
                            className="group relative w-12 h-12 md:w-16 md:h-16 rounded-full shadow-inner border border-white/10 hover:scale-110 transition-transform cursor-crosshair"
                            style={{ backgroundColor: hex }}
                        >
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black/80 px-2 py-1 rounded text-xs text-white uppercase font-mono transition-opacity whitespace-nowrap z-10">
                                {hex}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Avoid Colors */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-red-950/20 border border-red-500/20 rounded-3xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-bold text-red-100">Avoid These</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {avoidColors.map((hex) => (
                        <div
                            key={hex}
                            className="group relative w-12 h-12 md:w-16 md:h-16 rounded-full shadow-inner border border-white/10 hover:scale-110 transition-transform cursor-crosshair"
                            style={{ backgroundColor: hex }}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                <div className="w-full h-px bg-white/50 -rotate-45" />
                            </div>
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-black/80 px-2 py-1 rounded text-xs text-white uppercase font-mono transition-opacity whitespace-nowrap z-10">
                                {hex}
                            </span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
