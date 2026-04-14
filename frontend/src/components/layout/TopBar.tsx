'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Bell, LogOut, Shield, Menu } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

export default function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { data: session } = useSession();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-between px-6 bg-background/80 backdrop-blur-lg border-b border-primary/10"
      role="navigation"
      aria-label="Top navigation"
    >
      {/* Logo — visible on mobile; hidden on lg (sidebar shows it) */}
      <Link href="/" className="lg:hidden">
        <span className="font-display text-2xl font-bold tracking-tighter text-primary-container">
          LUMIQE
        </span>
      </Link>

      {/* Spacer for desktop — sidebar takes up w-64 */}
      <div className="hidden lg:block w-64" />

      {/* Right side actions */}
      <div className="flex items-center gap-3 ml-auto">
        {session && (
          <>
            <NotificationBell />

            {session.isAdmin && (
              <Link
                href="/admin"
                aria-label="Admin panel"
                className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Shield className="w-5 h-5" />
              </Link>
            )}

            <Link
              href="/account"
              aria-label="Account settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              {/* Avatar placeholder / initial */}
              <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs font-label font-bold text-primary uppercase select-none">
                {session.user?.name?.[0] ?? session.user?.email?.[0] ?? 'U'}
              </span>
              <span className="hidden sm:block text-xs font-label font-semibold text-on-surface-variant max-w-[100px] truncate">
                {session.user?.name ?? session.user?.email}
              </span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              aria-label="Log out"
              className="p-2 rounded-full text-on-surface-variant/50 hover:text-tertiary hover:bg-tertiary/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Mobile hamburger — shows on lg:hidden pages that need it */}
        {onMobileMenuToggle && (
          <button
            className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface transition-colors"
            onClick={onMobileMenuToggle}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>
    </nav>
  );
}
