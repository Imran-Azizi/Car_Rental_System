'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '@/lib/context';

function AppSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* Sidebar skeleton — matches w-72 */}
      <div className="hidden lg:flex w-72 shrink-0 h-screen animate-pulse"
        style={{ background: 'linear-gradient(180deg,#1a1a2e 0%,#16213e 65%,#0f3460 100%)' }}>
        <div className="flex flex-col w-full p-4 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/25 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-white/20 rounded w-3/4" />
              <div className="h-2 bg-amber-400/25 rounded w-1/3" />
            </div>
          </div>
          {/* Nav items */}
          <div className="space-y-1.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-white border-b border-amber-100 animate-pulse" />
        <div className="flex-1 p-5 md:p-6 space-y-5 animate-pulse">
          <div className="h-8 bg-amber-100 rounded-xl w-1/4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-amber-50 rounded-2xl border border-amber-100" />
            ))}
          </div>
          <div className="h-64 bg-amber-50 rounded-2xl border border-amber-100" />
        </div>
      </div>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isHydrated } = useApp();

  if (!isHydrated) return <AppSkeleton />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
