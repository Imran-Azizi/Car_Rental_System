'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { LayoutDashboard, Car, FileText, LogOut, X, ClipboardList, UserCheck } from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { key: 'carOrder',  icon: ClipboardList,   href: '/orders/new' },
  { key: 'carOwners', icon: UserCheck,        href: '/car-owners' },
  { key: 'cars',      icon: Car,              href: '/cars' },
  { key: 'contracts', icon: FileText,         href: '/contracts' },
];

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { t, lang, setLang, setToken, setUser } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  };

  const content = (
    <div className="flex flex-col h-full sidebar">
      <div className="p-5 border-b border-amber-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)'}}>
            <Car className="w-5 h-5 text-white"/>
          </div>
          <div>
            <h2 className="text-amber-300 font-bold text-sm">مرکز کرایه موتر</h2>
            <p className="text-amber-600 text-xs">افشار</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({key,icon:Icon,href}) => {
          const active = href === '/dashboard' ? pathname === '/dashboard' : href === '/orders/new' ? pathname.startsWith('/orders') : href === '/car-owners' ? pathname.startsWith('/car-owners') : pathname.startsWith(href);
          return (
            <Link key={key} href={href} onClick={()=>setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active?'bg-amber-500 text-white shadow-lg':'text-amber-400 hover:bg-amber-900/40 hover:text-amber-200'}`}>
              <Icon className="w-4 h-4 shrink-0"/>
              <span>{t[key as keyof typeof t] as string}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-amber-800/40 space-y-2">
        <div className="flex gap-2">
          {(['dari','pashto'] as const).map(l => (
            <button key={l} onClick={()=>setLang(l)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${lang===l?'bg-amber-500 text-white':'bg-amber-900/40 text-amber-400 hover:bg-amber-800/40'}`}>
              {l==='dari'?'دری':'پښتو'}
            </button>
          ))}
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all">
          <LogOut className="w-4 h-4"/>
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:flex w-64 shrink-0 h-screen sticky top-0">{content}</div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setOpen(false)}/>
          <div className="absolute right-0 top-0 h-full w-64 z-10">
            {content}
            <button onClick={()=>setOpen(false)} className="absolute top-4 left-4 text-amber-400"><X className="w-5 h-5"/></button>
          </div>
        </div>
      )}
    </>
  );
}
