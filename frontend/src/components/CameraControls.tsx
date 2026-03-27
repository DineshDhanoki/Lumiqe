'use client';

import React from 'react';
import { Camera } from 'lucide-react';
import { t } from '@/lib/i18n';

interface CameraControlsProps {
    canCapture: boolean;
    heldStill: boolean;
    countdown: number | null;
    lang: string;
    onCancel: () => void;
    onCapture: () => void;
}

const CameraControls = React.memo(function CameraControls({
    canCapture,
    heldStill,
    countdown,
    lang,
    onCancel,
    onCapture,
}: CameraControlsProps) {
    return (
        <div className="flex items-center gap-4 w-full">
            <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-2xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
            >
                {t(lang, 'cancel')}
            </button>

            <button
                onClick={onCapture}
                disabled={!canCapture}
                aria-label="Capture photo"
                className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                    canCapture
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:scale-105'
                        : 'bg-zinc-800 text-white/30 cursor-not-allowed'
                }`}
                style={canCapture && heldStill ? {
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)',
                    animation: 'captureGlow 1.5s ease-in-out infinite',
                } : undefined}
            >
                <Camera className="w-4 h-4" />
                {countdown !== null ? `${t(lang, 'capturePhoto')} ${countdown}...` : t(lang, 'capturePhoto')}
            </button>
        </div>
    );
});

export default CameraControls;
