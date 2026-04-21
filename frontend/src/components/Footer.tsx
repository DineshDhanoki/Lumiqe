import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="max-w-[1280px] mx-auto px-8 py-12 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-xl font-display italic font-bold text-primary">LUMIQE</div>
            <div className="flex gap-8 font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                <Link href="/science" className="hover:text-primary transition-colors">Science</Link>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
            <p className="text-[10px] font-mono text-on-surface-variant/40">
                &copy; {new Date().getFullYear()} LUMIQE ATELIER. ALL RIGHTS RESERVED.
            </p>
        </footer>
    );
}
