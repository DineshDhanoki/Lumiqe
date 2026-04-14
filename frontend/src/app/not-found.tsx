import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8">
                {/* Editorial 404 heading */}
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-primary/60 mb-4">
                        Error 404
                    </p>
                    <h1 className="font-display text-[8rem] font-bold text-on-surface leading-none tracking-tighter">
                        404
                    </h1>
                    <p className="font-headline text-xl font-semibold text-on-surface mt-2">
                        The Atelier is Lost
                    </p>
                    <p className="text-on-surface-variant text-sm mt-3 leading-relaxed max-w-xs mx-auto">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-label font-bold text-sm tracking-widest uppercase hover:bg-primary transition-colors"
                    >
                        Return Home
                    </Link>
                    <Link
                        href="/analyze"
                        className="px-6 py-3 border border-outline-variant rounded-full text-on-surface-variant font-label font-medium text-sm hover:border-primary/40 hover:text-on-surface transition-colors ghost-border"
                    >
                        Start Analysis
                    </Link>
                </div>
            </div>
        </div>
    );
}
