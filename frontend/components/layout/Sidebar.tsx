'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  LayoutDashboard, Car, FileText, LogOut, X,
  ClipboardList, UserCheck, Wallet, Phone, ShieldCheck,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, href: '/dashboard',  exact: true },
  { key: 'carOrder',  icon: ClipboardList,   href: '/orders/new', prefix: '/orders/new' },
  { key: 'allOrders', icon: FileText,        href: '/orders',     exact: true },
  { key: 'carOwners', icon: UserCheck,       href: '/car-owners', prefix: '/car-owners' },
  { key: 'cars',      icon: Car,             href: '/cars',       prefix: '/cars' },
  { key: 'expenses',  icon: Wallet,          href: '/expenses',   prefix: '/expenses' },
] as const;

export const SIDEBAR_W = 'w-72'; /* 288 px */

const BG = 'linear-gradient(175deg,#111827 0%,#1e2d45 55%,#0f3460 100%)';

function isActive(p: string, item: typeof navItems[number]) {
  if ('exact' in item && item.exact) return p === item.href;
  if ('prefix' in item) return p.startsWith(item.prefix);
  return false;
}

/* ─── reusable inner sections ─────────────────────────────── */

function Brand({ lang }: { lang: string }) {
  return (
    <div className="px-5 pt-6 pb-5 shrink-0 border-b"
      style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0"
          style={{
            background: '#fff', padding: '3px',
            border: '2px solid rgba(245,158,11,0.45)',
            boxShadow: '0 4px 14px rgba(245,158,11,0.22)',
          }}>
          <Image src="/logo.png" alt="افشار" width={40} height={40}
            className="object-contain w-full h-full" priority />
        </div>
        <div>
          <p className="text-white font-bold text-[15px] leading-snug">مرکز کرایه موتر</p>
          <p className="text-amber-400 text-sm font-semibold">افشار</p>
          <p className="text-white/35 text-[11px] mt-0.5">پنل مدیریت</p>
        </div>
      </div>
    </div>
  );
}

function NavLabel({ lang }: { lang: string }) {
  return (
    <p className="px-5 pt-5 pb-2 shrink-0 text-[10px] font-bold tracking-[0.13em] uppercase"
      style={{ color: 'rgba(245,158,11,0.45)' }}>
      {lang === 'dari' ? 'ناوبری' : 'نیویګیشن'}
    </p>
  );
}

function NavItems({ pathname, t, setOpen }: {
  pathname: string;
  t: any;
  setOpen: (v: boolean) => void;
}) {
  return (
    <nav className="px-3 shrink-0 space-y-0.5">
      {navItems.map(item => {
        const active = isActive(pathname, item);
        return (
          <Link key={item.key} href={item.href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3.5 px-4 py-[11px] rounded-xl text-[13.5px] font-medium transition-all duration-150 group ${
              active ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
            }`}
            style={active ? {
              background: 'linear-gradient(135deg,rgba(245,158,11,0.20),rgba(217,119,6,0.10))',
              borderRight: '3px solid #f59e0b',
              paddingRight: 'calc(1rem - 3px)',
            } : {}}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
              active ? 'bg-amber-500/20' : 'group-hover:bg-white/[0.07]'
            }`}>
              <item.icon className={`w-[17px] h-[17px] transition-colors ${
                active ? 'text-amber-400' : 'text-white/45 group-hover:text-white/80'
              }`} />
            </div>
            <span className="flex-1 leading-none">{t[item.key as keyof typeof t] as string}</span>
            {active && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
          </Link>
        );
      })}
    </nav>
  );
}

function FillCard({ lang }: { lang: string }) {
  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-4 overflow-hidden">
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg,rgba(245,158,11,0.08),rgba(15,52,96,0.55))',
          border: '1px solid rgba(245,158,11,0.18)',
        }}>
        {/* Amber top stripe */}
        <div className="h-[3px]"
          style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706,#92400e)' }} />

        <div className="px-4 py-5 flex flex-col items-center gap-3 text-center">
          {/* Logo */}
          <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden"
            style={{
              background: '#fff', padding: '3px',
              border: '2px solid rgba(245,158,11,0.35)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
            }}>
            <Image src="/logo.png" alt="افشار" width={50} height={50}
              className="object-contain w-full h-full" />
          </div>

          {/* Title */}
          <div>
            <p className="text-white font-bold text-sm leading-snug">مرکز کرایه موتر افشار</p>
            <p className="mt-1 text-[11px]" style={{ color: 'rgba(251,191,36,0.65)' }}>
              {lang === 'dari' ? 'سیستم مدیریت هوشمند' : 'هوښمند مدیریت سیستم'}
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px" style={{ background: 'rgba(245,158,11,0.14)' }} />

          {/* Contact */}
          <div className="space-y-1.5 w-full">
            {['0783 945 133', '0773 492 040'].map(num => (
              <div key={num} className="flex items-center justify-center gap-2"
                style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                <Phone className="w-3 h-3 shrink-0" style={{ color: 'rgba(245,158,11,0.55)' }} />
                <span dir="ltr">{num}</span>
              </div>
            ))}
          </div>

          {/* Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.22)',
              fontSize: '10px', fontWeight: 700,
              color: 'rgba(251,191,36,0.80)',
            }}>
            <ShieldCheck className="w-3 h-3 shrink-0" />
            {lang === 'dari' ? 'پنل ادمین' : 'د ادمین پینل'}
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomSection({
  lang, setLang, user, onLogout, logoutLabel,
}: {
  lang: string;
  setLang: (l: 'dari' | 'pashto') => void;
  user: any;
  onLogout: () => void;
  logoutLabel: string;
}) {
  return (
    <div className="shrink-0 px-4 pb-4 pt-1 border-t space-y-2.5"
      style={{ borderColor: 'rgba(245,158,11,0.12)' }}>

      {/* Language switcher */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl" style={{ background: 'rgba(0,0,0,0.30)' }}>
        {(['dari', 'pashto'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
              lang === l ? 'bg-amber-500 text-white shadow-md' : 'text-amber-400/60 hover:text-amber-300 hover:bg-white/[0.06]'
            }`}>
            {l === 'dari' ? 'دری' : 'پښتو'}
          </button>
        ))}
      </div>

      {/* User strip */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
          {user?.name?.charAt(0) || 'م'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate leading-none">
            {user?.name || 'مدیر سیستم'}
          </p>
          <p className="text-white/35 text-[10px] mt-0.5 leading-none">ادمین</p>
        </div>
      </div>

      {/* Logout */}
      <button onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-[11px] rounded-xl text-[13px] font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 group">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-red-500/15 transition-colors shrink-0">
          <LogOut className="w-[17px] h-[17px]" />
        </div>
        <span>{logoutLabel}</span>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════ */
export default function Sidebar({ open, setOpen }: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { t, lang, setLang, logout, user } = useApp();
  const pathname = usePathname();
  const router   = useRouter();
  const handleLogout = async () => { await logout(); router.push('/'); };

  /* Shared props */
  const shared = { lang, t, pathname, setOpen, user, onLogout: handleLogout, logoutLabel: t.logout, setLang };

  return (
    <>
      {/* ── DESKTOP: outer div IS the flex-col container ── */}
      <div
        className={`hidden lg:flex flex-col ${SIDEBAR_W} shrink-0 h-screen sticky top-0`}
        style={{ background: BG }}
      >
        <Brand lang={lang} />
        <NavLabel lang={lang} />
        <NavItems pathname={pathname} t={t} setOpen={setOpen} />
        <FillCard lang={lang} />
        <BottomSection {...shared} />
      </div>

      {/* ── MOBILE: fixed overlay ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)} />
          <div
            className={`absolute right-0 top-0 h-full ${SIDEBAR_W} flex flex-col z-10`}
            style={{ background: BG, boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}
          >
            <Brand lang={lang} />
            <NavLabel lang={lang} />
            <NavItems pathname={pathname} t={t} setOpen={setOpen} />
            <FillCard lang={lang} />
            <BottomSection {...shared} />

            <button onClick={() => setOpen(false)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
