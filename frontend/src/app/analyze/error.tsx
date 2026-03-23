'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function AnalyzeError({ error, reset }: ErrorProps) {
    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <AlertCircle className="w-16 h-16 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">
                        Analysis Failed
                    </h1>
                    <p className="text-white/60 text-sm">
                        {error.message || 'We could not complete the color analysis. Please try uploading your photo again.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-3 border border-white/20 rounded-full text-white font-medium hover:bg-white/5 transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
