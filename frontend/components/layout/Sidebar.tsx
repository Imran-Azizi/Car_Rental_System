'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  LayoutDashboard, Car, FileText, LogOut, X,
  ClipboardList, UserCheck, ChevronRight, Wallet,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard',  exact: true },
  { key: 'carOrder',  icon: ClipboardList,   href: '/orders/new', prefix: '/orders/new' },
  { key: 'allOrders', icon: FileText,        href: '/orders',     exact: true },
  { key: 'carOwners', icon: UserCheck,       href: '/car-owners', prefix: '/car-owners' },
  { key: 'cars',      icon: Car,             href: '/cars',       prefix: '/cars' },
  { key: 'expenses',  icon: Wallet,          href: '/expenses',   prefix: '/expenses' },
] as const;

const SIDEBAR_W = 'w-72';

function isActive(pathname: string, item: typeof navItems[number]): boolean {
  if ('exact' in item && item.exact) return pathname === item.href;
  if ('prefix' in item) return pathname.startsWith(item.prefix);
  return false;
}

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { t, lang, setLang, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const content = (
    <div className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)', boxShadow: '-4px 0 20px rgba(0,0,0,0.3)' }}>

      {/* Logo / Brand */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">مرکز کرایه موتر</h2>
            <p className="text-amber-400 text-xs mt-0.5 font-medium">افشار — پنل ادمین</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active ? 'text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={active ? { background: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(217,119,6,0.15))', borderLeft: '3px solid #f59e0b' } : {}}>
              <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-150 ${active ? '' : 'group-hover:scale-110'}`} />
              <span className="flex-1">{t[item.key as keyof typeof t] as string}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
        {/* Language switcher */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.25)' }}>
          {(['dari', 'pashto'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                lang === l ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-400 hover:text-amber-200 hover:bg-white/5'
              }`}>
              {l === 'dari' ? 'دری' : 'پښتو'}
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
          <LogOut className="w-5 h-5" />
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex ${SIDEBAR_W} shrink-0 h-screen sticky top-0`}>{content}</div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className={`absolute right-0 top-0 h-full ${SIDEBAR_W} z-10 shadow-2xl`}>
            {content}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
