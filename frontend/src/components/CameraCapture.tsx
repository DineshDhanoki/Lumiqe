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

const CAPTURE_COUNTDOWN = 3;
const HOLD_STILL_DELAY_MS = 1500;

export default function CameraCapture({ onCapture, onCancel, lang = 'en' }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const analysisTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const holdStillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [cameraError, setCameraError] = useState<string | null>(null);
    const [lightingStatus, setLightingStatus] = useState<LightingStatus>('checking');
    const [faceDetected, setFaceDetected] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showFlash, setShowFlash] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [isReady, setIsReady] = useState(false);
    const [heldStill, setHeldStill] = useState(false);
    const [brightnessLevel, setBrightnessLevel] = useState(128);

    const startCamera = useCallback(async (mode: 'user' | 'environment') => {
        // Stop existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        setCameraError(null);
        setIsReady(false);
        setLightingStatus('checking');
        setFaceDetected(false);
        setHeldStill(false);

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
            if (holdStillTimerRef.current) {
                clearTimeout(holdStillTimerRef.current);
            }
        };
    }, [facingMode, startCamera]);

    // Real-time frame analysis for lighting quality and face detection
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
            setBrightnessLevel(Math.round(avgBrightness));

            if (avgBrightness < 55) {
                setLightingStatus('too_dark');
            } else if (avgBrightness > 210) {
                setLightingStatus('too_bright');
            } else {
                setLightingStatus('good');
            }

            // Face presence heuristic: compute pixel variance in center region
            let sumSquaredDiff = 0;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const diff = brightness - avgBrightness;
                sumSquaredDiff += diff * diff;
            }
            const variance = sumSquaredDiff / pixelCount;
            setFaceDetected(variance > 200);
        }, 500);

        return () => {
            if (analysisTimerRef.current) clearInterval(analysisTimerRef.current);
        };
    }, [isReady]);

    // "Hold still" timer: when face is detected + lighting is good for 1.5s, mark as held still
    useEffect(() => {
        if (faceDetected && lightingStatus === 'good') {
            holdStillTimerRef.current = setTimeout(() => {
                setHeldStill(true);
            }, HOLD_STILL_DELAY_MS);
        } else {
            setHeldStill(false);
            if (holdStillTimerRef.current) {
                clearTimeout(holdStillTimerRef.current);
                holdStillTimerRef.current = null;
            }
        }
        return () => {
            if (holdStillTimerRef.current) {
                clearTimeout(holdStillTimerRef.current);
            }
        };
    }, [faceDetected, lightingStatus]);

    const flipCamera = async () => {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        await startCamera(newMode);
    };

    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;

        // Flash effect
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 300);

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

    const lightingConfig = {
        good: { color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30', icon: <CheckCircle2 className="w-4 h-4" />, label: t(lang, 'goodLighting') },
        too_dark: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', icon: <Sun className="w-4 h-4" />, label: t(lang, 'tooDark') },
        too_bright: { color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', icon: <Zap className="w-4 h-4" />, label: t(lang, 'tooBright') },
        checking: { color: 'text-white/40', bg: 'bg-white/5 border-white/10', icon: <Camera className="w-4 h-4" />, label: t(lang, 'checkingLight') },
    };

    const canCapture = faceDetected && lightingStatus === 'good' && isReady && countdown === null;

    // Derive oval stroke color from detection state
    const getOvalStroke = (): string => {
        if (lightingStatus === 'checking') return 'rgba(255,255,255,0.4)';
        if (lightingStatus === 'too_dark' || lightingStatus === 'too_bright') return '#f59e0b';
        if (faceDetected) return '#22c55e';
        return '#ffffff';
    };

    // Compute lighting bar percentage (0-100, where 50 is ideal)
    const lightingBarPercent = Math.min(100, Math.max(0, (brightnessLevel / 255) * 100));
    const lightingBarColor = lightingStatus === 'good'
        ? 'bg-green-400'
        : lightingStatus === 'too_dark'
            ? 'bg-yellow-400'
            : lightingStatus === 'too_bright'
                ? 'bg-orange-400'
                : 'bg-white/30';

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
                            aria-label="Camera viewfinder"
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />

                        {/* Face alignment oval guide with SVG overlay */}
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

                                {/* Pulsing ring animation when face is detected */}
                                {faceDetected && lightingStatus === 'good' && (
                                    <ellipse
                                        cx="200" cy="220" rx="120" ry="160"
                                        fill="none"
                                        stroke="#22c55e"
                                        strokeWidth="1"
                                        opacity="0.4"
                                    >
                                        <animate
                                            attributeName="rx"
                                            values="120;130;120"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                        <animate
                                            attributeName="ry"
                                            values="160;170;160"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                        <animate
                                            attributeName="opacity"
                                            values="0.4;0;0.4"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                    </ellipse>
                                )}

                                {/* Main oval border */}
                                <ellipse
                                    cx="200" cy="220" rx="120" ry="160"
                                    fill="none"
                                    stroke={getOvalStroke()}
                                    strokeWidth="2.5"
                                    strokeDasharray={faceDetected && lightingStatus === 'good' ? 'none' : '8 4'}
                                />

                                {/* Corner tick marks when face detected + good lighting */}
                                {faceDetected && lightingStatus === 'good' && (
                                    <>
                                        <line x1="80" y1="215" x2="80" y2="225" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="320" y1="215" x2="320" y2="225" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="195" y1="60" x2="205" y2="60" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="195" y1="380" x2="205" y2="380" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                                    </>
                                )}

                                {/* Guide text below oval */}
                                <text
                                    x="200" y="420"
                                    textAnchor="middle"
                                    fill="rgba(255,255,255,0.6)"
                                    fontSize="14"
                                    fontFamily="system-ui, sans-serif"
                                >
                                    {faceDetected && lightingStatus === 'good'
                                        ? ''
                                        : 'Position your face in the oval'}
                                </text>
                            </svg>
                        </div>

                        {/* "Hold still" / "Perfect" feedback badge */}
                        <AnimatePresence>
                            {isReady && faceDetected && lightingStatus === 'good' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40 backdrop-blur-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 text-xs font-semibold">
                                        {heldStill ? 'Perfect! Hold still...' : 'Face detected — hold still'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Lighting-specific guidance badges */}
                        <AnimatePresence>
                            {isReady && lightingStatus === 'too_dark' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/40 backdrop-blur-sm"
                                >
                                    <Sun className="w-4 h-4 text-yellow-400" />
                                    <span className="text-yellow-400 text-xs font-semibold">
                                        Move closer to a window
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {isReady && lightingStatus === 'too_bright' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 backdrop-blur-sm"
                                >
                                    <Zap className="w-4 h-4 text-orange-400" />
                                    <span className="text-orange-400 text-xs font-semibold">
                                        Move away from the light source
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Countdown overlay */}
                        <AnimatePresence>
                            {countdown !== null && (
                                <motion.div
                                    key={countdown}
                                    initial={{ opacity: 0, scale: 1.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                >
                                    <span className="text-9xl font-black text-white drop-shadow-2xl"
                                        style={{ textShadow: '0 0 40px rgba(255,255,255,0.3)' }}
                                    >
                                        {countdown}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Flash effect on capture */}
                        <AnimatePresence>
                            {showFlash && (
                                <motion.div
                                    initial={{ opacity: 0.9 }}
                                    animate={{ opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 bg-white pointer-events-none"
                                />
                            )}
                        </AnimatePresence>

                        {/* Flip camera button */}
                        <button
                            onClick={flipCamera}
                            aria-label="Flip camera"
                            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Lighting indicator badge */}
                        {isReady && (
                            <div aria-live="polite" role="status" className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-sm ${lightingConfig[lightingStatus].bg} ${lightingConfig[lightingStatus].color}`}>
                                {lightingConfig[lightingStatus].icon}
                                {lightingConfig[lightingStatus].label}
                            </div>
                        )}

                        {/* Real-time lighting quality bar */}
                        {isReady && (
                            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider w-8 shrink-0">Dark</span>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${lightingBarColor}`}
                                        style={{ width: `${lightingBarPercent}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider w-10 shrink-0 text-right">Bright</span>
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
                    {lightingStatus === 'good' && !faceDetected && 'Center your face in the oval above'}
                    {lightingStatus === 'good' && faceDetected && t(lang, 'guidanceGood')}
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
            )}

            {/* Inline keyframe animation for the capture button glow */}
            <style>{`
                @keyframes captureGlow {
                    0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2); }
                    50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3); }
                }
            `}</style>

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
