'use client';

import { motion } from 'framer-motion';
import { Camera, Upload, Images } from 'lucide-react';
import { t } from '@/lib/i18n';

interface Props {
    lang: string;
    onSelectCamera: () => void;
    onSelectUpload: () => void;
    onSelectMulti: () => void;
}

export default function ModeChooser({ lang, onSelectCamera, onSelectUpload, onSelectMulti }: Props) {
    return (
        <motion.div
            key="choose"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={onSelectCamera}
                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-red-500/50 transition-all group"
                >
                    <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                        <Camera className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold text-sm">{t(lang, 'liveCamera')}</p>
                        <p className="text-white/40 text-xs mt-1">{t(lang, 'mostAccurate')}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
                        {t(lang, 'recommended')}
                    </span>
                </button>

                <button
                    onClick={onSelectUpload}
                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all group"
                >
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                        <Upload className="w-8 h-8 text-white/60" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold text-sm">{t(lang, 'uploadPhoto')}</p>
                        <p className="text-white/40 text-xs mt-1">{t(lang, 'fromDevice')}</p>
                    </div>
                </button>
            </div>

            {/* Multi-Photo Option */}
            <button
                onClick={onSelectMulti}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/30 transition-all group"
            >
                <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center group-hover:bg-red-600/20 transition-colors flex-shrink-0">
                    <Images className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-left">
                    <p className="text-white font-semibold text-sm">Multi-Photo Analysis</p>
                    <p className="text-white/40 text-xs mt-0.5">Upload 2-5 selfies for higher accuracy</p>
                </div>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    Pro
                </span>
            </button>

            {/* Image quality guidance */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">For accurate results</p>
                <ul className="space-y-1.5">
                    <li className="text-xs text-white/60 flex items-center gap-2"><span>☀️</span> Natural or bright indoor lighting — no dark rooms</li>
                    <li className="text-xs text-white/60 flex items-center gap-2"><span>👤</span> Face clearly visible, centered, no sunglasses</li>
                    <li className="text-xs text-white/60 flex items-center gap-2"><span>🚫</span> No heavy filters, edits, or beauty mode</li>
                    <li className="text-xs text-white/60 flex items-center gap-2"><span>📷</span> A well-lit selfie or portrait works best</li>
                </ul>
            </div>
        </motion.div>
    );
}
