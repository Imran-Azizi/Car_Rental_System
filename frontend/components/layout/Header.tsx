'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/lib/context';
import { draftsAPI } from '@/lib/api';
import { Menu, FileEdit } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { t, user, token, lang } = useApp();
  const [draftCount, setDraftCount] = useState(0);
  const initials = user?.name ? user.name.trim().charAt(0) : 'م';

  const fetchDraftCount = useCallback(() => {
    if (!token) return;
    draftsAPI.getAll()
      .then(res => setDraftCount(res.data.data?.length ?? 0))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchDraftCount();
    // Refresh count every 2 minutes in background
    const interval = setInterval(fetchDraftCount, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDraftCount]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-amber-100 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-amber-700 hover:bg-amber-50 active:bg-amber-100 transition-colors"
          aria-label="Toggle menu">
          <Menu className="w-5 h-5" />
        </button>
        {/* Logo — visible on mobile only (desktop logo lives in sidebar) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: '#fff', border: '1.5px solid #fde68a' }}>
            <Image
              src="/logo.png"
              alt="افشار"
              width={28}
              height={28}
              className="object-contain w-full h-full"
            />
          </div>
          <span className="text-sm font-bold text-amber-900 tracking-wide">افشار</span>
        </div>
        {/* Desktop: text only (logo is in sidebar) */}
        <h1 className="text-base font-bold text-amber-900 hidden lg:block tracking-wide">
          {t.appName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Drafts notification button */}
        {token && (
          <Link
            href="/orders/drafts"
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 active:bg-amber-200 transition-all text-amber-800 group"
            title={lang === 'dari' ? 'پیش‌نویس‌های سفارش' : 'د سفارش مسودې'}
          >
            <FileEdit className="w-4 h-4 text-amber-600 group-hover:text-amber-700 transition-colors" />
            <span className="text-sm font-medium hidden sm:block">
              {lang === 'dari' ? 'پیش‌نویس‌ها' : 'مسودې'}
            </span>
            {draftCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {draftCount > 9 ? '9+' : draftCount}
              </span>
            )}
          </Link>
        )}

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
      </div>
    </header>
  );
}
