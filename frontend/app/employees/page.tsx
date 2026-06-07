"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatCard from "@/components/ui/StatCard";
import { useApp } from "@/lib/context";
import { employeesAPI } from "@/lib/api";
import {
  formatAfghanDate,
  formatKabulIso,
  formatNumber,
  numericInputHandler,
} from "@/lib/utils";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
  DollarSign,
  BarChart3,
  CalendarDays,
  History,
  User,
  Eye,
  FileText,
  Banknote,
  Wallet,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  fullName: string;
  fatherName: string;
  grandfatherName?: string | null;
  tazkiraNumber: string;
  baseSalary: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
  _count?: { salaryPayments: number };
}

interface SalaryPayment {
  id: string;
  employeeId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string | null;
  notes?: string | null;
  receiptNumber: string;
  createdBy: string;
  createdAt: string;
  employee?: {
    fullName: string;
    fatherName: string;
    tazkiraNumber: string;
    baseSalary: number;
  };
}

interface Stats {
  employeeCount: number;
  allTime: { amount: number; count: number };
  thisMonth: { amount: number; count: number };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const emptyEmpForm = {
  fullName: "",
  fatherName: "",
  grandfatherName: "",
  tazkiraNumber: "",
  baseSalary: "",
};

const emptyPayForm = {
  employeeId: "",
  amount: "",
  paymentDate: formatKabulIso(new Date()),
  paymentMethod: "cash",
  notes: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayISO = () => formatKabulIso(new Date());

const PAYMENT_METHODS: Record<string, string> = {
  cash: "نقدی",
  bank: "انتقال بانکی",
  mobile: "پول موبایل",
  other: "سایر",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmployeesPage() {
  const { t, token, user } = useApp();
  const router = useRouter();

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

  // UI
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [histModalOpen, setHistModalOpen] = useState(false);
  const [detailEmp, setDetailEmp] = useState<Employee | null>(null);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [deleteEmpId, setDeleteEmpId] = useState<string | null>(null);
  const [deletePayId, setDeletePayId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState(emptyEmpForm);
  const [payForm, setPayForm] = useState(emptyPayForm);
  const [empErrors, setEmpErrors] = useState<Record<string, string>>({});
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});

  // Payment history per employee
  const [histEmployee, setHistEmployee] = useState<Employee | null>(null);
  const [histPayments, setHistPayments] = useState<SalaryPayment[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) router.push("/");
  }, [token]);
  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchEmployees(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search, token]);

  useEffect(() => {
    if (token) fetchEmployees(page);
  }, [page]);

  // ── API ────────────────────────────────────────────────────────────────────

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await employeesAPI.getStats();
      setStats(res.data.data);
    } catch {
      /* silent */
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchEmployees = async (p: number) => {
    setLoading(true);
    try {
      const res = await employeesAPI.getAll({
        page: p,
        limit: 50,
        search: search || undefined,
      });
      setEmployees(res.data.data.employees);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (emp: Employee) => {
    setHistEmployee(emp);
    setHistPayments([]);
    setHistLoading(true);
    setHistModalOpen(true);
    try {
      const res = await employeesAPI.getPayments({
        employeeId: emp.id,
        limit: 100,
      });
      setHistPayments(res.data.data.payments);
    } catch {
      /* silent */
    } finally {
      setHistLoading(false);
    }
  };

  // ── Employee modal ─────────────────────────────────────────────────────────

  const openAddEmp = () => {
    setEditEmp(null);
    setEmpForm(emptyEmpForm);
    setEmpErrors({});
    setEmpModalOpen(true);
  };

  const openEditEmp = (emp: Employee) => {
    setEditEmp(emp);
    setEmpForm({
      fullName: emp.fullName,
      fatherName: emp.fatherName,
      grandfatherName: emp.grandfatherName || "",
      tazkiraNumber: emp.tazkiraNumber,
      baseSalary: String(emp.baseSalary),
    });
    setEmpErrors({});
    setEmpModalOpen(true);
  };

  const validateEmp = () => {
    const errs: Record<string, string> = {};
    if (!empForm.fullName.trim()) errs.fullName = "نام الزامی است";
    if (!empForm.fatherName.trim()) errs.fatherName = "نام پدر الزامی است";
    if (!empForm.tazkiraNumber.trim())
      errs.tazkiraNumber = "نمبر تذکره الزامی است";
    if (!empForm.baseSalary) errs.baseSalary = "مقدار پول الزامی است";
    else if (parseFloat(empForm.baseSalary) < 0)
      errs.baseSalary = "مقدار باید صفر یا بیشتر باشد";
    setEmpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveEmp = async () => {
    if (!validateEmp()) return;
    setSaving(true);
    try {
      const data = {
        fullName: empForm.fullName.trim(),
        fatherName: empForm.fatherName.trim(),
        grandfatherName: empForm.grandfatherName.trim() || undefined,
        tazkiraNumber: empForm.tazkiraNumber.trim(),
        baseSalary: empForm.baseSalary,
      };
      if (editEmp) await employeesAPI.update(editEmp.id, data);
      else await employeesAPI.create(data);
      toast.success(t.employeeSaved);
      setEmpModalOpen(false);
      fetchEmployees(1);
      setPage(1);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmp = async (id: string) => {
    try {
      await employeesAPI.delete(id);
      toast.success(t.employeeDeleted);
      fetchEmployees(page);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    }
  };

  // ── Payment modal ──────────────────────────────────────────────────────────

  const openPayModal = (emp: Employee) => {
    setPayForm({ ...emptyPayForm, employeeId: emp.id });
    setPayErrors({});
    setPayModalOpen(true);
  };

  const validatePay = () => {
    const errs: Record<string, string> = {};
    if (!payForm.amount) errs.amount = "مقدار پرداخت الزامی است";
    else if (parseFloat(payForm.amount) <= 0)
      errs.amount = "مقدار باید مثبت باشد";
    if (!payForm.paymentDate) errs.paymentDate = "تاریخ الزامی است";
    setPayErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePay = async () => {
    if (!validatePay()) return;
    setSaving(true);
    try {
      const res = await employeesAPI.createPayment({
        employeeId: payForm.employeeId,
        amount: payForm.amount,
        paymentDate: payForm.paymentDate,
        paymentMethod: payForm.paymentMethod || undefined,
        notes: payForm.notes.trim() || undefined,
      });
      toast.success(t.paymentSaved);
      setPayModalOpen(false);
      fetchEmployees(page);
      fetchStats();
      // Auto-open receipt after save
      const payment: SalaryPayment = res.data.data;
      const emp = employees.find((e) => e.id === payForm.employeeId);
      if (emp && payment) {
        setTimeout(
          () => printReceipt(payment, { ...emp, ...payment.employee }),
          300,
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePay = async (id: string) => {
    try {
      await employeesAPI.deletePayment(id);
      toast.success(t.paymentDeleted);
      if (histEmployee) fetchHistory(histEmployee);
      fetchEmployees(page);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    }
  };

  // ── Receipt print ──────────────────────────────────────────────────────────

  const printReceipt = (payment: SalaryPayment, emp?: Partial<Employee>) => {
    const win = window.open("", "_blank");
    if (!win) return;

    const empData = emp || employees.find((e) => e.id === payment.employeeId);

    win.document.write(`<!DOCTYPE html><html dir="rtl"><head>
<meta charset="utf-8">
<title>رسید معاش — ${payment.receiptNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #1a1a1a; background: #fff; }
  .page { width: 80mm; min-height: 150mm; margin: 0 auto; padding: 6mm; }
  .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 8px; margin-bottom: 10px; }
  .logo-area { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
  .logo-circle { width: 48px; height: 48px; background: linear-gradient(135deg,#d97706,#b45309); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: #fff; }
  .company-name { font-size: 15px; font-weight: 900; color: #92400e; }
  .company-sub { font-size: 10px; color: #b45309; margin-top: 1px; }
  .receipt-title { background: linear-gradient(135deg,#92400e,#78350f); color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 800; display: inline-block; margin: 8px 0 4px; }
  .receipt-no { font-size: 11px; color: #6b7280; }
  .info-block { background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 10px; margin-bottom: 10px; }
  .info-block .section-title { font-size: 10px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 7px; border-bottom: 1px solid #fde68a; padding-bottom: 4px; }
  .info-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; gap: 6px; }
  .info-label { font-size: 11px; color: #78350f; font-weight: 600; white-space: nowrap; }
  .info-value { font-size: 11px; color: #1a1a1a; font-weight: 500; text-align: left; flex: 1; border-bottom: 1px dotted #fbbf24; padding-bottom: 1px; }
  .amount-box { background: linear-gradient(135deg,#059669,#047857); color: #fff; border-radius: 10px; padding: 12px; text-align: center; margin-bottom: 10px; }
  .amount-label { font-size: 11px; opacity: 0.85; margin-bottom: 4px; }
  .amount-value { font-size: 26px; font-weight: 900; line-height: 1; direction: ltr; }
  .amount-currency { font-size: 13px; opacity: 0.9; margin-top: 3px; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 14px 0; }
  .sig-box { border-top: 1.5px solid #d97706; padding-top: 6px; text-align: center; }
  .sig-label { font-size: 9px; color: #92400e; font-weight: 600; }
  .sig-space { height: 28px; }
  .footer { text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px dashed #fde68a; padding-top: 8px; margin-top: 8px; }
  .badge { display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; border-radius: 12px; padding: 2px 8px; font-size: 9px; font-weight: 700; margin-top: 4px; }
  .divider { border: none; border-top: 1px dashed #fde68a; margin: 8px 0; }
  @media print { @page { margin: 4mm; size: 80mm auto; } body { margin: 0; } .page { width: 100%; padding: 3mm; } }
</style>
</head><body>
<div class="page">
  <div class="header">
    <div class="logo-area">
      <div class="logo-circle">ا</div>
      <div>
        <div class="company-name">مرکز کرایه موتر افشار</div>
        <div class="company-sub">سیستم مدیریت هوشمند</div>
      </div>
    </div>
    <div class="receipt-title">رسید معاش کارمند</div>
    <div class="receipt-no">شماره رسید: <strong>${payment.receiptNumber}</strong></div>
  </div>

  <div class="info-block">
    <div class="section-title">معلومات کارمند</div>
    <div class="info-row"><span class="info-label">نام کامل:</span><span class="info-value">${empData?.fullName || "—"}</span></div>
    <div class="info-row"><span class="info-label">نام پدر:</span><span class="info-value">${empData?.fatherName || "—"}</span></div>
    <div class="info-row"><span class="info-label">نمبر تذکره:</span><span class="info-value" dir="ltr">${empData?.tazkiraNumber || "—"}</span></div>
    <div class="info-row"><span class="info-label">معاش تثبیت شده:</span><span class="info-value" dir="ltr">${formatNumber(empData?.baseSalary ?? 0)} ؋</span></div>
  </div>

  <div class="amount-box">
    <div class="amount-label">مبلغ پرداخت شده</div>
    <div class="amount-value">${formatNumber(payment.amount)}</div>
    <div class="amount-currency">افغانی</div>
  </div>

  <div class="info-block">
    <div class="section-title">معلومات پرداخت</div>
    <div class="info-row"><span class="info-label">تاریخ پرداخت:</span><span class="info-value">${formatAfghanDate(payment.paymentDate)}</span></div>
    <div class="info-row"><span class="info-label">روش پرداخت:</span><span class="info-value">${PAYMENT_METHODS[payment.paymentMethod || ""] || payment.paymentMethod || "نقدی"}</span></div>
    <div class="info-row"><span class="info-label">ثبت توسط:</span><span class="info-value">${payment.createdBy}</span></div>
    ${payment.notes ? `<div class="info-row"><span class="info-label">یادداشت:</span><span class="info-value">${payment.notes}</span></div>` : ""}
    <div class="info-row"><span class="info-label">تاریخ صدور:</span><span class="info-value">${formatAfghanDate(new Date().toISOString())}</span></div>
  </div>

  <div class="signatures">
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-label">امضای کارمند</div>
    </div>
    <div class="sig-box">
      <div class="sig-space"></div>
      <div class="sig-label">امضای مسئول دفتر</div>
    </div>
  </div>

  <div class="footer">
    <div>مرکز کرایه موتر افشار — هوشمند سافی سیستمز</div>
    <div class="badge">✓ رسید معتبر</div>
    <div style="margin-top:4px">${payment.receiptNumber}</div>
  </div>
</div>
</body></html>`);
    win.document.close();
    win.print();
  };

  // ── Input helpers ──────────────────────────────────────────────────────────

  const inp = (field: string, errors: Record<string, string>) =>
    `w-full px-3 py-2.5 rounded-xl input-golden text-sm ${errors[field] ? "border-red-400 bg-red-50" : ""}`;
  const lbl = "block text-sm font-medium text-amber-800 mb-1";

  // ── Stat cards ─────────────────────────────────────────────────────────────

  const statCards = [
    {
      title: t.totalEmployees,
      value: statsLoading ? "..." : String(stats?.employeeCount ?? 0),
      icon: Users,
      color: "linear-gradient(135deg,#3b82f6,#2563eb)",
      sub: "کارمند ثبت شده",
    },
    {
      title: t.thisMonthSalary,
      value: statsLoading
        ? "..."
        : `${formatNumber(stats?.thisMonth.amount ?? 0)} ${t.currency}`,
      icon: CalendarDays,
      color: "linear-gradient(135deg,#f59e0b,#d97706)",
      sub: statsLoading ? "" : `${stats?.thisMonth.count ?? 0} رسید این ماه`,
    },
    {
      title: t.totalSalaryPaid,
      value: statsLoading
        ? "..."
        : `${formatNumber(stats?.allTime.amount ?? 0)} ${t.currency}`,
      icon: Wallet,
      color: "linear-gradient(135deg,#10b981,#059669)",
      sub: statsLoading ? "" : `${stats?.allTime.count ?? 0} رسید کل`,
    },
    {
      title: t.salaryDeductedFromAdmin,
      value: statsLoading
        ? "..."
        : `${formatNumber(stats?.allTime.amount ?? 0)} ${t.currency}`,
      icon: DollarSign,
      color: "linear-gradient(135deg,#ef4444,#dc2626)",
      sub: "از درآمد خالص ادمین کسر می‌شود",
    },
  ];

  // ── Selected employee for pay modal ───────────────────────────────────────

  const payEmployee = employees.find((e) => e.id === payForm.employeeId);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="space-y-5 page-enter">
        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-900">
                {t.employees}
              </h2>
              <p className="text-sm text-amber-600">
                {pagination.total} کارمند ثبت شده
              </p>
            </div>
          </div>
          <button
            onClick={openAddEmp}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t.addEmployee}
          </button>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((c) => (
            <StatCard
              key={c.title}
              title={c.title}
              value={c.value}
              icon={c.icon}
              color={c.color}
              subtitle={c.sub}
            />
          ))}
        </div>

        {/* ── Search Bar ──────────────────────────────────────────── */}
        <div className="card-golden rounded-2xl p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pr-10 pl-4 py-2 rounded-xl input-golden text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Employee Table ───────────────────────────────────────── */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-golden min-w-[860px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-right text-sm w-10">#</th>
                  <th className="px-4 py-3 text-right text-sm">{t.fullName}</th>
                  <th className="px-4 py-3 text-right text-sm">
                    {t.fatherName}
                  </th>
                  <th className="px-4 py-3 text-right text-sm">
                    {t.tazkiraNumber}
                  </th>
                  <th className="px-4 py-3 text-right text-sm">
                    {t.baseSalary}
                  </th>
                  <th className="px-4 py-3 text-right text-sm">
                    {t.totalPaid}
                  </th>
                  <th className="px-4 py-3 text-right text-sm">{t.date}</th>
                  <th className="px-4 py-3 text-right text-sm w-44">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-amber-100">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div
                            className="skeleton h-4 rounded"
                            style={{ width: `${55 + Math.random() * 40}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-amber-200" />
                        <p className="text-amber-400 text-sm">
                          {t.noEmployees}
                        </p>
                        <button
                          onClick={openAddEmp}
                          className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                        >
                          <Plus className="w-4 h-4" />
                          {t.addEmployee}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  employees.map((emp, i) => (
                    <tr
                      key={emp.id}
                      className="border-b border-amber-100 hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-amber-500">
                        {(page - 1) * 50 + i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg,#3b82f6,#2563eb)",
                            }}
                          >
                            {emp.fullName.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-amber-900">
                            {emp.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-800">
                        {emp.fatherName}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-amber-700 font-mono"
                        dir="ltr"
                      >
                        {emp.tazkiraNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                          {formatNumber(emp.baseSalary)} {t.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-sm text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          {formatNumber(emp.totalPaid)} {t.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {formatAfghanDate(emp.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* Pay Salary */}
                          <button
                            onClick={() => openPayModal(emp)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            title={t.paySalary}
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">رسید پول</span>
                          </button>
                          {/* History */}
                          <button
                            onClick={() => fetchHistory(emp)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title={t.viewHistory}
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => openEditEmp(emp)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
                            title={t.edit}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setDeleteEmpId(emp.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-amber-100">
              <p className="text-xs text-amber-600">
                {(page - 1) * 50 + 1}–{Math.min(page * 50, pagination.total)} از{" "}
                {pagination.total} کارمند
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {[...Array(pagination.totalPages)].map((_, idx) => {
                  const pg = idx + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pg === page ? "bg-amber-500 text-white shadow-sm" : "text-amber-600 hover:bg-amber-50 border border-amber-200"}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page === pagination.totalPages}
                  className="p-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          Add / Edit Employee Modal
      ═══════════════════════════════════════════════════════ */}
      <Modal
        open={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={editEmp ? t.editEmployee : t.addEmployee}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* نام */}
          <div>
            <label className={lbl}>نام *</label>
            <input
              value={empForm.fullName}
              onChange={(e) =>
                setEmpForm({ ...empForm, fullName: e.target.value })
              }
              className={inp("fullName", empErrors)}
              placeholder="نام کامل کارمند"
            />
            {empErrors.fullName && (
              <p className="text-red-500 text-xs mt-1">{empErrors.fullName}</p>
            )}
          </div>

          {/* نام پدر */}
          <div>
            <label className={lbl}>نام پدر *</label>
            <input
              value={empForm.fatherName}
              onChange={(e) =>
                setEmpForm({ ...empForm, fatherName: e.target.value })
              }
              className={inp("fatherName", empErrors)}
              placeholder="نام پدر کارمند"
            />
            {empErrors.fatherName && (
              <p className="text-red-500 text-xs mt-1">
                {empErrors.fatherName}
              </p>
            )}
          </div>

          {/* نام پدرِ پدر */}
          <div>
            <label className={lbl}>نام پدرکلان</label>
            <input
              value={empForm.grandfatherName}
              onChange={(e) =>
                setEmpForm({ ...empForm, grandfatherName: e.target.value })
              }
              className={inp("grandfatherName", empErrors)}
              placeholder="نام پدر کلان (اختیاری)"
            />
          </div>

          {/* نمبر تذکره */}
          <div>
            <label className={lbl}>نمبر تذکره *</label>
            <input
              value={empForm.tazkiraNumber}
              onChange={(e) =>
                setEmpForm({ ...empForm, tazkiraNumber: e.target.value })
              }
              className={inp("tazkiraNumber", empErrors)}
              placeholder="نمبر یکتای تذکره"
              dir="ltr"
            />
            {empErrors.tazkiraNumber && (
              <p className="text-red-500 text-xs mt-1">
                {empErrors.tazkiraNumber}
              </p>
            )}
          </div>

          {/* مقدار پول */}
          <div className="sm:col-span-2">
            <label className={lbl}>
              مقدار پول / معاش تثبیت شده ({t.currency}) *
            </label>
            <input
              value={empForm.baseSalary}
              onChange={numericInputHandler((v) =>
                setEmpForm({ ...empForm, baseSalary: v }),
              )}
              className={inp("baseSalary", empErrors)}
              placeholder="0"
              dir="ltr"
              inputMode="decimal"
            />
            {empErrors.baseSalary && (
              <p className="text-red-500 text-xs mt-1">
                {empErrors.baseSalary}
              </p>
            )}
            {empForm.baseSalary && parseFloat(empForm.baseSalary) > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                معاش ماهانه:{" "}
                <strong>
                  {formatNumber(parseFloat(empForm.baseSalary))} افغانی
                </strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setEmpModalOpen(false)}
            className="flex-1 btn-secondary py-2.5 rounded-xl text-sm"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSaveEmp}
            disabled={saving}
            className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? t.loading : t.save}
          </button>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          Pay Salary Modal
      ═══════════════════════════════════════════════════════ */}
      <Modal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={t.paySalary}
        size="lg"
      >
        {/* Employee Summary */}
        {payEmployee && (
          <div
            className="mb-4 p-4 rounded-2xl border border-blue-200"
            style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                style={{
                  background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                }}
              >
                {payEmployee.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-blue-900 text-sm">
                  {payEmployee.fullName}
                </p>
                <p className="text-xs text-blue-600">
                  {payEmployee.fatherName} — تذکره: {payEmployee.tazkiraNumber}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">معاش تثبیت شده</p>
                <p className="font-bold text-blue-900 text-sm" dir="ltr">
                  {formatNumber(payEmployee.baseSalary)} ؋
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs text-blue-700">
                مجموع پرداخت‌های قبلی:{" "}
                <strong>{formatNumber(payEmployee.totalPaid)} افغانی</strong>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* مقدار پرداخت */}
          <div>
            <label className={lbl}>مقدار پرداخت ({t.currency}) *</label>
            <input
              value={payForm.amount}
              onChange={numericInputHandler((v) =>
                setPayForm({ ...payForm, amount: v }),
              )}
              className={inp("amount", payErrors)}
              placeholder="0"
              dir="ltr"
              inputMode="decimal"
            />
            {payErrors.amount && (
              <p className="text-red-500 text-xs mt-1">{payErrors.amount}</p>
            )}
          </div>

          {/* تاریخ پرداخت */}
          <div>
            <label className={lbl}>تاریخ پرداخت *</label>
            <input
              type="date"
              value={payForm.paymentDate}
              onChange={(e) =>
                setPayForm({ ...payForm, paymentDate: e.target.value })
              }
              className={inp("paymentDate", payErrors)}
              max={todayISO()}
            />
            {payErrors.paymentDate && (
              <p className="text-red-500 text-xs mt-1">
                {payErrors.paymentDate}
              </p>
            )}
          </div>

          {/* روش پرداخت */}
          <div>
            <label className={lbl}>روش پرداخت</label>
            <select
              value={payForm.paymentMethod}
              onChange={(e) =>
                setPayForm({ ...payForm, paymentMethod: e.target.value })
              }
              className={inp("paymentMethod", payErrors)}
            >
              {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* ثبت توسط */}
          <div>
            <label className={lbl}>ثبت توسط</label>
            <input
              value={
                (user as any)?.name || (user as any)?.email || "مدیر سیستم"
              }
              readOnly
              className="w-full px-3 py-2.5 rounded-xl input-golden text-sm opacity-60 cursor-not-allowed"
            />
          </div>

          {/* یادداشت */}
          <div className="sm:col-span-2">
            <label className={lbl}>یادداشت / توضیحات</label>
            <textarea
              value={payForm.notes}
              onChange={(e) =>
                setPayForm({ ...payForm, notes: e.target.value })
              }
              rows={2}
              className={`${inp("notes", payErrors)} resize-none`}
              placeholder="توضیحات اضافی در مورد این پرداخت..."
            />
          </div>
        </div>

        {/* Financial impact note */}
        {payForm.amount && parseFloat(payForm.amount) > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-700">
              مبلغ{" "}
              <strong>{formatNumber(parseFloat(payForm.amount))} افغانی</strong>{" "}
              از <strong>درآمد خالص ادمین</strong> کسر خواهد شد. رسید معاش پس از
              ثبت چاپ می‌شود.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setPayModalOpen(false)}
            className="flex-1 btn-secondary py-2.5 rounded-xl text-sm"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSavePay}
            disabled={saving}
            className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t.loading}
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                ثبت و چاپ رسید
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          Payment History Modal
      ═══════════════════════════════════════════════════════ */}
      <Modal
        open={histModalOpen}
        onClose={() => setHistModalOpen(false)}
        title={`تاریخچه پرداخت — ${histEmployee?.fullName || ""}`}
        size="xl"
      >
        {histEmployee && (
          <div className="mb-4 p-3 rounded-xl border border-blue-200 bg-blue-50 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}
            >
              {histEmployee.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-blue-900 text-sm">
                {histEmployee.fullName}
              </p>
              <p className="text-xs text-blue-600">
                تذکره: {histEmployee.tazkiraNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-500">مجموع پرداخت شده</p>
              <p className="font-bold text-emerald-700 text-sm" dir="ltr">
                {formatNumber(histPayments.reduce((s, p) => s + p.amount, 0))} ؋
              </p>
            </div>
          </div>
        )}

        {histLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : histPayments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <FileText className="w-12 h-12 text-amber-200" />
            <p className="text-amber-400 text-sm">{t.noPayments}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-amber-200">
            <table className="w-full table-golden min-w-[580px]">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-right text-xs">#</th>
                  <th className="px-3 py-2.5 text-right text-xs">
                    {t.receiptNumber}
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs">
                    {t.paymentDate}
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs">
                    {t.paymentAmount}
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs">
                    {t.paymentMethod}
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs">{t.notes}</th>
                  <th className="px-3 py-2.5 text-right text-xs w-20">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {histPayments.map((pay, i) => (
                  <tr
                    key={pay.id}
                    className="border-b border-amber-100 hover:bg-amber-50/40"
                  >
                    <td className="px-3 py-2.5 text-xs text-amber-500">
                      {i + 1}
                    </td>
                    <td
                      className="px-3 py-2.5 text-xs font-mono text-amber-800"
                      dir="ltr"
                    >
                      {pay.receiptNumber}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-amber-700">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {formatAfghanDate(pay.paymentDate)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {formatNumber(pay.amount)} ؋
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-amber-700">
                      {PAYMENT_METHODS[pay.paymentMethod || ""] ||
                        pay.paymentMethod ||
                        "نقدی"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-amber-600 max-w-[120px] truncate">
                      {pay.notes || <span className="text-amber-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            printReceipt(pay, histEmployee ?? undefined)
                          }
                          className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title={t.printReceipt}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletePayId(pay.id)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          {histEmployee && (
            <button
              onClick={() => {
                setHistModalOpen(false);
                openPayModal(histEmployee);
              }}
              className="flex items-center gap-2 btn-primary px-4 py-2.5 rounded-xl text-sm font-medium"
            >
              <Banknote className="w-4 h-4" />
              پرداخت جدید
            </button>
          )}
          <button
            onClick={() => setHistModalOpen(false)}
            className="flex-1 btn-secondary py-2.5 rounded-xl text-sm"
          >
            {t.close}
          </button>
        </div>
      </Modal>

      {/* ── Delete Employee Confirm ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteEmpId}
        onClose={() => setDeleteEmpId(null)}
        onConfirm={() => handleDeleteEmp(deleteEmpId!)}
        message={t.deleteEmployeeConfirm}
      />

      {/* ── Delete Payment Confirm ──────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deletePayId}
        onClose={() => setDeletePayId(null)}
        onConfirm={() => handleDeletePay(deletePayId!)}
        message={t.deletePaymentConfirm}
      />
    </MainLayout>
  );
}
