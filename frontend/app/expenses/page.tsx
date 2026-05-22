'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatCard from '@/components/ui/StatCard';
import { useApp } from '@/lib/context';
import { expensesAPI, carsAPI } from '@/lib/api';
import { formatAfghanDate, formatNumber, numericInputHandler } from '@/lib/utils';
import {
  Plus, Search, Edit, Trash2, Wallet, Calendar,
  Printer, ChevronLeft, ChevronRight, SlidersHorizontal,
  X, TrendingDown, DollarSign, BarChart3, CalendarDays,
  User, ArrowUpDown, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  fromWhom: string;
  toWhom: string;
  amount: number;
  date: string;
  description?: string;
  carId?: string;
  createdBy: string;
  createdAt: string;
  car?: { id: string; carName: string; plateNumber: string } | null;
}

interface Stats {
  today:  { amount: number; count: number };
  week:   { amount: number; count: number };
  month:  { amount: number; count: number };
  total:  { amount: number; count: number };
}

interface Pagination {
  total: number; page: number; limit: number; totalPages: number;
}

const emptyForm = {
  fromWhom: '', toWhom: '', amount: '', date: new Date().toISOString().split('T')[0],
  description: '', carId: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { t, token, user, lang } = useApp();
  const router = useRouter();

  // Data
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [cars, setCars]           = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // UI state
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  // Filters
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [sortBy, setSortBy]     = useState('date');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');
  const [page, setPage]         = useState(1);

  // Debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (!token) router.push('/'); }, [token]);

  useEffect(() => { if (token) { fetchStats(); fetchCars(); } }, [token]);

  useEffect(() => {
    if (!token) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchExpenses(1); }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, dateFrom, dateTo, sortBy, sortDir, token]);

  useEffect(() => { if (token) fetchExpenses(page); }, [page]);

  // ── API calls ──────────────────────────────────────────────────────────────

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await expensesAPI.getStats();
      setStats(res.data.data);
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  };

  const fetchExpenses = async (p: number) => {
    setLoading(true);
    try {
      const res = await expensesAPI.getAll({
        page: p, limit: 20,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy, sortDir,
      });
      setExpenses(res.data.data.expenses);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally { setLoading(false); }
  };

  const fetchCars = async () => {
    try {
      const res = await carsAPI.getAll();
      setCars(res.data.data || []);
    } catch { /* silent */ }
  };

  // ── Modal ──────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditExpense(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditExpense(exp);
    setForm({
      fromWhom: exp.fromWhom,
      toWhom: exp.toWhom,
      amount: String(exp.amount),
      date: exp.date.split('T')[0],
      description: exp.description || '',
      carId: exp.carId || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fromWhom.trim()) errs.fromWhom = 'از طرف کی الزامی است';
    if (!form.toWhom.trim())   errs.toWhom   = 'به کی الزامی است';
    if (!form.amount)          errs.amount   = 'مقدار پول الزامی است';
    else if (parseFloat(form.amount) <= 0) errs.amount = 'مقدار باید مثبت باشد';
    if (!form.date)            errs.date     = 'تاریخ الزامی است';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        fromWhom: form.fromWhom.trim(),
        toWhom: form.toWhom.trim(),
        amount: form.amount,
        date: form.date,
        description: form.description.trim() || undefined,
        carId: form.carId || undefined,
      };
      if (editExpense) await expensesAPI.update(editExpense.id, payload);
      else             await expensesAPI.create(payload);
      toast.success(t.expenseSaved);
      setModalOpen(false);
      fetchExpenses(1); setPage(1);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await expensesAPI.delete(id);
      toast.success(t.expenseDeleted);
      fetchExpenses(page);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    }
  };

  // ── Sorting ────────────────────────────────────────────────────────────────

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <ArrowUpDown className={`w-3 h-3 inline ml-1 ${sortBy === field ? 'text-amber-500' : 'text-amber-300/50'}`} />
  );

  // ── Print ──────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rows = expenses.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${e.fromWhom}</td>
        <td>${e.toWhom}</td>
        <td style="direction:ltr">${formatNumber(e.amount)} ؋</td>
        <td>${formatAfghanDate(e.date)}</td>
        <td>${e.description || '—'}</td>
        <td>${e.car ? `${e.car.carName} (${e.car.plateNumber})` : '—'}</td>
        <td>${e.createdBy}</td>
      </tr>`).join('');
    win.document.write(`
      <!DOCTYPE html><html dir="rtl"><head>
      <meta charset="utf-8">
      <title>گزارش مصارف روزانه</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 20px; direction: rtl; }
        h2 { color: #92400e; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
        th { background: #f59e0b; color: white; padding: 8px 6px; }
        td { padding: 6px; border-bottom: 1px solid #fde68a; }
        tr:nth-child(even) { background: #fef9f0; }
        .summary { display: flex; gap: 24px; margin: 12px 0; flex-wrap: wrap; }
        .stat { background: #fef3c7; padding: 10px 16px; border-radius: 8px; }
        .stat strong { display: block; font-size: 18px; color: #92400e; }
      </style>
      </head><body>
      <h2>گزارش مصارف روزانه — مرکز کرایه موتر افشار</h2>
      <p>تاریخ چاپ: ${formatAfghanDate(new Date().toISOString())}</p>
      ${stats ? `<div class="summary">
        <div class="stat"><span>امروز</span><strong>${formatNumber(stats.today.amount)} ؋</strong></div>
        <div class="stat"><span>این هفته</span><strong>${formatNumber(stats.week.amount)} ؋</strong></div>
        <div class="stat"><span>این ماه</span><strong>${formatNumber(stats.month.amount)} ؋</strong></div>
        <div class="stat"><span>مجموع</span><strong>${formatNumber(stats.total.amount)} ؋</strong></div>
      </div>` : ''}
      <table>
        <thead><tr>
          <th>#</th><th>از طرف کی</th><th>به کی</th><th>مقدار</th>
          <th>تاریخ</th><th>توضیحات</th><th>موتر</th><th>ثبت توسط</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px;color:#6b7280;font-size:11px">مجموع ردیف‌های نمایش داده شده: ${expenses.length}</p>
      </body></html>`);
    win.document.close();
    win.print();
  };

  // ── Input class ────────────────────────────────────────────────────────────

  const inp = (field: string) =>
    `w-full px-3 py-2.5 rounded-xl input-golden text-sm ${errors[field] ? 'border-red-400 bg-red-50' : ''}`;
  const lbl = 'block text-sm font-medium text-amber-800 mb-1';

  // ── Stat cards ─────────────────────────────────────────────────────────────

  const statCards = [
    { title: t.todayExpenses,  value: statsLoading ? '...' : `${formatNumber(stats?.today.amount ?? 0)} ${t.currency}`,  icon: CalendarDays,  color: 'linear-gradient(135deg,#f59e0b,#d97706)',  sub: statsLoading ? '' : `${stats?.today.count ?? 0} ردیف` },
    { title: t.weekExpenses,   value: statsLoading ? '...' : `${formatNumber(stats?.week.amount  ?? 0)} ${t.currency}`,  icon: BarChart3,     color: 'linear-gradient(135deg,#3b82f6,#2563eb)',  sub: statsLoading ? '' : `${stats?.week.count  ?? 0} ردیف` },
    { title: t.monthExpenses,  value: statsLoading ? '...' : `${formatNumber(stats?.month.amount ?? 0)} ${t.currency}`,  icon: TrendingDown,  color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',  sub: statsLoading ? '' : `${stats?.month.count ?? 0} ردیف` },
    { title: t.totalExpenses,  value: statsLoading ? '...' : `${formatNumber(stats?.total.amount ?? 0)} ${t.currency}`,  icon: Wallet,        color: 'linear-gradient(135deg,#10b981,#059669)',  sub: statsLoading ? '' : `${stats?.total.count ?? 0} ردیف` },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="space-y-5 page-enter">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-900">{t.expenses}</h2>
              <p className="text-sm text-amber-600">{pagination.total} ردیف ثبت شده</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 text-amber-700 text-sm hover:bg-amber-50 transition-colors">
              <Printer className="w-4 h-4" />{t.printReport}
            </button>
            <button onClick={openAdd}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />{t.addExpense}
            </button>
          </div>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(c => (
            <StatCard key={c.title} title={c.title} value={c.value} icon={c.icon}
              color={c.color} subtitle={c.sub} />
          ))}
        </div>

        {/* ── Search + Filter Bar ─────────────────────────────────── */}
        <div className="card-golden rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pr-10 pl-4 py-2 rounded-xl input-golden text-sm" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${showFilters ? 'bg-amber-500 text-white' : 'border border-amber-300 text-amber-700 hover:bg-amber-50'}`}>
              <Filter className="w-4 h-4" />
              {showFilters ? 'بستن فلتر' : t.filter}
              {(dateFrom || dateTo) && !showFilters && (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-amber-200/60">
              <div>
                <label className="block text-xs text-amber-700 mb-1">{t.dateFrom}</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="px-3 py-2 rounded-xl input-golden text-sm" />
              </div>
              <div>
                <label className="block text-xs text-amber-700 mb-1">{t.dateTo}</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="px-3 py-2 rounded-xl input-golden text-sm" />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                  <X className="w-3.5 h-3.5" />پاک کردن
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-golden min-w-[780px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-right text-sm w-10">#</th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none"
                    onClick={() => handleSort('fromWhom')}>
                    {t.fromWhom}<SortIcon field="fromWhom" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none"
                    onClick={() => handleSort('toWhom')}>
                    {t.toWhom}<SortIcon field="toWhom" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none"
                    onClick={() => handleSort('amount')}>
                    {t.expenseAmount}<SortIcon field="amount" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none"
                    onClick={() => handleSort('date')}>
                    {t.expenseDate}<SortIcon field="date" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm">{t.expenseDescription}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.expenseRelatedCar}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.expenseCreatedBy}</th>
                  <th className="px-4 py-3 text-right text-sm w-20">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-amber-100">
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Wallet className="w-12 h-12 text-amber-200" />
                        <p className="text-amber-400 text-sm">{t.noExpenses}</p>
                      </div>
                    </td>
                  </tr>
                ) : expenses.map((exp, i) => (
                  <tr key={exp.id} className="border-b border-amber-100 hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-amber-500">
                      {(page - 1) * 20 + i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}>
                          <User className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-amber-900">{exp.fromWhom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-800 font-medium">{exp.toWhom}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {formatNumber(exp.amount)} {t.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-700">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {formatAfghanDate(exp.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-600 max-w-[160px] truncate">
                      {exp.description || <span className="text-amber-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-600">
                      {exp.car
                        ? <span className="px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-700">{exp.car.carName}</span>
                        : <span className="text-amber-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-600">{exp.createdBy}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(exp)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors" title={t.edit}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(exp.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title={t.delete}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-amber-100">
              <p className="text-xs text-amber-600">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} از {pagination.total} ردیف
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
                {[...Array(pagination.totalPages)].map((_, idx) => {
                  const p = idx + 1;
                  if (pagination.totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== pagination.totalPages) {
                    if (p === 2 || p === pagination.totalPages - 1) return <span key={p} className="px-1 text-amber-400 text-xs">…</span>;
                    return null;
                  }
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-600 hover:bg-amber-50 border border-amber-200'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editExpense ? t.editExpense : t.addExpense}
        size="lg">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* از طرف کی */}
          <div>
            <label className={lbl}>{t.fromWhom} *</label>
            <input value={form.fromWhom}
              onChange={e => setForm({ ...form, fromWhom: e.target.value })}
              className={inp('fromWhom')}
              placeholder="نام شخص یا منبع پرداخت کننده" />
            {errors.fromWhom && <p className="text-red-500 text-xs mt-1">{errors.fromWhom}</p>}
          </div>

          {/* به کی */}
          <div>
            <label className={lbl}>{t.toWhom} *</label>
            <input value={form.toWhom}
              onChange={e => setForm({ ...form, toWhom: e.target.value })}
              className={inp('toWhom')}
              placeholder="نام شخص یا مقصد دریافت کننده" />
            {errors.toWhom && <p className="text-red-500 text-xs mt-1">{errors.toWhom}</p>}
          </div>

          {/* مقدار پول */}
          <div>
            <label className={lbl}>{t.expenseAmount} ({t.currency}) *</label>
            <input value={form.amount}
              onChange={numericInputHandler(v => setForm({ ...form, amount: v }))}
              className={inp('amount')}
              placeholder="0"
              dir="ltr"
              inputMode="decimal" />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* تاریخ */}
          <div>
            <label className={lbl}>{t.expenseDate} *</label>
            <input type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className={inp('date')}
              max={todayISO()} />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
          </div>

          {/* موتر مرتبط */}
          <div>
            <label className={lbl}>{t.expenseRelatedCar}</label>
            <select value={form.carId} onChange={e => setForm({ ...form, carId: e.target.value })}
              className={inp('carId')}>
              <option value="">— {t.optional} —</option>
              {cars.map(c => (
                <option key={c.id} value={c.id}>{c.carName} ({c.plateNumber})</option>
              ))}
            </select>
          </div>

          {/* Created By — auto-filled, shown as read-only */}
          <div>
            <label className={lbl}>{t.expenseCreatedBy}</label>
            <input
              value={editExpense?.createdBy || (user as any)?.name || (user as any)?.email || 'مدیر سیستم'}
              readOnly
              className="w-full px-3 py-2.5 rounded-xl input-golden text-sm opacity-60 cursor-not-allowed" />
          </div>

          {/* توضیحات */}
          <div className="sm:col-span-2">
            <label className={lbl}>{t.expenseDescription}</label>
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={`${inp('description')} resize-none`}
              placeholder="توضیحات اضافی در مورد این مصرف..." />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={() => setModalOpen(false)}
            className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">{t.cancel}</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">
            {saving ? t.loading : t.save}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirm ───────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId!)}
        message="آیا از حذف این مصرف مطمئن هستید؟ این عملیات قابل بازگشت نیست." />
    </MainLayout>
  );
}
