'use client';

import { type ReactNode } from 'react';
import TopBar from './TopBar';
import SideNav from './SideNav';
import BottomTabNav from './BottomTabNav';

interface AppLayoutProps {
  children: ReactNode;
}

/**
 * AppLayout — wraps all authenticated app pages.
 *
 * Layout structure:
 *   TopBar (fixed, h-20, full width)
 *   └── flex row below:
 *       ├── SideNav (desktop only, w-64, sticky)
 *       └── <main> (flex-1, scrollable)
 *   BottomTabNav (mobile only, fixed bottom)
 *
 * Usage: Wrap any authenticated page component with <AppLayout>.
 * During migration, pages import this directly. Later, a route-group
 * layout at src/app/(app)/layout.tsx can be used instead.
 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      {/* Content row — sits below fixed TopBar */}
      <div className="flex pt-20">
        <SideNav />

        {/* Main scrollable area */}
        <main
          id="main-content"
          role="main"
          className="flex-1 min-w-0 overflow-x-hidden px-4 sm:px-6 lg:px-10 py-8 pb-32 lg:pb-10"
        >
          {children}
        </main>
      </div>

      <BottomTabNav />
    </div>
  );
}
