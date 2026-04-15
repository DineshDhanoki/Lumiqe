'use client';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-6">
                <span className="material-symbols-outlined text-6xl text-primary block mx-auto">error</span>
                <h1 className="text-2xl font-bold text-on-surface">Quiz Error</h1>
                <p className="text-on-surface-variant">{error.message || 'Something went wrong loading the quiz.'}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={reset} className="px-6 py-3 bg-primary-container hover:bg-primary text-on-primary-container rounded-xl font-semibold transition-colors">
                        Try Again
                    </button>
                    <Link href="/" className="px-6 py-3 border border-primary/20 text-on-surface rounded-xl font-semibold hover:bg-surface-container/30 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
