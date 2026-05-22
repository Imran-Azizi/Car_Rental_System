'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Car, FileText, LogOut, Menu, X, ChevronLeft } from 'lucide-react';
import { ownerAuthAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const navItems = [
  { href: '/owner/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/owner/cars', label: 'موترهای من', icon: Car },
  { href: '/owner/contracts', label: 'قراردادها', icon: FileText },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [owner, setOwner] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('ownerToken');
    const user = localStorage.getItem('ownerUser');
    if (!token) { router.replace('/owner-login'); return; }
    if (user) setOwner(JSON.parse(user));
  }, []);

  const handleLogout = async () => {
    try { await ownerAuthAPI.logout(); } catch {}
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerUser');
    router.push('/owner-login');
  };

  if (!mounted) return null;

  const photoUrl = owner?.photo ? `${API_URL}${owner.photo}` : null;

  return (
    <div className="min-h-screen flex" dir="rtl"
      style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #fffbf0 100%)', fontFamily: "'Vazirmatn', sans-serif" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-64 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', boxShadow: '-4px 0 20px rgba(0,0,0,0.3)' }}>

        {/* Sidebar Header */}
        <div className="p-5 border-b" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-amber-400 text-xs font-medium tracking-wide uppercase">پنل صاحب موتر</span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img src={photoUrl} alt={owner?.fullName} className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400/40" />
            ) : (
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                {owner?.fullName?.[0] || 'م'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{owner?.fullName || 'صاحب موتر'}</p>
              <p className="text-amber-300/60 text-xs" dir="ltr">{owner?.phoneNumber || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))', borderLeft: '3px solid #f59e0b' } : {}}>
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginRight: '256px' }}
        data-sidebar-width="256">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b"
          style={{ background: 'rgba(255,251,240,0.95)', backdropFilter: 'blur(8px)', borderColor: '#fde68a', boxShadow: '0 1px 8px rgba(245,158,11,0.08)' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-amber-700 hover:bg-amber-100">
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-amber-500 font-medium">مرکز کرایه موتر افشار</span>
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span className="text-amber-900 font-semibold">
              {navItems.find(n => n.href === pathname)?.label || 'پنل'}
            </span>
          </div>

          {/* Owner badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              {owner?.fullName?.[0] || 'م'}
            </div>
            <span className="text-amber-800 text-sm font-medium hidden sm:inline">{owner?.fullName}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile sidebar toggle (visible on mobile when sidebar is closed) */}
      <style>{`
        @media (max-width: 1024px) {
          [data-sidebar-width] { margin-right: 0 !important; }
        }
      `}</style>
    </div>
  );
}
