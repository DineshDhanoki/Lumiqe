'use client';

import { motion } from 'framer-motion';
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
                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-outline-variant/20 bg-surface-container/30 hover:bg-surface-container/50 hover:border-primary/50 transition-all group"
                >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-4xl text-primary">photo_camera</span>
                    </div>
                    <div className="text-center">
                        <p className="text-on-surface font-semibold text-sm">{t(lang, 'liveCamera')}</p>
                        <p className="text-on-surface-variant text-xs mt-1">{t(lang, 'mostAccurate')}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        {t(lang, 'recommended')}
                    </span>
                </button>

                <button
                    onClick={onSelectUpload}
                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-outline-variant/20 bg-surface-container/30 hover:bg-surface-container/50 hover:border-outline-variant/50 transition-all group"
                >
                    <div className="w-16 h-16 rounded-2xl bg-surface-container/50 flex items-center justify-center group-hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant">upload</span>
                    </div>
                    <div className="text-center">
                        <p className="text-on-surface font-semibold text-sm">{t(lang, 'uploadPhoto')}</p>
                        <p className="text-on-surface-variant text-xs mt-1">{t(lang, 'fromDevice')}</p>
                    </div>
                </button>
            </div>

            {/* Multi-Photo Option */}
            <button
                onClick={onSelectMulti}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-outline-variant/20 bg-surface-container/30 hover:bg-surface-container/50 hover:border-primary/30 transition-all group"
            >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <span className="material-symbols-outlined text-3xl text-primary">photo_library</span>
                </div>
                <div className="text-left">
                    <p className="text-on-surface font-semibold text-sm">Multi-Photo Analysis</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">Upload 2-5 selfies for higher accuracy</p>
                </div>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex-shrink-0">
                    Pro
                </span>
            </button>

            {/* Image quality guidance */}
            <div className="bg-surface-container/30 border border-outline-variant/20 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">For accurate results</p>
                <ul className="space-y-1.5">
                    <li className="text-xs text-on-surface-variant flex items-center gap-2"><span>☀️</span> Natural or bright indoor lighting — no dark rooms</li>
                    <li className="text-xs text-on-surface-variant flex items-center gap-2"><span>👤</span> Face clearly visible, centered, no sunglasses</li>
                    <li className="text-xs text-on-surface-variant flex items-center gap-2"><span>🚫</span> No heavy filters, edits, or beauty mode</li>
                    <li className="text-xs text-on-surface-variant flex items-center gap-2"><span>📷</span> A well-lit selfie or portrait works best</li>
                </ul>
            </div>
        </motion.div>
    );
}
