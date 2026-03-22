'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RotateCcw, Sun, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { t } from '@/lib/i18n';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
    lang?: string;
}

type LightingStatus = 'good' | 'too_dark' | 'too_bright' | 'checking';
type FaceStatus = 'good' | 'too_close' | 'too_far' | 'off_center' | 'checking';

const CAPTURE_COUNTDOWN = 3;

export default function CameraCapture({ onCapture, onCancel, lang = 'en' }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const analysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [cameraError, setCameraError] = useState<string | null>(null);
    const [lightingStatus, setLightingStatus] = useState<LightingStatus>('checking');
    const [, setFaceStatus] = useState<FaceStatus>('checking');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isReady, setIsReady] = useState(false);

    const startCamera = useCallback(async (mode: 'user' | 'environment') => {
        // Stop existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        setCameraError(null);
        setIsReady(false);
        setLightingStatus('checking');
        setFaceStatus('checking');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: mode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsReady(true);
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'NotAllowedError') {
                setCameraError('Camera access denied. Please allow camera access in your browser settings.');
            } else if (err instanceof Error && err.name === 'NotFoundError') {
                setCameraError('No camera found on this device.');
            } else {
                setCameraError('Could not start camera. Please try uploading a photo instead.');
            }
        }
    }, []);

    // Start camera on mount, restart when facingMode changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        startCamera(facingMode);
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
            if (analysisTimerRef.current) {
                clearInterval(analysisTimerRef.current);
            }
        };
    }, [facingMode, startCamera]);

    // Real-time frame analysis for lighting quality
    useEffect(() => {
        if (!isReady) return;

        analysisTimerRef.current = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || video.readyState < 2) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Sample a small region at the center of the frame (face area)
            const sampleW = 80;
            const sampleH = 80;
            const sx = (video.videoWidth - sampleW) / 2;
            const sy = (video.videoHeight - sampleH) / 2;

            canvas.width = sampleW;
            canvas.height = sampleH;
            ctx.drawImage(video, sx, sy, sampleW, sampleH, 0, 0, sampleW, sampleH);

            const imageData = ctx.getImageData(0, 0, sampleW, sampleH);
            const data = imageData.data;

            let totalBrightness = 0;
            let pixelCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                // Perceived luminance
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
                pixelCount++;
            }
            const avgBrightness = totalBrightness / pixelCount;

            if (avgBrightness < 55) {
                setLightingStatus('too_dark');
            } else if (avgBrightness > 210) {
                setLightingStatus('too_bright');
            } else {
                setLightingStatus('good');
            }

            // Simple face presence heuristic: check center region has skin-like variance
            // (If center is uniform/dark, face is likely not centered)
            setFaceStatus('good'); // Simplified — face detection requires ML on-device
        }, 500);

        return () => {
            if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
        };
    }, [isReady]);

    const flipCamera = async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        await startCamera(newMode);
    };

    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;

        // Capture at full video resolution
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        if (!ctx) return;

        // Mirror horizontally if using front camera (matches what user sees)
        if (facingMode === 'user') {
            ctx.translate(captureCanvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);

        captureCanvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], 'live-capture.jpg', { type: 'image/jpeg' });
            onCapture(file);
        }, 'image/jpeg', 0.95);
    }, [facingMode, onCapture]);

    const startCountdown = useCallback(() => {
        if (lightingStatus !== 'good') return;
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
    }, [lightingStatus, captureFrame]);

    const lightingConfig = {
        good: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: <CheckCircle2 className="w-4 h-4" />, label: t(lang, 'goodLighting') },
        too_dark: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: <Sun className="w-4 h-4" />, label: t(lang, 'tooDark') },
        too_bright: { color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', icon: <Zap className="w-4 h-4" />, label: t(lang, 'tooBright') },
        checking: { color: 'text-white/40', bg: 'bg-white/5 border-white/10', icon: <Camera className="w-4 h-4" />, label: t(lang, 'checkingLight') },
    };

    const canCapture = lightingStatus === 'good' && isReady && countdown === null;

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
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-zinc-900">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                        <p className="text-white/70 text-sm leading-relaxed">{cameraError}</p>
                        <button
                            onClick={onCancel}
                            className="text-sm text-red-400 underline underline-offset-2"
                        >
                            Upload a photo instead
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Live video — mirrored for front camera */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />

                        {/* Face alignment oval guide */}
                        <div className="absolute inset-0 pointer-events-none">
                            <svg viewBox="0 0 300 400" className="absolute inset-0 w-full h-full">
                                {/* Dark overlay with oval cutout */}
                                <defs>
                                    <mask id="oval-mask">
                                        <rect width="300" height="400" fill="white" />
                                        <ellipse cx="150" cy="180" rx="95" ry="120" fill="black" />
                                    </mask>
                                </defs>
                                <rect width="300" height="400" fill="rgba(0,0,0,0.45)" mask="url(#oval-mask)" />
                                {/* Oval border */}
                                <ellipse
                                    cx="150" cy="180" rx="95" ry="120"
                                    fill="none"
                                    stroke={lightingStatus === 'good' ? '#22c55e' : lightingStatus === 'checking' ? 'rgba(255,255,255,0.4)' : '#f59e0b'}
                                    strokeWidth="2"
                                    strokeDasharray={lightingStatus === 'good' ? 'none' : '8 4'}
                                />
                                {/* Corner tick marks */}
                                {lightingStatus === 'good' && (
                                    <>
                                        <line x1="55" y1="175" x2="55" y2="185" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="245" y1="175" x2="245" y2="185" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="145" y1="60" x2="155" y2="60" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="145" y1="300" x2="155" y2="300" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                    </>
                                )}
                            </svg>
                        </div>

                        {/* Countdown overlay */}
                        <AnimatePresence>
                            {countdown !== null && (
                                <motion.div
                                    key={countdown}
                                    initial={{ opacity: 0, scale: 1.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                    <span className="text-8xl font-black text-white drop-shadow-2xl">
                                        {countdown}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Flip camera button */}
                        <button
                            onClick={flipCamera}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Lighting indicator */}
                        {isReady && (
                            <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-sm ${lightingConfig[lightingStatus].bg} ${lightingConfig[lightingStatus].color}`}>
                                {lightingConfig[lightingStatus].icon}
                                {lightingConfig[lightingStatus].label}
                            </div>
                        )}

                        {/* Loading state while camera starts */}
                        {!isReady && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Hidden canvas for frame analysis */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Guidance text */}
            {isReady && !cameraError && (
                <p className="text-white/50 text-sm text-center px-4">
                    {lightingStatus === 'too_dark' && t(lang, 'guidanceDark')}
                    {lightingStatus === 'too_bright' && t(lang, 'guidanceBright')}
                    {lightingStatus === 'good' && t(lang, 'guidanceGood')}
                    {lightingStatus === 'checking' && t(lang, 'guidanceChecking')}
                </p>
            )}

            {/* Controls */}
            {!cameraError && (
                <div className="flex items-center gap-4 w-full">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-2xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
                    >
                        {t(lang, 'cancel')}
                    </button>

                    <button
                        onClick={startCountdown}
                        disabled={!canCapture}
                        className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            canCapture
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg hover:scale-105'
                                : 'bg-zinc-800 text-white/30 cursor-not-allowed'
                        }`}
                    >
                        <Camera className="w-4 h-4" />
                        {countdown !== null ? `${t(lang, 'capturePhoto')} ${countdown}…` : t(lang, 'capturePhoto')}
                    </button>
                </div>
            )}

            {/* Tips */}
            {isReady && !cameraError && (
                <div className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl p-4">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">{t(lang, 'tipTitle')}</p>
                    <ul className="space-y-1">
                        {[
                            t(lang, 'tip1'),
                            t(lang, 'tip2'),
                            t(lang, 'tip3'),
                            t(lang, 'tip4'),
                        ].map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-white/50">
                                <span className="text-red-400 mt-0.5">•</span>
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
