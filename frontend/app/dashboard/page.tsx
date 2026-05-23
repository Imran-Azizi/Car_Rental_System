'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/lib/context';
import { dashboardAPI } from '@/lib/api';
import {
  Car, Users, FileText, CheckCircle, Clock,
  TrendingUp, TrendingDown, ChevronLeft,
  ListOrdered, Wallet, BadgeCheck, Hourglass,
  UserCheck, ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { formatAfghanDate, formatCurrency as fmtCur, formatNumber } from '@/lib/utils';

const statusLabel: Record<string, { dari: string; pashto: string; cls: string }> = {
  ACTIVE:    { dari: 'فعال',  pashto: 'فعال',   cls: 'badge-active'    },
  COMPLETED: { dari: 'تکمیل', pashto: 'بشپړ',   cls: 'badge-completed' },
  CANCELLED: { dari: 'لغو',   pashto: 'لغوه',   cls: 'badge-cancelled' },
  OVERDUE:   { dari: 'ناوقت', pashto: 'ناوخته', cls: 'badge-overdue'   },
};

function SkeletonCard() {
  return (
    <div className="card-golden rounded-2xl p-5 flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-6 w-32 rounded" />
      </div>
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

  const formatCurrency = (n: number | string | undefined) => fmtCur(n, t.currency);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6 page-enter">
          <div>
            <div className="skeleton h-8 w-48 rounded mb-2" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          {/* Revenue split + financial summary */}
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {/* Top 4 money cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {/* 8 stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  const pendingContractsList: any[] = stats?.pendingContractsList || [];
  const recentPaymentsList: any[]   = stats?.recentPaymentsList   || [];

  return (
    <MainLayout>
      <div className="space-y-6 page-enter">

        {/* ── Title ─────────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-amber-900">{t.dashboard}</h2>
          <p className="text-amber-600 text-sm mt-1">{t.appName}</p>
        </div>

        {/* ── Row 1: درآمد خالص (left) + کسر مصارف (right) ─────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Net income — left */}
          <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #6ee7b7' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base leading-tight">
                  {lang === 'dari' ? 'درآمد خالص' : 'خالص عاید'}
                </p>
                <p className="text-emerald-200 text-xs mt-0.5">
                  {lang === 'dari' ? 'بعد از کسر مصارف' : 'د لګښتونو وروسته'}
                </p>
              </div>
            </div>
            <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
              <p className={`text-3xl font-black ${(stats?.adminNetIncome ?? 0) >= 0 ? 'text-emerald-900' : 'text-red-700'}`}>
                {formatCurrency(stats?.adminNetIncome ?? 0)}
              </p>
            </div>
          </div>

          {/* Expense deductions — right */}
          <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #fca5a5' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base leading-tight">
                  {lang === 'dari' ? 'کسر مصارف' : 'د لګښت کسر'}
                </p>
                <p className="text-red-200 text-xs mt-0.5">
                  {lang === 'dari' ? 'سهم ادمین از مصارف' : 'د ادمین د لګښتونو برخه'}
                </p>
              </div>
              <span className="text-sm font-black text-white bg-white/25 px-3 py-1 rounded-full shrink-0">50%</span>
            </div>
            <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg,#fff5f5,#fee2e2)' }}>
              <p className="text-3xl font-black text-red-800">
                {formatCurrency(stats?.adminExpenses ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Row 2: سهم ادمین (left) + سهم صاحب موتر (right) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Admin share — left */}
          <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #7c3aed' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base leading-tight">
                  {lang === 'dari' ? 'سهم ادمین' : 'د ادمین برخه'}
                </p>
                <p className="text-purple-200 text-xs mt-0.5">
                  {lang === 'dari' ? 'از همه سفارش‌ها' : 'له ټولو سفارشونو'}
                </p>
              </div>
              <span className="text-sm font-black text-white bg-white/25 px-3 py-1 rounded-full shrink-0">50%</span>
            </div>
            <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg,#faf5ff,#ede9fe)' }}>
              <p className="text-3xl font-black" style={{ color: '#5b21b6' }}>
                {formatCurrency(stats?.adminIncome ?? 0)}
              </p>
              {(stats?.adminIncomeCompleted ?? 0) > 0 && (
                <p className="text-xs mt-2 font-medium" style={{ color: '#4c1d95' }}>
                  {lang === 'dari' ? 'تکمیل‌شده:' : 'بشپړ:'} {formatCurrency(stats?.adminIncomeCompleted ?? 0)}
                </p>
              )}
            </div>
          </div>

          {/* Owner share — right */}
          <div className="rounded-2xl overflow-hidden shadow-md" style={{ border: '2px solid #0d9488' }}>
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base leading-tight">
                  {lang === 'dari' ? 'سهم صاحب موتر' : 'د موتر د خاوند برخه'}
                </p>
                <p className="text-teal-200 text-xs mt-0.5">
                  {lang === 'dari' ? 'از همه سفارش‌ها' : 'له ټولو سفارشونو'}
                </p>
              </div>
              <span className="text-sm font-black text-white bg-white/25 px-3 py-1 rounded-full shrink-0">50%</span>
            </div>
            <div className="px-5 py-5" style={{ background: 'linear-gradient(135deg,#f0fdfa,#ccfbf1)' }}>
              <p className="text-3xl font-black" style={{ color: '#0f766e' }}>
                {formatCurrency(stats?.ownerIncome ?? 0)}
              </p>
              {(stats?.ownerIncomeCompleted ?? 0) > 0 && (
                <p className="text-xs mt-2 font-medium" style={{ color: '#047857' }}>
                  {lang === 'dari' ? 'تکمیل‌شده:' : 'بشپړ:'} {formatCurrency(stats?.ownerIncomeCompleted ?? 0)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── 4 money summary cards ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label:    lang === 'dari' ? 'همه سفارش‌ها'         : 'ټول سفارشونه',
              value:    formatNumber(stats?.totalContractsCount || 0),
              icon:     ListOrdered,
              gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
              href:     '/orders',
            },
            {
              label:    lang === 'dari' ? 'مجموع پول سفارش‌ها'     : 'د سفارشونو ټول پیسې',
              value:    formatCurrency(stats?.totalContractValue),
              icon:     Wallet,
              gradient: 'linear-gradient(135deg,#0891b2,#0e7490)',
              href:     '/orders',
            },
            {
              label:    lang === 'dari' ? 'مجموع پول دریافتی'     : 'ترلاسه شوي ټول پیسې',
              value:    formatCurrency(stats?.totalReceived),
              icon:     BadgeCheck,
              gradient: 'linear-gradient(135deg,#059669,#047857)',
              href:     '/orders',
            },
            {
              label:    lang === 'dari' ? 'مجموع پول باقی‌مانده'   : 'پاتې ټول پیسې',
              value:    formatCurrency(stats?.pendingPayments),
              icon:     Hourglass,
              gradient: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              href:     '/orders',
            },
          ].map(({ label, value, icon: Icon, gradient, href }) => (
            <Link key={label} href={href}
              className="card-golden rounded-2xl p-5 flex items-center gap-4 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-200"
                style={{ background: gradient }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-amber-600 font-medium leading-tight mb-1">{label}</p>
                <p className="text-lg font-extrabold text-amber-900 truncate">{value}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── 6 stat cards (cars + contracts) ─────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard title={t.totalCars}         value={stats?.totalCars         || 0} icon={Car}         color="linear-gradient(135deg,#f59e0b,#d97706)" />
          <StatCard title={t.availableCars}      value={stats?.availableCars      || 0} icon={Car}         color="linear-gradient(135deg,#059669,#047857)" />
          <StatCard title={t.rentedCars}         value={stats?.rentedCars         || 0} icon={Car}         color="linear-gradient(135deg,#dc2626,#b91c1c)" />
          <StatCard title={t.totalCustomers}     value={stats?.totalCustomers     || 0} icon={Users}       color="linear-gradient(135deg,#7c3aed,#6d28d9)" />
          <StatCard title={t.activeContracts}    value={stats?.activeContracts    || 0} icon={Clock}       color="linear-gradient(135deg,#0891b2,#0e7490)" />
          <StatCard title={t.completedContracts} value={stats?.completedContracts || 0} icon={CheckCircle} color="linear-gradient(135deg,#16a34a,#15803d)" />
        </div>

        {/* ── Payment records + monthly income ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Payment tabs — 2/3 width */}
          <div className="lg:col-span-2 card-golden rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-0 border-b border-amber-100 flex items-center justify-between gap-4">
              <div className="flex gap-1">
                {([
                  { key: 'pending', label: lang === 'dari' ? 'باقی‌مانده'        : 'پاتې' },
                  { key: 'latest',  label: lang === 'dari' ? 'آخرین پرداخت‌ها'   : 'وروستي تادیات' },
                ] as const).map(tab => (
                  <button key={tab.key} onClick={() => setPayTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                      payTab === tab.key
                        ? 'border-amber-500 text-amber-800 bg-amber-50/50'
                        : 'border-transparent text-amber-500 hover:text-amber-700 hover:bg-amber-50/30'
                    }`}>
                    {tab.label}
                    {tab.key === 'pending' && pendingContractsList.length > 0 && (
                      <span className="mr-1.5 text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                        {pendingContractsList.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <Link href="/orders"
                className="text-amber-500 text-xs hover:text-amber-700 flex items-center gap-1 pb-2.5 transition-colors">
                {lang === 'dari' ? 'همه سفارش‌ها' : 'ټول سفارشونه'}<ChevronLeft className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4">
              {payTab === 'pending' && (
                pendingContractsList.length === 0
                  ? (
                    <div className="empty-state">
                      <CheckCircle className="w-10 h-10 text-green-400" />
                      <p className="text-sm">{lang === 'dari' ? 'هیچ پرداخت باقی‌مانده‌ای وجود ندارد' : 'هیڅ پاتې تادیه نشته'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {pendingContractsList.map((c: any) => (
                        <div key={c.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="font-mono text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                                {c.contractNumber}
                              </span>
                            </div>
                            <p className="font-medium text-amber-900 text-sm truncate">{c.customer?.fullName}</p>
                            <p className="text-xs text-amber-500">{c.car?.carName} — {c.car?.plateNumber}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-amber-500">{t.remainingAmount}</p>
                            <p className="text-base font-bold text-red-600 whitespace-nowrap">
                              {formatCurrency(c.remainingAmount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              )}

              {payTab === 'latest' && (
                recentPaymentsList.length === 0
                  ? <div className="empty-state"><p className="text-sm">{t.noData}</p></div>
                  : (
                    <div className="table-wrapper">
                      <table className="w-full table-golden min-w-[420px]">
                        <thead>
                          <tr>
                            <th className="px-3 py-2.5 text-right text-xs">{t.contractNo}</th>
                            <th className="px-3 py-2.5 text-right text-xs">{t.customer}</th>
                            <th className="px-3 py-2.5 text-right text-xs">{t.amount}</th>
                            <th className="px-3 py-2.5 text-right text-xs">{t.date}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPaymentsList.map((p: any) => (
                            <tr key={p.id} className="border-b border-amber-100">
                              <td className="px-3 py-2 text-xs font-mono text-amber-600">
                                {p.rentalContract?.contractNumber}
                              </td>
                              <td className="px-3 py-2 text-xs">{p.rentalContract?.customer?.fullName}</td>
                              <td className="px-3 py-2 text-xs font-bold text-green-700">{formatCurrency(p.amount)}</td>
                              <td className="px-3 py-2 text-xs text-amber-500">{formatAfghanDate(p.paymentDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
              )}
            </div>
          </div>

          {/* Monthly income bar chart — 1/3 width */}
          <div className="card-golden rounded-2xl p-5">
            <h3 className="font-bold text-amber-900 mb-4">{t.monthlyIncome}</h3>
            {stats?.monthlyIncome && Object.keys(stats.monthlyIncome).length > 0 ? (
              <div className="space-y-3.5">
                {Object.entries(stats.monthlyIncome).slice(-6).reverse().map(([month, amount]: any) => {
                  const max = Math.max(...(Object.values(stats.monthlyIncome) as number[]));
                  const pct = max > 0 ? Math.round((amount / max) * 100) : 0;
                  return (
                    <div key={month}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-amber-600 font-medium">{month}</span>
                        <span className="text-xs font-semibold text-amber-900">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#fbbf24,#d97706)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-amber-400 text-sm text-center py-6">{t.noData}</p>
            )}
          </div>
        </div>

        {/* ── Recent contracts table ─────────────────────────────── */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-amber-100 flex justify-between items-center">
            <h3 className="font-bold text-amber-900">{t.recentContracts}</h3>
            <Link href="/orders"
              className="text-amber-600 text-sm hover:text-amber-800 transition-colors flex items-center gap-1">
              {t.view}<ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="w-full table-golden">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-right text-sm">{t.contractNo}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.customer}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.car}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.totalRent}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.remainingAmount}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentContracts?.map((c: any) => (
                  <tr key={c.id} className="border-b border-amber-100">
                    <td className="px-4 py-3 text-sm font-mono text-amber-800">{c.contractNumber}</td>
                    <td className="px-4 py-3 text-sm">{c.customer?.fullName}</td>
                    <td className="px-4 py-3 text-sm">{c.car?.carName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-900">{formatCurrency(c.totalRent)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">{formatCurrency(c.remainingAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabel[c.status]?.cls}`}>
                        {statusLabel[c.status]?.[lang] || c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!stats?.recentContracts?.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-amber-400 text-sm">{t.noData}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
