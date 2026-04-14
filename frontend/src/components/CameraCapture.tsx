'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Sun, AlertCircle, CheckCircle2, Zap, Camera } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useCameraStream } from '@/lib/hooks/useCameraStream';
import { useLightingAnalysis } from '@/lib/hooks/useLightingAnalysis';
import CameraFaceGuide from './CameraFaceGuide';
import CameraControls from './CameraControls';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
    lang?: string;
}

const CAPTURE_COUNTDOWN = 3;
const HOLD_STILL_DELAY_MS = 1500;

export default function CameraCapture({ onCapture, onCancel, lang = 'en' }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const holdStillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { stream, error: cameraError, isActive, startCamera, stopCamera } = useCameraStream();
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showFlash, setShowFlash] = useState(false);
    const [heldStill, setHeldStill] = useState(false);

    const { brightness, lightingStatus, hasFace: faceDetected } = useLightingAnalysis(videoRef);

    // Map hook's lighting status to component's expected format
    const mappedLighting = lightingStatus === 'dark' ? 'too_dark'
        : lightingStatus === 'bright' ? 'too_bright'
        : lightingStatus;

    // Attach stream to video element
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
        }
    }, [stream]);

    // Start camera on mount
    useEffect(() => {
        startCamera(facingMode).catch(() => {});
        return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    // Hold still timer
    useEffect(() => {
        if (faceDetected && lightingStatus === 'good') {
            holdStillTimerRef.current = setTimeout(() => setHeldStill(true), HOLD_STILL_DELAY_MS);
        } else {
            setHeldStill(false);
            if (holdStillTimerRef.current) {
                clearTimeout(holdStillTimerRef.current);
                holdStillTimerRef.current = null;
            }
        }
        return () => { if (holdStillTimerRef.current) clearTimeout(holdStillTimerRef.current); };
    }, [faceDetected, lightingStatus]);

    const flipCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;

        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 300);

        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        if (!ctx) return;

        if (facingMode === 'user') {
            ctx.translate(captureCanvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);

        captureCanvas.toBlob((blob) => {
            if (!blob) return;
            onCapture(new File([blob], 'live-capture.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
    }, [facingMode, onCapture]);

    const canCapture = faceDetected && lightingStatus === 'good' && isActive && countdown === null;

    const startCountdown = () => {
        if (!canCapture) return;
        let remaining = CAPTURE_COUNTDOWN;
        setCountdown(remaining);
        const timer = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(timer);
                setCountdown(null);
                captureFrame();
            } else {
                setCountdown(remaining);
            }
        }, 1000);
    };

    const lightingBarPercent = Math.min(100, Math.max(0, (brightness / 255) * 100));
    const lightingBarColor = lightingStatus === 'good' ? 'bg-green-400'
        : lightingStatus === 'dark' ? 'bg-yellow-400'
        : lightingStatus === 'bright' ? 'bg-orange-400'
        : 'bg-white/30';

    const lightingConfig = {
        good: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: <CheckCircle2 className="w-4 h-4" />, label: t(lang, 'goodLighting') },
        dark: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: <Sun className="w-4 h-4" />, label: t(lang, 'tooDark') },
        bright: { color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', icon: <Zap className="w-4 h-4" />, label: t(lang, 'tooBright') },
        checking: { color: 'text-on-surface-variant', bg: 'bg-surface-container/30 border-outline-variant/10', icon: <Camera className="w-4 h-4" />, label: t(lang, 'checkingLight') },
    };
    const currentLighting = lightingConfig[lightingStatus];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-col items-center gap-4 w-full"
        >
            {/* Camera viewport */}
            <div className="relative w-full rounded-3xl overflow-hidden bg-black" style={{ aspectRatio: '3/4' }}>
                {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-surface-container">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <p className="text-on-surface-variant text-sm leading-relaxed">{cameraError}</p>
                        <button onClick={onCancel} className="text-sm text-primary underline underline-offset-2">
                            Upload a photo instead
                        </button>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay playsInline muted
                            aria-label="Camera viewfinder"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />

                        <CameraFaceGuide lightingStatus={mappedLighting === 'too_dark' ? 'dark' : mappedLighting === 'too_bright' ? 'bright' : lightingStatus} faceDetected={faceDetected} />

                        {/* Feedback badges */}
                        <AnimatePresence>
                            {isActive && faceDetected && lightingStatus === 'good' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40 backdrop-blur-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 text-xs font-semibold">
                                        {heldStill ? 'Perfect! Hold still...' : 'Face detected — hold still'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {isActive && lightingStatus === 'dark' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/40 backdrop-blur-sm">
                                    <Sun className="w-4 h-4 text-yellow-400" />
                                    <span className="text-yellow-400 text-xs font-semibold">Move closer to a window</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {isActive && lightingStatus === 'bright' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 backdrop-blur-sm">
                                    <Zap className="w-4 h-4 text-orange-400" />
                                    <span className="text-orange-400 text-xs font-semibold">Move away from the light source</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Countdown overlay */}
                        <AnimatePresence>
                            {countdown !== null && (
                                <motion.div key={countdown} initial={{ opacity: 0, scale: 1.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-9xl font-black text-white drop-shadow-2xl" style={{ textShadow: '0 0 40px rgba(255,255,255,0.3)' }}>
                                        {countdown}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Flash */}
                        <AnimatePresence>
                            {showFlash && (
                                <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                                    className="absolute inset-0 bg-white pointer-events-none" />
                            )}
                        </AnimatePresence>

                        {/* Flip camera */}
                        <button onClick={flipCamera} aria-label="Flip camera"
                            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Lighting badge */}
                        {isActive && (
                            <div aria-live="polite" role="status"
                                className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-sm ${currentLighting.bg} ${currentLighting.color}`}>
                                {currentLighting.icon}
                                {currentLighting.label}
                            </div>
                        )}

                        {/* Lighting bar */}
                        {isActive && (
                            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                                <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider w-8 shrink-0">Dark</span>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${lightingBarColor}`} style={{ width: `${lightingBarPercent}%` }} />
                                </div>
                                <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider w-10 shrink-0 text-right">Bright</span>
                            </div>
                        )}

                        {/* Loading */}
                        {!isActive && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Guidance text */}
            {isActive && !cameraError && (
                <p className="text-on-surface-variant text-sm text-center px-4">
                    {lightingStatus === 'dark' && t(lang, 'guidanceDark')}
                    {lightingStatus === 'bright' && t(lang, 'guidanceBright')}
                    {lightingStatus === 'good' && !faceDetected && 'Center your face in the oval above'}
                    {lightingStatus === 'good' && faceDetected && t(lang, 'guidanceGood')}
                    {lightingStatus === 'checking' && t(lang, 'guidanceChecking')}
                </p>
            )}

            {/* Controls */}
            {!cameraError && (
                <CameraControls
                    canCapture={canCapture}
                    heldStill={heldStill}
                    countdown={countdown}
                    lang={lang}
                    onCancel={onCancel}
                    onCapture={startCountdown}
                />
            )}

            <style>{`
                @keyframes captureGlow {
                    0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3); }
                }
            `}</style>

            {/* Tips */}
            {isActive && !cameraError && (
                <div className="w-full bg-surface-container/50 border border-primary/10 rounded-2xl p-4">
                    <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2">{t(lang, 'tipTitle')}</p>
                    <ul className="space-y-1">
                        {[t(lang, 'tip1'), t(lang, 'tip2'), t(lang, 'tip3'), t(lang, 'tip4')].map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                                <span className="text-primary mt-0.5">•</span>{tip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
