'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

const NAV_ITEMS = [
  { label: 'Dashboard',    icon: 'dashboard',              href: '/dashboard' },
  { label: 'Analyze',      icon: 'auto_awesome',           href: '/analyze' },
  { label: 'Wardrobe',     icon: 'inventory_2',            href: '/wardrobe' },
  { label: 'Feed',         icon: 'auto_awesome_motion',    href: '/feed' },
  { label: 'Scanner',      icon: 'qr_code_scanner',        href: '/scan' },
  { label: 'Community',    icon: 'group',                  href: '/community' },
  { label: 'Price Alerts', icon: 'notifications_active',   href: '/price-alerts' },
  { label: 'Account',      icon: 'manage_accounts',        href: '/account' },
];

export default function SideNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      className="hidden lg:flex flex-col w-64 h-[calc(100vh-80px)] sticky top-20 bg-[#111116] border-r border-primary/10 shadow-[40px_0_60px_-15px_rgba(196,151,62,0.05)] py-8 flex-shrink-0"
      aria-label="Side navigation"
    >
      {/* Logo mark */}
      <div className="px-6 mb-8">
        <Link href="/">
          <h2 className="font-display text-3xl font-bold text-primary-container tracking-tighter">
            LUMIQE
          </h2>
        </Link>
        {session?.isPremium && (
          <p className="font-label text-[10px] tracking-[0.2em] text-on-surface-variant/50 uppercase mt-0.5">
            Elite Tier
          </p>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ label, icon, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 px-4 py-3 rounded-r-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#18181F] text-primary font-label font-bold'
                  : 'text-on-surface-variant hover:bg-[#18181F] hover:text-primary font-label'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">
                {icon}
              </span>
              <span className="text-sm tracking-wide">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile mini card */}
      {session?.user && (
        <div className="px-4 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/20">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-sm font-bold text-primary uppercase select-none flex-shrink-0">
              {session.user.name?.[0] ?? session.user.email?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {session.user.name ?? 'User'}
              </p>
              <p className="text-[10px] text-primary">
                {session.isPremium ? 'Gold Member' : 'Free'}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
