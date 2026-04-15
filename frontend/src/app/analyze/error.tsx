'use client';

import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function AnalyzeError({ error, reset }: ErrorProps) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <span className="material-symbols-outlined text-6xl text-primary">error</span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-on-surface">
                        Analysis Failed
                    </h1>
                    <p className="text-on-surface-variant text-sm">
                        {error.message || 'We could not complete the color analysis. Please try uploading your photo again.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-primary-container rounded-full text-on-primary-container font-medium hover:bg-primary transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 border border-primary/20 rounded-full text-on-surface font-medium hover:bg-surface-container/30 transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
