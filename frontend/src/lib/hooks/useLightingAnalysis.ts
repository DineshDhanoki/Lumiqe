import { useState, useEffect, useRef, type RefObject } from 'react';

type LightingStatus = 'good' | 'dark' | 'bright' | 'checking';

interface UseLightingAnalysisReturn {
    brightness: number;
    variance: number;
    lightingStatus: LightingStatus;
    hasFace: boolean;
}

const DARK_THRESHOLD = 80;
const BRIGHT_THRESHOLD = 200;
const FACE_VARIANCE_THRESHOLD = 200;
const ANALYSIS_INTERVAL_MS = 500;

function computeBrightnessAndVariance(
    imageData: ImageData,
): { brightness: number; variance: number } {
    const data = imageData.data;
    const pixelCount = data.length / 4;

    if (pixelCount === 0) {
        return { brightness: 0, variance: 0 };
    }

    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += luminance;
    }

    const meanBrightness = totalBrightness / pixelCount;

    let totalVariance = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const diff = luminance - meanBrightness;
        totalVariance += diff * diff;
    }

    const variance = totalVariance / pixelCount;

    return { brightness: Math.round(meanBrightness), variance: Math.round(variance) };
}

function deriveLightingStatus(brightness: number): LightingStatus {
    if (brightness < DARK_THRESHOLD) {
        return 'dark';
    }
    if (brightness > BRIGHT_THRESHOLD) {
        return 'bright';
    }
    return 'good';
}

function useLightingAnalysis(
    videoRef: RefObject<HTMLVideoElement | null>,
): UseLightingAnalysisReturn {
    const [brightness, setBrightness] = useState<number>(0);
    const [variance, setVariance] = useState<number>(0);
    const [lightingStatus, setLightingStatus] = useState<LightingStatus>('checking');
    const [hasFace, setHasFace] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        function analyze(): void {
            const video = videoRef.current;
            if (!video || video.readyState < video.HAVE_CURRENT_DATA) {
                return;
            }

            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                return;
            }

            const width = video.videoWidth;
            const height = video.videoHeight;
            if (width === 0 || height === 0) {
                return;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const result = computeBrightnessAndVariance(imageData);

            setBrightness(result.brightness);
            setVariance(result.variance);
            setLightingStatus(deriveLightingStatus(result.brightness));
            setHasFace(result.variance > FACE_VARIANCE_THRESHOLD);
        }

        intervalId = setInterval(analyze, ANALYSIS_INTERVAL_MS);

        return () => {
            if (intervalId !== null) {
                clearInterval(intervalId);
            }
        };
    }, [videoRef]);

    return { brightness, variance, lightingStatus, hasFace };
}

export { useLightingAnalysis };
export type { UseLightingAnalysisReturn, LightingStatus };
