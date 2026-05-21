'use client';
import { useApp } from '@/lib/context';
import { Menu } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { t, user } = useApp();
  const initials = user?.name
    ? user.name.trim().charAt(0)
    : 'م';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-amber-100 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-amber-700 hover:bg-amber-50 active:bg-amber-100 transition-colors"
          aria-label="Toggle menu">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-amber-900 hidden lg:block tracking-wide">
          {t.appName}
        </h1>
      </div>

      {/* User pill */}
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 cursor-default select-none">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
          {initials}
        </div>
        <span className="text-sm font-medium text-amber-800 hidden sm:block">
          {user?.name || 'مدیر'}
        </span>
      </div>
    </header>
  );
}
