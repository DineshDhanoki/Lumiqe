import Link from 'next/link';

export default function NotFound() {
    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
            {/* Ambient glow */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            {/* Large ghost 404 background text */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0">
                <h1 className="font-display italic text-[40vw] leading-none text-primary opacity-[0.03] tracking-tighter">404</h1>
            </div>

            {/* Main content card */}
            <div className="relative z-10 max-w-xl w-full px-6">
                <div
                    className="ghost-border bg-surface-container/60 backdrop-blur-xl p-12 md:p-20 flex flex-col items-center text-center rounded-[24px]"
                    style={{ boxShadow: '0 -10px 40px rgba(196,151,62,0.03)' }}
                >
                    {/* Brand anchor */}
                    <div className="mb-12">
                        <span className="font-display italic text-3xl tracking-tighter text-primary">Lumiqe</span>
                    </div>

                    {/* Editorial headline */}
                    <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-on-surface mb-6 tracking-tight">
                        The atelier is lost
                    </h2>

                    {/* Error description */}
                    <div className="space-y-4 mb-12">
                        <p className="text-on-surface-variant font-light text-lg leading-relaxed max-w-md">
                            The silhouette you are seeking has vanished from our seasonal archive. Perhaps the thread was broken or the collection has moved.
                        </p>
                        <p className="font-mono text-[10px] text-primary uppercase tracking-[0.2em] opacity-60">
                            Error Code: 0x404_NULL_REFERENCE
                        </p>
                    </div>

                    {/* Action button */}
                    <Link
                        href="/"
                        className="group relative inline-flex items-center justify-center px-10 py-4 bg-primary-container hover:bg-primary-container/90 text-on-primary font-headline font-bold text-xs uppercase tracking-widest transition-all duration-300 rounded-[10px]"
                    >
                        <span className="relative z-10">Return to Atelier</span>
                    </Link>

                    {/* Fine print link */}
                    <div className="mt-12">
                        <Link
                            href="/"
                            className="font-label text-[10px] text-on-surface-variant/50 hover:text-primary uppercase tracking-widest transition-colors duration-300"
                        >
                            Contact Style Concierge
                        </Link>
                    </div>
                </div>
            </div>

            {/* Decorative ghost fabric image bottom-right */}
            <div className="absolute bottom-0 right-0 w-1/3 h-1/2 opacity-20 pointer-events-none z-0 hidden lg:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt="Luxury fashion"
                    className="w-full h-full object-cover grayscale brightness-50"
                    src="/404-fabric.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-l from-background via-transparent to-transparent" />
            </div>
        </main>
    );
}
