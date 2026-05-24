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
  User, ArrowUpDown, Filter, Scissors, UserCheck, ShieldCheck,
  Eye, Camera, FileText, ChevronDown, ZoomIn,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  fromWhom: string;
  toWhom: string;
  amount: number;
  adminShare: number;
  ownerShare: number;
  date: string;
  description?: string;
  carId?: string;
  createdBy: string;
  createdAt: string;
  receiptPhoto?: string;
  car?: { id: string; carName: string; plateNumber: string; ownerId?: string; owner?: { id: string; fullName: string } | null } | null;
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

type ReportPeriod = 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  all:     'همه مصارف',
  daily:   'گزارش روزانه',
  weekly:  'گزارش هفتگی',
  monthly: 'گزارش ماهانه',
  yearly:  'گزارش سالانه',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function getPeriodRange(period: ReportPeriod): { dateFrom?: string; dateTo?: string; label: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().split('T')[0];
  if (period === 'daily') {
    const s = iso(now);
    return { dateFrom: s, dateTo: s, label: `امروز — ${formatAfghanDate(now.toISOString())}` };
  }
  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { dateFrom: iso(start), dateTo: iso(now), label: `این هفته — ${formatAfghanDate(start.toISOString())} تا ${formatAfghanDate(now.toISOString())}` };
  }
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: iso(start), dateTo: iso(now), label: `این ماه — ${formatAfghanDate(start.toISOString())} تا ${formatAfghanDate(now.toISOString())}` };
  }
  if (period === 'yearly') {
    const start = new Date(now.getFullYear(), 0, 1);
    return { dateFrom: iso(start), dateTo: iso(now), label: `این سال — ${formatAfghanDate(start.toISOString())} تا ${formatAfghanDate(now.toISOString())}` };
  }
  return { label: 'تمام دوره‌ها' };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { t, token, user, lang } = useApp();
  const router = useRouter();

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
  const imgUrl = (p?: string | null) => (p ? `${API_BASE}${p}` : null);

  // Data
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [cars, setCars]           = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // UI state
  const [loading, setLoading]         = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);
  const [receiptLightbox, setReceiptLightbox] = useState<string | null>(null);

  // Receipt upload
  const [receiptFile, setReceiptFile]       = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [sortBy, setSortBy]     = useState('date');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');
  const [page, setPage]         = useState(1);

  // Print
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('all');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [printLoading, setPrintLoading]   = useState(false);
  const periodMenuRef = useRef<HTMLDivElement>(null);

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

  // Close period dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(e.target as Node)) {
        setShowPeriodMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    setReceiptFile(null);
    setReceiptPreview(null);
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
    setReceiptFile(null);
    setReceiptPreview(exp.receiptPhoto ? imgUrl(exp.receiptPhoto) : null);
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

  const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('حجم فایل نباید بیشتر از 5MB باشد'); return; }
    setReceiptFile(f);
    setReceiptPreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const baseData = {
        fromWhom: form.fromWhom.trim(),
        toWhom: form.toWhom.trim(),
        amount: form.amount,
        date: form.date,
        description: form.description.trim() || undefined,
        carId: form.carId || undefined,
      };

      let payload: FormData | typeof baseData;
      if (receiptFile) {
        const fd = new FormData();
        Object.entries(baseData).forEach(([k, v]) => v !== undefined && fd.append(k, v));
        fd.append('receiptPhoto', receiptFile);
        payload = fd;
      } else {
        payload = baseData;
      }

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

  const handlePrint = async () => {
    setPrintLoading(true);
    let reportExpenses = expenses;
    const { dateFrom: df, dateTo: dt, label: periodLabel } = getPeriodRange(reportPeriod);

    if (reportPeriod !== 'all') {
      try {
        const res = await expensesAPI.getAll({
          limit: 9999,
          dateFrom: df,
          dateTo: dt,
          sortBy: 'date',
          sortDir: 'asc',
        });
        reportExpenses = res.data.data.expenses;
      } catch { /* fallback to current page */ }
    }
    setPrintLoading(false);

    const win = window.open('', '_blank');
    if (!win) return;

    const totalAmount = reportExpenses.reduce((s, e) => s + e.amount, 0);
    const totalAdmin  = reportExpenses.reduce((s, e) => s + (e.adminShare || 0), 0);
    const totalOwner  = reportExpenses.reduce((s, e) => s + (e.ownerShare || 0), 0);

    const rows = reportExpenses.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${e.fromWhom}</td>
        <td>${e.toWhom}</td>
        <td style="direction:ltr;text-align:center">${formatNumber(e.amount)} ؋</td>
        <td>${formatAfghanDate(e.date)}</td>
        <td>${e.description || '—'}</td>
        <td>${e.car ? `${e.car.carName}<br><span style="font-size:10px;color:#6b7280">${e.car.plateNumber}</span>` : '—'}</td>
        <td style="direction:ltr;text-align:center">${formatNumber(e.adminShare || 0)}</td>
        <td style="direction:ltr;text-align:center">${formatNumber(e.ownerShare || 0)}</td>
        <td>${e.createdBy}</td>
      </tr>`).join('');

    win.document.write(`
      <!DOCTYPE html><html dir="rtl"><head>
      <meta charset="utf-8">
      <title>${PERIOD_LABELS[reportPeriod]} — مصارف روزانه</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 20px; direction: rtl; color: #1a1a1a; }
        .header { border-bottom: 3px solid #d97706; padding-bottom: 12px; margin-bottom: 16px; }
        h2 { color: #92400e; margin: 0 0 4px; font-size: 20px; }
        .subtitle { color: #6b7280; font-size: 13px; }
        .period-badge { display:inline-block; background:#fef3c7; border:1px solid #fbbf24; color:#92400e; border-radius:6px; padding:2px 10px; font-size:12px; font-weight:bold; margin-bottom:8px; }
        .summary { display: flex; gap: 16px; margin: 14px 0; flex-wrap: wrap; }
        .stat { background: #fef3c7; padding: 10px 16px; border-radius: 8px; border: 1px solid #fde68a; min-width: 130px; }
        .stat span { font-size: 11px; color: #92400e; display:block; margin-bottom:2px; }
        .stat strong { font-size: 17px; color: #78350f; display:block; }
        .stat.admin strong { color: #1d4ed8; }
        .stat.owner strong { color: #047857; }
        table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 12px; }
        th { background: #b45309; color: white; padding: 8px 6px; border: 1px solid #92400e; text-align: right; }
        td { padding: 6px; border: 1px solid #fde68a; text-align: right; vertical-align: top; }
        tr:nth-child(even) { background: #fefce8; }
        tr:hover { background: #fef9e7; }
        .footer-note { margin-top: 16px; color: #6b7280; font-size: 11px; border-top: 1px solid #fde68a; padding-top: 8px; }
        .totals-row { background: #fef3c7 !important; font-weight: bold; border-top: 2px solid #d97706; }
        @media print { @page { margin: 10mm; } body { margin: 0; } }
      </style>
      </head><body>
      <div class="header">
        <h2>مرکز کرایه موتر افشار — گزارش مصارف روزانه</h2>
        <div class="subtitle">تاریخ چاپ: ${formatAfghanDate(new Date().toISOString())}</div>
      </div>
      <div class="period-badge">${PERIOD_LABELS[reportPeriod]}: ${periodLabel}</div>
      <div class="summary">
        <div class="stat"><span>مجموع مصارف</span><strong>${formatNumber(totalAmount)} ؋</strong></div>
        <div class="stat admin"><span>سهم ادمین</span><strong>${formatNumber(totalAdmin)} ؋</strong></div>
        <div class="stat owner"><span>سهم صاحبان موتر</span><strong>${formatNumber(totalOwner)} ؋</strong></div>
        <div class="stat"><span>تعداد ردیف‌ها</span><strong>${reportExpenses.length} ردیف</strong></div>
      </div>
      <table>
        <thead><tr>
          <th style="width:32px">#</th>
          <th>از طرف کی</th><th>به کی</th>
          <th style="width:100px">مقدار (؋)</th>
          <th style="width:90px">تاریخ</th>
          <th>توضیحات</th><th>موتر</th>
          <th style="width:80px">سهم ادمین</th>
          <th style="width:80px">سهم صاحب</th>
          <th>ثبت توسط</th>
        </tr></thead>
        <tbody>
          ${rows}
          <tr class="totals-row">
            <td colspan="3" style="text-align:center">مجموع کل</td>
            <td style="direction:ltr;text-align:center">${formatNumber(totalAmount)} ؋</td>
            <td colspan="3"></td>
            <td style="direction:ltr;text-align:center">${formatNumber(totalAdmin)}</td>
            <td style="direction:ltr;text-align:center">${formatNumber(totalOwner)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="footer-note">مجموع ردیف‌های این گزارش: ${reportExpenses.length} | دوره: ${periodLabel}</div>
      </body></html>`);
    win.document.close();
    win.print();
  };

  // ── Input helpers ──────────────────────────────────────────────────────────

  const inp = (field: string) =>
    `w-full px-3 py-2.5 rounded-xl input-golden text-sm ${errors[field] ? 'border-red-400 bg-red-50' : ''}`;
  const lbl = 'block text-sm font-medium text-amber-800 mb-1';

  // ── 50/50 split preview ────────────────────────────────────────────────────

  const parsedModalAmount = parseFloat(form.amount) || 0;
  const selectedCar       = cars.find(c => c.id === form.carId);
  const carHasOwner       = !!(selectedCar?.ownerId);
  const splitAdminShare   = Math.round(parsedModalAmount * 0.5 * 100) / 100;
  const splitOwnerShare   = Math.round((parsedModalAmount - splitAdminShare) * 100) / 100;
  const showSplitPreview  = form.carId && parsedModalAmount > 0;

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

            {/* ── Print Report with period dropdown ── */}
            <div className="relative" ref={periodMenuRef}>
              <div className="flex items-center rounded-xl border border-amber-300 overflow-hidden">
                <button
                  onClick={handlePrint}
                  disabled={printLoading}
                  className="flex items-center gap-2 px-3 py-2 text-amber-700 text-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  {printLoading
                    ? <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    : <Printer className="w-4 h-4" />}
                  {t.printReport}
                </button>
                <div className="w-px h-6 bg-amber-200" />
                <button
                  onClick={() => setShowPeriodMenu(v => !v)}
                  className="flex items-center gap-1 px-2 py-2 text-amber-600 text-xs hover:bg-amber-50 transition-colors"
                >
                  <span className="hidden sm:inline font-medium">{PERIOD_LABELS[reportPeriod]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showPeriodMenu && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl border border-amber-200 shadow-xl z-50 overflow-hidden">
                  {(Object.entries(PERIOD_LABELS) as [ReportPeriod, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setReportPeriod(key); setShowPeriodMenu(false); }}
                      className={`w-full text-right px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors flex items-center gap-2
                        ${reportPeriod === key ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-amber-800'}`}
                    >
                      {reportPeriod === key && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${showFilters ? 'bg-amber-500 text-white' : 'border border-amber-300 text-amber-700 hover:bg-amber-50'}`}>
              <Filter className="w-4 h-4" />
              {showFilters ? 'بستن فلتر' : t.filter}
              {(dateFrom || dateTo) && !showFilters && <span className="w-2 h-2 rounded-full bg-red-500" />}
            </button>
          </div>
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
            <table className="w-full table-golden min-w-[820px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-right text-sm w-10">#</th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none" onClick={() => handleSort('fromWhom')}>
                    {t.fromWhom}<SortIcon field="fromWhom" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none" onClick={() => handleSort('toWhom')}>
                    {t.toWhom}<SortIcon field="toWhom" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none" onClick={() => handleSort('amount')}>
                    {t.expenseAmount}<SortIcon field="amount" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm cursor-pointer hover:text-amber-700 select-none" onClick={() => handleSort('date')}>
                    {t.expenseDate}<SortIcon field="date" />
                  </th>
                  <th className="px-4 py-3 text-right text-sm">{t.expenseDescription}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.expenseRelatedCar}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.expenseCreatedBy}</th>
                  <th className="px-4 py-3 text-right text-sm w-28">{t.actions}</th>
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
                    <td className="px-4 py-3 text-sm text-amber-500">{(page - 1) * 20 + i + 1}</td>
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
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg block w-fit">
                          {formatNumber(exp.amount)} {t.currency}
                        </span>
                        {exp.carId && (exp.adminShare > 0 || exp.ownerShare > 0) && (
                          <div className="flex gap-1 flex-wrap">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                              ادمین: {formatNumber(exp.adminShare)}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 font-medium">
                              صاحب: {formatNumber(exp.ownerShare)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-700">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {formatAfghanDate(exp.date)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-600 max-w-[140px] truncate">
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
                        <button onClick={() => setDetailExpense(exp)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="مشاهده جزئیات">
                          <Eye className="w-4 h-4" />
                        </button>
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

      {/* ══════════════════════════════════════════════════════
          Add / Edit Modal
      ══════════════════════════════════════════════════════ */}
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

          {/* مقدار */}
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

          {/* Created By */}
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

          {/* ── Receipt Photo Upload ── */}
          <div className="sm:col-span-2">
            <label className={lbl}>رسید / فاکتور مصرف</label>
            <div className="flex items-start gap-4">
              {receiptPreview ? (
                <div className="relative shrink-0">
                  <img
                    src={receiptPreview}
                    alt="رسید"
                    className="h-28 w-28 object-cover rounded-xl border-2 border-amber-200 shadow-sm cursor-zoom-in"
                    onClick={() => setReceiptLightbox(receiptPreview)}
                  />
                  <button
                    type="button"
                    onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => receiptInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md hover:bg-amber-600 transition-colors"
                    title="تغییر تصویر"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => receiptInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-28 h-28 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 hover:border-amber-500 hover:bg-amber-50 transition-all cursor-pointer shrink-0"
                >
                  <Camera className="w-6 h-6 text-amber-400 mb-1.5" />
                  <span className="text-xs text-amber-600 font-medium text-center px-2">آپلود رسید</span>
                </button>
              )}
              <div className="text-xs text-amber-500 space-y-1 mt-2">
                <p className="font-medium text-amber-700">آپلود رسید / فاکتور مصرف</p>
                <p>• فرمت مجاز: JPG, PNG, WEBP</p>
                <p>• حداکثر حجم: 5MB</p>
                <p>• اختیاری — برای مستندسازی مصرف</p>
              </div>
            </div>
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleReceiptFile}
            />
          </div>

          {/* ── 50/50 Split Preview ── */}
          {showSplitPreview && (
            <div className="sm:col-span-2">
              <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3"
                  style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                  <Scissors className="w-4 h-4 text-white" />
                  <h4 className="text-sm font-bold text-white">تقسیم خودکار مصرف (۵۰٪ / ۵۰٪)</h4>
                </div>
                <div className="grid grid-cols-3 gap-0 divide-x divide-x-reverse divide-emerald-100 bg-white">
                  <div className="p-4 text-center">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                      style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}>
                      <Wallet className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs text-gray-500 mb-1">مجموع مصرف</p>
                    <p className="text-lg font-black text-gray-800" dir="ltr">{formatNumber(parsedModalAmount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">افغانی</p>
                  </div>
                  <div className="p-4 text-center bg-amber-50/60">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                      style={{ background: 'linear-gradient(135deg,#fbbf24,#d97706)' }}>
                      <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-amber-700 font-semibold mb-1">سهم ادمین (۵۰٪)</p>
                    <p className="text-lg font-black text-amber-900" dir="ltr">{formatNumber(splitAdminShare)}</p>
                    <p className="text-xs text-amber-500 mt-0.5">افغانی</p>
                  </div>
                  <div className="p-4 text-center bg-teal-50/60">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                      style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
                      <UserCheck className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-teal-700 font-semibold mb-1">سهم صاحب موتر (۵۰٪)</p>
                    <p className="text-lg font-black text-teal-900" dir="ltr">{formatNumber(splitOwnerShare)}</p>
                    <p className="text-xs text-teal-500 mt-0.5">افغانی</p>
                  </div>
                </div>
                <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-medium ${carHasOwner ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${carHasOwner ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  {carHasOwner
                    ? `اعلان کسر ${formatNumber(splitOwnerShare)} افغانی به صاحب موتر "${selectedCar?.carName}" ارسال خواهد شد`
                    : `این موتر صاحب ثبت‌شده ندارد — هیچ اعلانی ارسال نخواهد شد`}
                </div>
              </div>
            </div>
          )}
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

      {/* ══════════════════════════════════════════════════════
          Expense Detail Modal
      ══════════════════════════════════════════════════════ */}
      {detailExpense && (
        <Modal
          open={!!detailExpense}
          onClose={() => setDetailExpense(null)}
          title="جزئیات مصرف"
          size="lg"
        >
          <div className="space-y-5">

            {/* Header summary */}
            <div className="flex items-center justify-between p-4 rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}>
              <div>
                <p className="text-xs text-amber-600 font-medium mb-0.5">مجموع مصرف</p>
                <p className="text-3xl font-black text-amber-900" dir="ltr">
                  {formatNumber(detailExpense.amount)} <span className="text-lg font-normal">افغانی</span>
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-sm text-amber-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  {formatAfghanDate(detailExpense.date)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <User className="w-3.5 h-3.5" />
                  ثبت توسط: {detailExpense.createdBy}
                </div>
              </div>
            </div>

            {/* Main info table */}
            <div className="rounded-2xl border border-amber-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: 'از طرف کی', value: detailExpense.fromWhom, icon: '👤' },
                    { label: 'به کی', value: detailExpense.toWhom, icon: '👤' },
                    { label: 'مقدار', value: `${formatNumber(detailExpense.amount)} افغانی`, icon: '💰', ltr: true },
                    { label: 'تاریخ', value: formatAfghanDate(detailExpense.date), icon: '📅' },
                    { label: 'موتر مرتبط', value: detailExpense.car ? `${detailExpense.car.carName} (${detailExpense.car.plateNumber})` : '—', icon: '🚗' },
                    { label: 'توضیحات', value: detailExpense.description || '—', icon: '📝' },
                    { label: 'ثبت توسط', value: detailExpense.createdBy, icon: '👔' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                      <td className="px-4 py-3 font-semibold text-amber-700 whitespace-nowrap border-b border-amber-100 w-36">
                        <span className="mr-1">{row.icon}</span> {row.label}
                      </td>
                      <td className={`px-4 py-3 text-amber-900 border-b border-amber-100 ${row.ltr ? 'dir-ltr text-left' : ''}`}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cost split breakdown */}
            {detailExpense.carId && (detailExpense.adminShare > 0 || detailExpense.ownerShare > 0) && (
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                  تقسیم مصرف (۵۰٪ / ۵۰٪)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">سهم ادمین</span>
                    </div>
                    <span className="font-bold text-amber-900 text-sm" dir="ltr">{formatNumber(detailExpense.adminShare)} ؋</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50 border border-teal-200">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-semibold text-teal-800">سهم صاحب موتر</span>
                    </div>
                    <span className="font-bold text-teal-900 text-sm" dir="ltr">{formatNumber(detailExpense.ownerShare)} ؋</span>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Photo */}
            {detailExpense.receiptPhoto && (
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                  رسید / فاکتور مصرف
                </p>
                <div
                  className="relative group cursor-zoom-in rounded-2xl overflow-hidden border-2 border-amber-200 shadow-sm"
                  onClick={() => setReceiptLightbox(imgUrl(detailExpense.receiptPhoto)!)}
                >
                  <img
                    src={imgUrl(detailExpense.receiptPhoto)!}
                    alt="رسید مصرف"
                    className="w-full max-h-72 object-contain bg-amber-50 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <div className="w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-amber-700" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setDetailExpense(null); openEdit(detailExpense); }}
                className="flex-1 flex items-center justify-center gap-2 btn-secondary py-2.5 rounded-xl text-sm font-medium"
              >
                <Edit className="w-4 h-4" /> ویرایش
              </button>
              <button
                onClick={() => setDetailExpense(null)}
                className="flex-1 btn-primary py-2.5 rounded-xl text-sm font-medium"
              >
                بستن
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId!)}
        message="آیا از حذف این مصرف مطمئن هستید؟ این عملیات قابل بازگشت نیست." />

      {/* ── Receipt Lightbox ─────────────────────────────────────── */}
      {receiptLightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReceiptLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
            onClick={() => setReceiptLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={receiptLightbox}
            alt="رسید مصرف"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </MainLayout>
  );
}
