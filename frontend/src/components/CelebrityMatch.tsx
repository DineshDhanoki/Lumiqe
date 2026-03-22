'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface Celebrity {
    name: string;
    image: string;
}

interface CelebrityMatchProps {
    celebrities: Celebrity[];
}

export default function CelebrityMatch({ celebrities }: CelebrityMatchProps) {
    if (!celebrities || celebrities.length === 0) return null;

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-zinc-400" />
                <h3 className="text-xl font-bold text-white">Celebrity Matches</h3>
            </div>

            <p className="text-white/60 mb-6 max-w-lg">
                These celebrities share your exact color season. Notice the colors they wear on the red carpet—they&apos;ve already paid the stylists to figure out what works.
            </p>

            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {celebrities.map((celeb, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex flex-col items-center min-w-[120px]"
                    >
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white/20 mb-3 relative bg-zinc-800">
                            {/* Fallback pattern in case image fails or isn't there yet */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-800 to-zinc-700 animate-pulse" />
                            {/* Using <img> for arbitrary external celeb URLs with error fallback */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={celeb.image}
                                alt={celeb.name}
                                className="absolute inset-0 w-full h-full object-cover relative z-10"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <span className="text-white font-medium text-sm text-center">
                            {celeb.name}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
