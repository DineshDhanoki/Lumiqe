'use client';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h1 className="text-2xl font-bold text-white">Quiz Error</h1>
                <p className="text-white/60">{error.message || 'Something went wrong loading the quiz.'}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={reset} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">
                        Try Again
                    </button>
                    <Link href="/" className="px-6 py-3 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
