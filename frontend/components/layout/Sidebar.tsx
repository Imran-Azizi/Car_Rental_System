'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  LayoutDashboard, Car, FileText, LogOut, X,
  ClipboardList, UserCheck, ChevronRight, Wallet,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard',   exact: true },
  { key: 'carOrder',  icon: ClipboardList,   href: '/orders/new',  prefix: '/orders' },
  { key: 'carOwners', icon: UserCheck,        href: '/car-owners',  prefix: '/car-owners' },
  { key: 'cars',      icon: Car,              href: '/cars',        prefix: '/cars' },
  { key: 'contracts', icon: FileText,         href: '/contracts',   prefix: '/contracts' },
  { key: 'expenses',  icon: Wallet,           href: '/expenses',    prefix: '/expenses' },
] as const;

function isActive(pathname: string, item: typeof navItems[number]): boolean {
  if ('exact' in item && item.exact) return pathname === item.href;
  if ('prefix' in item) return pathname.startsWith(item.prefix);
  return false;
}

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { t, lang, setLang, setToken, setUser } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  };

  const content = (
    <div className="flex flex-col h-full sidebar">
      {/* Logo */}
      <div className="p-5 border-b border-amber-800/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-amber-200 font-bold text-sm leading-tight">مرکز کرایه موتر</h2>
            <p className="text-amber-600 text-xs mt-0.5">افشار</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-900/30'
                  : 'text-amber-400 hover:bg-white/5 hover:text-amber-200'
              }`}>
              <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-150 ${active ? '' : 'group-hover:scale-110'}`} />
              <span className="flex-1">{t[item.key as keyof typeof t] as string}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-amber-800/20 space-y-2">
        {/* Language switcher */}
        <div className="flex gap-1.5 p-1 bg-black/20 rounded-xl">
          {(['dari', 'pashto'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                lang === l
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-500 hover:text-amber-300 hover:bg-white/5'
              }`}>
              {l === 'dari' ? 'دری' : 'پښتو'}
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150">
          <LogOut className="w-4 h-4" />
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0">{content}</div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-64 z-10 shadow-2xl">
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
