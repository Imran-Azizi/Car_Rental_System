'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MonthSelector from '@/components/layout/MonthSelector';
import {
  LayoutDashboard, Car, FileText, LogOut,
  Menu, X, ChevronLeft, Bell, Phone, UserCheck, Banknote,
} from 'lucide-react';
import { ownerAuthAPI, ownerPortalAPI } from '@/lib/api';
import { resolveImgUrl } from '@/lib/imageUrl';
const SIDEBAR_W = 'w-72';   /* 288 px — must match admin */
const BG        = 'linear-gradient(175deg,#111827 0%,#1e2d45 55%,#0f3460 100%)';

const navItems = [
  { href: '/owner/dashboard',     dari: 'داشبورد',    pashto: 'ډاشبورډ',    icon: LayoutDashboard },
  { href: '/owner/cars',          dari: 'موترهای من', pashto: 'زما موترونه', icon: Car },
  { href: '/owner/contracts',     dari: 'قراردادها',  pashto: 'قراردادونه',  icon: FileText },
  { href: '/owner/payments',      dari: 'پول داده شده', pashto: 'ورکړل شوې پیسې', icon: Banknote },
  { href: '/owner/notifications', dari: 'اعلان‌ها',   pashto: 'خبرتیاوې',    icon: Bell },
];

/* ══════════════════ shared sub-components ══════════════════ */

function OwnerBrand({ lang, label }: { lang: string; label: (d: string, p: string) => string }) {
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
          <p className="text-white/35 text-[11px] mt-0.5">{label('پنل صاحب موتر', 'د موتر د خاوند پینل')}</p>
        </div>
      </div>
    </div>
  );
}

function OwnerProfile({ owner, photoUrl }: { owner: any; photoUrl: string | null }) {
  return (
    <div className="px-4 pt-4 shrink-0">
      <div className="flex items-center gap-3 px-3 py-3 rounded-2xl"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
        {photoUrl ? (
          <img src={photoUrl} alt={owner?.fullName}
            className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400/40 shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            {owner?.fullName?.[0] || 'م'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate leading-snug">
            {owner?.fullName || 'صاحب موتر'}
          </p>
          <p className="text-amber-300/55 text-xs mt-0.5 leading-none" dir="ltr">
            {owner?.phoneNumber || ''}
          </p>
        </div>
      </div>
    </div>
  );
}

function OwnerNavLabel({ lang, label }: { lang: string; label: (d: string, p: string) => string }) {
  return (
    <p className="px-5 pt-4 pb-2 shrink-0 text-[10px] font-bold tracking-[0.13em] uppercase"
      style={{ color: 'rgba(245,158,11,0.45)' }}>
      {label('ناوبری', 'نیویګیشن')}
    </p>
  );
}

function OwnerNav({
  pathname, lang, unread, setOpen,
}: {
  pathname: string; lang: string; unread: number; setOpen: (v: boolean) => void;
}) {
  return (
    <nav className="px-3 shrink-0 space-y-0.5">
      {navItems.map(({ href, dari, pashto, icon: Icon }) => {
        const active    = pathname === href;
        const isBell    = href === '/owner/notifications';
        const itemLabel = lang === 'dari' ? dari : pashto;
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3.5 px-4 py-[11px] rounded-xl text-[13.5px] font-medium transition-all duration-150 group ${
              active ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
            }`}
            style={active ? {
              background: 'linear-gradient(135deg,rgba(245,158,11,0.20),rgba(217,119,6,0.10))',
              borderRight: '3px solid #f59e0b',
              paddingRight: 'calc(1rem - 3px)',
            } : {}}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative transition-all duration-150 ${
              active ? 'bg-amber-500/20' : 'group-hover:bg-white/[0.07]'
            }`}>
              <Icon className={`w-[17px] h-[17px] transition-colors ${
                active ? 'text-amber-400' : 'text-white/45 group-hover:text-white/80'
              }`} />
              {isBell && unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none shadow">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span className="flex-1 leading-none">{itemLabel}</span>
            {isBell && unread > 0 && !active && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300">
                {unread}
              </span>
            )}
            {active && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
          </Link>
        );
      })}
    </nav>
  );
}

function OwnerFillCard({ lang, label }: { lang: string; label: (d: string, p: string) => string }) {
  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-4 overflow-hidden">
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg,rgba(245,158,11,0.08),rgba(15,52,96,0.55))',
          border: '1px solid rgba(245,158,11,0.18)',
        }}>
        <div className="h-[3px]"
          style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706,#92400e)' }} />
        <div className="px-4 py-5 flex flex-col items-center gap-3 text-center">
          <div className="w-[60px] h-[60px] rounded-2xl overflow-hidden"
            style={{
              background: '#fff', padding: '3px',
              border: '2px solid rgba(245,158,11,0.35)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
            }}>
            <Image src="/logo.png" alt="افشار" width={50} height={50}
              className="object-contain w-full h-full" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-snug">مرکز کرایه موتر افشار</p>
            <p className="mt-1 text-[11px]" style={{ color: 'rgba(251,191,36,0.65)' }}>
              {label('پنل اختصاصی صاحب موتر', 'د موتر د خاوند پینل')}
            </p>
          </div>
          <div className="w-full h-px" style={{ background: 'rgba(245,158,11,0.14)' }} />
          <div className="space-y-1.5 w-full">
            {['0783 945 133', '0773 492 040'].map(num => (
              <div key={num} className="flex items-center justify-center gap-2"
                style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>
                <Phone className="w-3 h-3 shrink-0" style={{ color: 'rgba(245,158,11,0.55)' }} />
                <span dir="ltr">{num}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)',
              fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.80)',
            }}>
            <UserCheck className="w-3 h-3 shrink-0" />
            {label('پنل صاحب موتر', 'د موتر د خاوند پینل')}
          </div>
        </div>
      </div>
    </div>
  );
}

function OwnerBottom({
  lang, toggleLang, onLogout, label,
}: {
  lang: string;
  toggleLang: (l: 'dari' | 'pashto') => void;
  onLogout: () => void;
  label: (d: string, p: string) => string;
}) {
  return (
    <div className="shrink-0 px-4 pb-4 pt-1 border-t space-y-2.5"
      style={{ borderColor: 'rgba(245,158,11,0.12)' }}>
      <div className="flex gap-1.5 p-1.5 rounded-2xl" style={{ background: 'rgba(0,0,0,0.30)' }}>
        {(['dari', 'pashto'] as const).map(l => (
          <button key={l} onClick={() => toggleLang(l)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
              lang === l ? 'bg-amber-500 text-white shadow-md' : 'text-amber-400/60 hover:text-amber-300 hover:bg-white/[0.06]'
            }`}>
            {l === 'dari' ? 'دری' : 'پښتو'}
          </button>
        ))}
      </div>
      <button onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-[11px] rounded-xl text-[13px] font-medium text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150 group">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-red-500/15 transition-colors shrink-0">
          <LogOut className="w-[17px] h-[17px]" />
        </div>
        <span>{label('خروج از حساب', 'د حساب وتل')}</span>
      </button>
    </div>
  );
}

/* ══════════════════ page component ══════════════════════════ */
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [owner,      setOwner]      = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [unread,     setUnread]     = useState(0);
  const [lang,       setLang]       = useState<'dari' | 'pashto'>('dari');

  const fetchUnread = useCallback(async () => {
    try {
      const res = await ownerPortalAPI.getUnreadCount();
      setUnread(res.data.data?.count ?? 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('ownerLang') as 'dari' | 'pashto' | null;
    if (savedLang) setLang(savedLang);
    const token = localStorage.getItem('ownerToken');
    const user  = localStorage.getItem('ownerUser');
    if (!token) { router.replace('/owner-login'); return; }
    if (user) setOwner(JSON.parse(user));
    fetchUnread();
    const iv = setInterval(fetchUnread, 2 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const toggleLang = (l: 'dari' | 'pashto') => { setLang(l); localStorage.setItem('ownerLang', l); };
  const handleLogout = async () => {
    try { await ownerAuthAPI.logout(); } catch {}
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerUser');
    router.push('/owner-login');
  };

  if (!mounted) return null;

  const photoUrl = resolveImgUrl(owner?.photo);
  const label    = (d: string, p: string) => lang === 'dari' ? d : p;

  /* shared sidebar props */
  const sidebarProps = { lang, label, owner, photoUrl, unread, toggleLang, onLogout: handleLogout };

  /* ── sidebar sections (used in both desktop & mobile) ── */
  const SidebarSections = ({ closeFn }: { closeFn: (v: boolean) => void }) => (
    <>
      <OwnerBrand      lang={lang} label={label} />
      <OwnerProfile    owner={owner} photoUrl={photoUrl} />
      <OwnerNavLabel   lang={lang} label={label} />
      <OwnerNav        pathname={pathname} lang={lang} unread={unread} setOpen={closeFn} />
      <OwnerFillCard   lang={lang} label={label} />
      <OwnerBottom     lang={lang} toggleLang={toggleLang} onLogout={handleLogout} label={label} />
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl"
      style={{ background: 'linear-gradient(135deg,#fef9f0 0%,#fffbf0 100%)' }}>

      {/* ── Desktop: outer div IS the flex-col container ── */}
      <div
        className={`hidden lg:flex flex-col ${SIDEBAR_W} shrink-0 h-screen sticky top-0`}
        style={{ background: BG }}
      >
        <SidebarSections closeFn={setMobileOpen} />
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)} />
          <div
            className={`absolute right-0 top-0 h-full ${SIDEBAR_W} flex flex-col z-10`}
            style={{ background: BG, boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}
          >
            <SidebarSections closeFn={setMobileOpen} />
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">

        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 border-b shrink-0"
          style={{
            background: 'rgba(255,251,240,0.96)', backdropFilter: 'blur(10px)',
            borderColor: '#fde68a', boxShadow: '0 1px 8px rgba(245,158,11,0.08)',
          }}>
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-amber-700 hover:bg-amber-100 transition-colors shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
            <span className="text-amber-500 font-medium truncate hidden sm:block">
              {label('مرکز کرایه موتر افشار', 'افشار د کرایپي موترو مرکز')}
            </span>
            <ChevronLeft className="w-4 h-4 text-amber-300 shrink-0 hidden sm:block" />
            <span className="text-amber-900 font-bold truncate">
              {navItems.find(n => n.href === pathname)?.[lang === 'dari' ? 'dari' : 'pashto'] || label('پنل', 'پینل')}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <MonthSelector />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/owner/notifications"
              className="relative p-2 rounded-xl text-amber-700 hover:bg-amber-100 transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg,rgba(245,158,11,0.10),rgba(217,119,6,0.06))',
                border: '1px solid rgba(245,158,11,0.22)',
              }}>
              {photoUrl ? (
                <img src={photoUrl} alt={owner?.fullName}
                  className="w-6 h-6 rounded-full object-cover border border-amber-300/50 shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                  {owner?.fullName?.[0] || 'م'}
                </div>
              )}
              <span className="text-amber-800 text-sm font-semibold hidden sm:inline">
                {owner?.fullName}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
