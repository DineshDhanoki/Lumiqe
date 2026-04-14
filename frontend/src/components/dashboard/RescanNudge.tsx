'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';

interface Props {
    daysAgo: number;
}

export default function RescanNudge({ daysAgo }: Props) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                        <p className="text-amber-300 font-medium">Time for a seasonal update?</p>
                        <p className="text-on-surface-variant text-sm">Your last scan was {daysAgo} days ago. Skin tones shift with seasons.</p>
                    </div>
                </div>
                <Link href="/analyze" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-on-surface rounded-lg text-sm font-semibold flex-shrink-0 transition-colors">
                    Rescan Now
                </Link>
            </div>
        </motion.div>
    );
}
