'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/lib/context';
import { dashboardAPI } from '@/lib/api';
import {
  Car, Users, FileText, CheckCircle, Clock, TrendingUp, TrendingDown,
  ChevronLeft, ListOrdered, Wallet, BadgeCheck, Hourglass,
  UserCheck, ShieldCheck, Plus, ArrowUpRight, Activity,
  BarChart3, AlertCircle, Banknote, Receipt, AlertTriangle,
} from 'lucide-react';
import { formatAfghanDate, formatCurrency as fmtCur, formatNumber } from '@/lib/utils';

/* ── status map ── */
const statusMap: Record<string, { dari: string; pashto: string; dot: string; bg: string; text: string }> = {
  ACTIVE:    { dari: 'فعال',  pashto: 'فعال',   dot: '#10b981', bg: '#d1fae5', text: '#065f46' },
  COMPLETED: { dari: 'تکمیل', pashto: 'بشپړ',   dot: '#3b82f6', bg: '#dbeafe', text: '#1e40af' },
  CANCELLED: { dari: 'لغو',   pashto: 'لغوه',   dot: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
  OVERDUE:   { dari: 'ناوقت', pashto: 'ناوخته', dot: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
};

/* ── skeleton ── */
function Sk({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton rounded ${w} ${h}`} />;
}

/* ── section heading ── */
function SectionHead({ title, link, linkLabel, icon: Icon, color }: {
  title: string; link?: string; linkLabel?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: color }}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="font-bold text-amber-900 text-base">{title}</h3>
      </div>
      {link && (
        <Link href={link}
          className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors">
          {linkLabel}<ChevronLeft className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payTab, setPayTab] = useState<'pending' | 'latest'>('pending');

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    dashboardAPI.getStats()
      .then(r => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const fc = (n: number | string | undefined) => fmtCur(n, t.currency);
  const d = (dari: string, pashto: string) => lang === 'dari' ? dari : pashto;

  const pendingList: any[] = stats?.pendingContractsList || [];
  const recentPays: any[]  = stats?.recentPaymentsList   || [];

  /* car fleet percentages */
  const totalCars     = stats?.totalCars     || 0;
  const availablePct  = totalCars ? Math.round(((stats?.availableCars || 0) / totalCars) * 100) : 0;
  const rentedPct     = totalCars ? Math.round(((stats?.rentedCars    || 0) / totalCars) * 100) : 0;
  const maintenancePct = totalCars ? Math.round(100 - availablePct - rentedPct) : 0;

  /* today's date (Afghan) */
  const todayStr = formatAfghanDate(new Date().toISOString());

  /* ── Loading skeleton ── */
  if (loading) return (
    <MainLayout>
      <div className="space-y-6 page-enter">
        <div className="flex justify-between items-start">
          <div className="space-y-2"><Sk w="w-40" h="h-7" /><Sk w="w-28" h="h-4" /></div>
          <div className="flex gap-2"><Sk w="w-28" h="h-9" /><Sk w="w-28" h="h-9" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="card-golden rounded-2xl p-5 space-y-3"><Sk h="h-10" /><Sk w="w-3/4" h="h-5" /><Sk w="w-1/2" h="h-4" /></div>)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="card-golden rounded-2xl p-5 space-y-3"><Sk h="h-8" /><Sk w="w-2/3" h="h-6" /></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_,i) => <div key={i} className="card-golden rounded-2xl p-5 space-y-3 h-40"><Sk /><Sk w="w-3/4" /></div>)}
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-6 page-enter">

        {/* ══════════════════════════════════════════
            PAGE HEADER
        ══════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-md"
              style={{ background: '#fff', border: '2px solid #fde68a', padding: '2px' }}>
              <Image src="/logo.png" alt="افشار" width={36} height={36} className="object-contain w-full h-full" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-900 leading-tight">{t.dashboard}</h2>
              <p className="text-amber-500 text-xs mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {t.appName} — {todayStr}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/expenses"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 transition-all">
              <TrendingDown className="w-4 h-4" />
              {d('مصارف', 'لګښتونه')}
            </Link>
            <Link href="/orders/new"
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-md">
              <Plus className="w-4 h-4" />
              {t.carOrder}
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ROW 1 — FINANCIAL OVERVIEW (4 cards)
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">

          {/* Net income */}
          <div className="card-golden rounded-2xl overflow-hidden">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#059669,#10b981)' }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#d1fae5', color: '#065f46' }}>
                  {d('خالص', 'خالص')}
                </span>
              </div>
              <p className={`text-2xl font-black leading-tight ${(stats?.adminNetIncome ?? 0) >= 0 ? 'text-emerald-800' : 'text-red-700'}`}>
                {fc(stats?.adminNetIncome ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">
                {d('درآمد خالص ادمین', 'د ادمین خالص عاید')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{d('بعد از کسر مصارف', 'د لګښتونو وروسته')}</p>
            </div>
          </div>

          {/* Admin share */}
          <div className="card-golden rounded-2xl overflow-hidden">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: '#ede9fe', color: '#4c1d95' }}>
                  50%
                </span>
              </div>
              <p className="text-2xl font-black text-purple-900 leading-tight">
                {fc(stats?.adminIncome ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">
                {d('سهم ادمین از سفارش‌ها', 'د ادمین برخه')}
              </p>
              {(stats?.adminIncomeCompleted ?? 0) > 0 && (
                <p className="text-xs text-purple-500 mt-0.5">
                  {d('تکمیل:', 'بشپړ:')} {fc(stats.adminIncomeCompleted)}
                </p>
              )}
            </div>
          </div>

          {/* Owner share */}
          <div className="card-golden rounded-2xl overflow-hidden">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#0d9488,#14b8a6)' }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: '#ccfbf1', color: '#134e4a' }}>
                  50%
                </span>
              </div>
              <p className="text-2xl font-black text-teal-900 leading-tight">
                {fc(stats?.ownerIncome ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">
                {d('سهم صاحب موتر', 'د موتر د خاوند برخه')}
              </p>
              {(stats?.ownerIncomeCompleted ?? 0) > 0 && (
                <p className="text-xs text-teal-500 mt-0.5">
                  {d('تکمیل:', 'بشپړ:')} {fc(stats.ownerIncomeCompleted)}
                </p>
              )}
            </div>
          </div>

          {/* Paid to car owners */}
          <div className="card-golden rounded-2xl overflow-hidden">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#0891b2,#06b6d4)' }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)' }}>
                  <Banknote className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: '#cffafe', color: '#155e75' }}>
                  {formatNumber(stats?.totalCarOwnerPaymentsCount || 0)}
                </span>
              </div>
              <p className="text-2xl font-black text-cyan-900 leading-tight">
                {fc(stats?.totalCarOwnerPaid ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">
                پول داده شده برای صاحبان موتر
              </p>
              <p className="text-xs text-cyan-500 mt-0.5">
                باقی سهم صاحبان: {fc(stats?.ownerOutstanding ?? 0)}
              </p>
            </div>
          </div>

          {/* Expense deductions */}
          <div className="card-golden rounded-2xl overflow-hidden">
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#ef4444,#f87171)' }} />
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: '#fee2e2', color: '#991b1b' }}>
                  50%
                </span>
              </div>
              <p className="text-2xl font-black text-red-900 leading-tight">
                {fc(stats?.adminExpenses ?? 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1.5 font-medium">
                {d('کسر مصارف', 'د لګښت کسر')}
              </p>
              <p className="text-xs text-red-400 mt-0.5">{d('سهم ادمین از مصارف', 'د ادمین د لګښتونو برخه')}</p>
            </div>
          </div>

          {/* Delay Penalty Total */}
          {(stats?.totalDelayPenalty ?? 0) > 0 && (
            <div className="card-golden rounded-2xl overflow-hidden">
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#f97316,#ea580c)' }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg,#f97316,#c2410c)' }}>
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full animate-pulse"
                    style={{ background: '#ffedd5', color: '#9a3412' }}>
                    {d('تاخیر', 'ځنډ')}
                  </span>
                </div>
                <p className="text-2xl font-black text-orange-900 leading-tight">
                  {fc(stats?.totalDelayPenalty ?? 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1.5 font-medium">
                  {d('مجموع جریمه تأخیر', 'د ځنډ ټوله جریمه')}
                </p>
                <p className="text-xs text-orange-400 mt-0.5">{d('شامل در مجموع کرایه', 'په ټوله کرایه کې شامله')}</p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            ROW 2 — KPI SUMMARY (4 cards)
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: d('همه سفارش‌ها', 'ټول سفارشونه'),
              value: formatNumber(stats?.totalContractsCount || 0),
              sub:   d('سفارش ثبت‌شده', 'ثبت شوي سفارشونه'),
              icon:  ListOrdered,
              grad:  'linear-gradient(135deg,#f59e0b,#d97706)',
              bg:    '#fef3c7',
              href:  '/orders',
            },
            {
              label: d('مجموع کرایه', 'ټوله کرایه'),
              value: fc((stats?.totalContractValue ?? 0) + (stats?.totalDelayPenalty ?? 0)),
              sub:   d('مجموع ارزش سفارش‌ها + جریمه', 'د ټولو سفارشونو ارزښت + جریمه'),
              icon:  Receipt,
              grad:  'linear-gradient(135deg,#0891b2,#0e7490)',
              bg:    '#e0f2fe',
              href:  '/orders',
            },
            {
              label: d('مجموع دریافتی', 'ترلاسه شوي'),
              value: fc(stats?.totalReceived),
              sub:   d('مبلغ وصول‌شده', 'ترلاسه شوی مبلغ'),
              icon:  BadgeCheck,
              grad:  'linear-gradient(135deg,#059669,#047857)',
              bg:    '#d1fae5',
              href:  '/orders',
            },
            {
              label: d('باقی‌مانده', 'پاتې مبلغ'),
              value: fc(stats?.pendingPayments),
              sub:   d('مبلغ دریافت‌نشده', 'نه ترلاسه شوی مبلغ'),
              icon:  Hourglass,
              grad:  'linear-gradient(135deg,#dc2626,#b91c1c)',
              bg:    '#fee2e2',
              href:  '/orders',
            },
          ].map(({ label, value, sub, icon: Icon, grad, bg, href }) => (
            <Link key={label} href={href}
              className="card-golden rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200"
                style={{ background: grad }}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium mb-0.5 leading-tight">{label}</p>
                <p className="text-lg font-black text-amber-900 truncate leading-tight">{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{sub}</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-300 group-hover:text-amber-500 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            ROW 3 — FLEET STATUS + CONTRACT STATS
        ══════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Car Fleet Panel */}
          <div className="card-golden rounded-2xl p-5 space-y-4">
            <SectionHead title={d('وضعیت موترها', 'د موترونو حالت')} icon={Car} color="linear-gradient(135deg,#f59e0b,#d97706)" link="/cars" linkLabel={d('موترها', 'موترونه')} />
            <div className="flex items-center justify-center gap-4 py-2">
              {/* Donut visual */}
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                  {/* Rented arc */}
                  {rentedPct > 0 && (
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3.5"
                      strokeDasharray={`${rentedPct} ${100 - rentedPct}`}
                      strokeDashoffset="0" strokeLinecap="round" />
                  )}
                  {/* Maintenance arc */}
                  {maintenancePct > 0 && (
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3.5"
                      strokeDasharray={`${maintenancePct} ${100 - maintenancePct}`}
                      strokeDashoffset={`${-(rentedPct)}`} strokeLinecap="round" />
                  )}
                  {/* Available arc */}
                  {availablePct > 0 && (
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.5"
                      strokeDasharray={`${availablePct} ${100 - availablePct}`}
                      strokeDashoffset={`${-(rentedPct + maintenancePct)}`} strokeLinecap="round" />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-amber-900">{totalCars}</span>
                  <span className="text-[10px] text-gray-400">{d('موتر', 'موتر')}</span>
                </div>
              </div>
              <div className="space-y-2.5 flex-1">
                {[
                  { label: d('موجود',    'موجود'),  value: stats?.availableCars  || 0, pct: availablePct,   color: '#10b981' },
                  { label: d('کرایه',    'کرایه'),  value: stats?.rentedCars     || 0, pct: rentedPct,      color: '#ef4444' },
                  { label: d('تعمیر',    'ترمیم'),  value: totalCars - (stats?.availableCars || 0) - (stats?.rentedCars || 0), pct: maintenancePct, color: '#f59e0b' },
                ].map(({ label, value, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs text-gray-600 font-medium">{label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800">{value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contract Status Panel */}
          <div className="card-golden rounded-2xl p-5 space-y-4">
            <SectionHead title={d('وضعیت سفارش‌ها', 'د سفارشونو حالت')} icon={FileText} color="linear-gradient(135deg,#0891b2,#0e7490)" link="/orders" linkLabel={d('همه', 'ټول')} />
            <div className="space-y-3">
              {[
                { label: d('فعال',    'فعال'),   value: stats?.activeContracts    || 0, color: '#10b981', bg: '#d1fae5', icon: Activity },
                { label: d('تکمیل',  'بشپړ'),   value: stats?.completedContracts || 0, color: '#3b82f6', bg: '#dbeafe', icon: CheckCircle },
                { label: d('ناوقت',  'ناوخته'), value: stats?.overdueContracts   || 0, color: '#ef4444', bg: '#fee2e2', icon: AlertCircle },
                { label: d('مشتریان', 'مشتریان'), value: stats?.totalCustomers   || 0, color: '#7c3aed', bg: '#ede9fe', icon: Users },
              ].map(({ label, value, color, bg, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: bg + '80', border: `1px solid ${bg}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: color + '25' }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-gray-700">{label}</span>
                  <span className="text-xl font-black" style={{ color }}>{formatNumber(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly income chart */}
          <div className="card-golden rounded-2xl p-5 space-y-4">
            <SectionHead title={t.monthlyIncome} icon={BarChart3} color="linear-gradient(135deg,#059669,#047857)" />
            {stats?.monthlyIncome && Object.keys(stats.monthlyIncome).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.monthlyIncome).slice(-5).reverse().map(([month, amount]: any) => {
                  const max = Math.max(...(Object.values(stats.monthlyIncome) as number[]));
                  const pct = max > 0 ? Math.round((amount / max) * 100) : 0;
                  return (
                    <div key={month} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium truncate max-w-[90px]">{month}</span>
                        <span className="text-xs font-bold text-amber-900">{fc(amount)}</span>
                      </div>
                      <div className="h-2 bg-amber-50 rounded-full overflow-hidden border border-amber-100">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="w-10 h-10 text-amber-200 mb-2" />
                <p className="text-xs text-amber-400">{t.noData}</p>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ROW 4 — PAYMENT ACTIVITY + PENDING
        ══════════════════════════════════════════ */}
        <div className="card-golden rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="px-5 py-0 border-b border-amber-100 flex items-center justify-between">
            <div className="flex">
              {([
                { key: 'pending', label: d('پرداخت‌های باقی‌مانده', 'پاتې تادیات'), count: pendingList.length },
                { key: 'latest',  label: d('آخرین تراکنش‌ها',       'وروستي لیږدونه'), count: recentPays.length },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setPayTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all -mb-px ${
                    payTab === tab.key
                      ? 'border-amber-500 text-amber-800'
                      : 'border-transparent text-gray-400 hover:text-amber-600'
                  }`}>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      payTab === tab.key
                        ? (tab.key === 'pending' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700')
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Link href="/orders"
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-700 transition-colors pb-4 font-semibold">
              {d('مشاهده همه', 'ټول وګورئ')}<ChevronLeft className="w-3 h-3" />
            </Link>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {payTab === 'pending' && (
              pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">{d('همه پرداخت‌ها تسویه شده است', 'ټولې تادیې تسویه شوي دي')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="border-b border-amber-100">
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{d('مشتری', 'مشتری')}</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{d('موتر', 'موتر')}</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{d('تاریخ ختم', 'د ختم نیټه')}</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{d('باقی‌مانده', 'پاتې')}</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{d('اقدام', 'عمل')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
              {pendingList.map((c: any, i: number) => {
                const isOverdue = c.status === 'OVERDUE';
                const overdueDays = c.liveOverdueDays ?? 0;
                const overdueCharge = c.liveOverdueCharges ?? c.liveTotalDelayPenalty ?? 0;
                const finalTotal = c.liveFinalTotal ?? c.totalRent;
                return (
                <tr key={c.id} className={`hover:bg-amber-50/50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                  <td className="px-3 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-800">{c.customer?.fullName}</p>
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-700">{c.car?.carName}</p>
                    <p className="text-xs text-gray-400">{c.car?.plateNumber}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {formatAfghanDate(c.endDate)}
                    {isOverdue && overdueDays > 0 && (
                      <div className="text-xs font-bold text-red-600 mt-0.5">+{overdueDays} {d('روز', 'ورځ')}</div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold bg-red-50 text-red-700 border border-red-100">
                        {fc(c.remainingAmount)}
                      </span>
                      {isOverdue && overdueCharge > 0 && (
                        <span className="text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded">
                          {d('نهایی:', 'وروستی:')} {fc(finalTotal)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Link href="/orders"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                      <ArrowUpRight className="w-3 h-3" />
                      {d('مشاهده', 'کتل')}
                    </Link>
                  </td>
                </tr>
                );
              })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {payTab === 'latest' && (
              recentPays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">{t.noData}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="border-b border-amber-100">
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t.contractNo}</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t.customer}</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t.amount}</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">{t.date}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50">
                      {recentPays.map((p: any, i: number) => (
                        <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="px-3 py-3 text-xs text-gray-400">{i + 1}</td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100">
                              {p.rentalContract?.contractNumber}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-700 font-medium">{p.rentalContract?.customer?.fullName}</td>
                          <td className="px-3 py-3">
                            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                              {fc(p.amount)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-400">{formatAfghanDate(p.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ROW 5 — RECENT CONTRACTS TABLE
        ══════════════════════════════════════════ */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
            <SectionHead title={t.recentContracts} icon={ListOrdered} color="linear-gradient(135deg,#f59e0b,#d97706)" />
            <Link href="/orders"
              className="flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-700 transition-colors">
              {d('مشاهده همه', 'ټول وګورئ')}<ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {!stats?.recentContracts?.length ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-amber-300" />
                </div>
                <p className="text-sm font-semibold text-gray-400">{t.noData}</p>
                <Link href="/orders/new"
                  className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
                  <Plus className="w-4 h-4" />{t.carOrder}
                </Link>
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)' }}
                    className="border-b border-amber-200">
                    <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider">{t.contractNo}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider">{t.customer}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider">{t.car}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider">{t.startDate}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider">{t.totalRent}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider">{t.remainingAmount}</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-amber-700 uppercase tracking-wider">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {stats.recentContracts.map((c: any, i: number) => {
                    const s = statusMap[c.status];
                    const isOverdue = c.status === 'OVERDUE';
                    return (
                      <tr key={c.id} className={`hover:bg-amber-50/40 transition-colors ${isOverdue ? 'bg-red-50/20' : ''}`}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100 whitespace-nowrap">
                              {c.contractNumber}
                            </span>
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
                              style={{ background: `hsl(${(i * 47) % 360},55%,55%)` }}>
                              {c.customer?.fullName?.[0] || '—'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{c.customer?.fullName}</p>
                              <p className="text-xs text-gray-400" dir="ltr">{c.customer?.phoneNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium text-gray-700">{c.car?.carName}</p>
                          <p className="text-xs text-gray-400 font-mono">{c.car?.plateNumber}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {formatAfghanDate(c.startDate)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-amber-900">{fc(c.totalRent)}</span>
                            {isOverdue && (c.liveOverdueCharges ?? c.liveTotalDelayPenalty ?? 0) > 0 && (
                              <span className="text-[10px] font-bold text-red-600">
                                +{fc(c.liveOverdueCharges ?? c.liveTotalDelayPenalty ?? 0)} {d('جریمه', 'جریمه')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-sm font-bold ${c.remainingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {fc(c.remainingAmount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                            style={{ background: s?.bg, color: s?.text }}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s?.dot }} />
                            {s?.[lang] || c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
