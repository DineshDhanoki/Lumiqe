'use client';

import React from 'react';
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
                className="flex-1 py-3 rounded-2xl border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:bg-surface-container/30 transition-all text-sm font-semibold"
            >
                {t(lang, 'cancel')}
            </button>

            <button
                onClick={onCapture}
                disabled={!canCapture}
                aria-label="Capture photo"
                className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                    canCapture
                        ? 'bg-primary-container hover:bg-primary text-on-primary-container shadow-lg hover:scale-105'
                        : 'bg-surface-container text-on-surface-variant/30 cursor-not-allowed'
                }`}
                style={canCapture && heldStill ? {
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)',
                    animation: 'captureGlow 1.5s ease-in-out infinite',
                } : undefined}
            >
                <span className="material-symbols-outlined text-base">photo_camera</span>
                {countdown !== null ? `${t(lang, 'capturePhoto')} ${countdown}...` : t(lang, 'capturePhoto')}
            </button>
        </div>
    );
});

export default CameraControls;
