'use client';

import React from 'react';
import type { LightingStatus } from '@/lib/hooks/useLightingAnalysis';

interface CameraFaceGuideProps {
    lightingStatus: LightingStatus;
    faceDetected: boolean;
}

function getOvalStroke(lightingStatus: LightingStatus, faceDetected: boolean): string {
    if (lightingStatus === 'checking') return 'rgba(255,255,255,0.4)';
    if (lightingStatus === 'dark' || lightingStatus === 'bright') return '#f59e0b';
    if (faceDetected) return '#22c55e';
    return '#ffffff';
}

const CameraFaceGuide = React.memo(function CameraFaceGuide({
    lightingStatus,
    faceDetected,
}: CameraFaceGuideProps) {
    const isGoodAndDetected = faceDetected && lightingStatus === 'good';
    const strokeColor = getOvalStroke(lightingStatus, faceDetected);

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 400 500" className="absolute inset-0 w-full h-full">
                {/* Dark overlay with oval cutout */}
                <defs>
                    <mask id="face-mask">
                        <rect width="400" height="500" fill="white" />
                        <ellipse cx="200" cy="220" rx="120" ry="160" fill="black" />
                    </mask>
                </defs>
                <rect width="400" height="500" fill="rgba(0,0,0,0.5)" mask="url(#face-mask)" />

                {/* Pulsing ring when face detected + good lighting */}
                {isGoodAndDetected && (
                    <ellipse
                        cx="200" cy="220" rx="120" ry="160"
                        fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.4"
                    >
                        <animate attributeName="rx" values="120;130;120" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="ry" values="160;170;160" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                    </ellipse>
                )}

                {/* Main oval border */}
                <ellipse
                    cx="200" cy="220" rx="120" ry="160"
                    fill="none" stroke={strokeColor} strokeWidth="2.5"
                    strokeDasharray={isGoodAndDetected ? 'none' : '8 4'}
                />

                {/* Corner tick marks */}
                {isGoodAndDetected && (
                    <>
                        <line x1="80" y1="215" x2="80" y2="225" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="320" y1="215" x2="320" y2="225" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="195" y1="60" x2="205" y2="60" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="195" y1="380" x2="205" y2="380" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                    </>
                )}

                {/* Guide text */}
                <text x="200" y="420" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="14" fontFamily="system-ui, sans-serif">
                    {isGoodAndDetected ? '' : 'Position your face in the oval'}
                </text>
            </svg>
        </div>
    );
});

export default CameraFaceGuide;
