import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCameraStreamReturn {
    stream: MediaStream | null;
    error: string | null;
    isActive: boolean;
    startCamera: (facingMode?: string) => Promise<MediaStream>;
    stopCamera: () => void;
}

function useCameraStream(): UseCameraStreamReturn {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState<boolean>(false);
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });
            streamRef.current = null;
        }
        setStream(null);
        setIsActive(false);
        setError(null);
    }, []);

    const startCamera = useCallback(
        async (facingMode?: string): Promise<MediaStream> => {
            stopCamera();
            setError(null);

            try {
                const constraints: MediaStreamConstraints = {
                    video: {
                        facingMode: facingMode ?? 'user',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                };

                const mediaStream =
                    await navigator.mediaDevices.getUserMedia(constraints);

                streamRef.current = mediaStream;
                setStream(mediaStream);
                setIsActive(true);

                return mediaStream;
            } catch (err: unknown) {
                let message = 'Failed to access camera';
                if (err instanceof DOMException) {
                    if (err.name === 'NotAllowedError') {
                        message = 'Camera permission was denied';
                    } else if (err.name === 'NotFoundError') {
                        message = 'No camera found on this device';
                    } else if (err.name === 'NotReadableError') {
                        message = 'Camera is already in use by another application';
                    }
                }
                setError(message);
                setIsActive(false);
                throw new Error(message);
            }
        },
        [stopCamera],
    );

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });
                streamRef.current = null;
            }
        };
    }, []);

    return { stream, error, isActive, startCamera, stopCamera };
}

export { useCameraStream };
export type { UseCameraStreamReturn };
