import { Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <Search className="w-16 h-16 text-red-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-extrabold text-white">404</h1>
                    <p className="text-xl font-semibold text-white mt-2">
                        Page not found
                    </p>
                    <p className="text-white/60 text-sm">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="px-6 py-3 bg-red-600 rounded-full text-white font-medium hover:bg-red-500 transition-colors"
                    >
                        Go Home
                    </Link>
                    <Link
                        href="/analyze"
                        className="px-6 py-3 border border-white/20 rounded-full text-white font-medium hover:bg-white/5 transition-colors"
                    >
                        Try Analysis
                    </Link>
                </div>
            </div>
        </div>
    );
}
