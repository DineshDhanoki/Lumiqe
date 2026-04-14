'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Home',     icon: 'home',              href: '/dashboard' },
  { label: 'Wardrobe', icon: 'checkroom',          href: '/wardrobe' },
  { label: 'Scan',     icon: 'document_scanner',   href: '/scan' },
  { label: 'Feed',     icon: 'shopping_bag',       href: '/feed' },
  { label: 'Social',   icon: 'forum',              href: '/community' },
];

export default function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-[env(safe-area-inset-bottom,1.5rem)] pt-3 lg:hidden bg-background/90 backdrop-blur-xl border-t border-primary/15 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-[24px]"
      aria-label="Bottom navigation"
    >
      {TABS.map(({ label, icon, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] active:scale-95 transition-all duration-150 ${
              isActive ? 'text-primary' : 'text-white/30 hover:text-white/60'
            }`}
            aria-label={label}
          >
            <span
              className="material-symbols-outlined text-[22px] leading-none"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden="true"
            >
              {icon}
            </span>
            <span className="font-label text-[9px] font-semibold uppercase tracking-tight">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
