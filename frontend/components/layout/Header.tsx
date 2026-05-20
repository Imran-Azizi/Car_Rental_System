'use client';
import { useApp } from '@/lib/context';
import { Menu, Bell } from 'lucide-react';

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { t, user } = useApp();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 border-b border-amber-200" style={{background:'linear-gradient(135deg,#fffdf0,#fef9c3)'}}>
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors">
        <Menu className="w-5 h-5"/>
      </button>
      <div className="flex-1 lg:flex-none">
        <h1 className="text-lg font-bold text-amber-900 hidden lg:block">{t.appName}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors">
          <Bell className="w-5 h-5"/>
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}>
            {user?.name?.charAt(0) || 'م'}
          </div>
          <span className="text-sm font-medium text-amber-800 hidden sm:block">{user?.name || 'مدیر'}</span>
        </div>
      </div>
    </header>
  );
}
