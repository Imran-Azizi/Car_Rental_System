'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useApp } from '@/lib/context';
import { ordersAPI } from '@/lib/api';
import { Plus, Search, Eye, Trash2, CheckCircle, CreditCard, Printer, Pencil, Download, ZoomIn, ImageOff, X, ChevronLeft, ChevronRight, Car, User, Shield, UserCheck, Receipt, FileImage, DollarSign, AlertTriangle, Clock, Edit2, Check as CheckIcon, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatAfghanDate, formatCurrency as fmtCur, numericInputProps, numericInputHandler, formatNumber } from '@/lib/utils';
import { resolveImgUrl } from '@/lib/imageUrl';

const STATUS_LIST = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE'] as const;
const statusMap: any = {
  ACTIVE:    { dari: 'فعال',        pashto: 'فعال',    variant: 'active'    },
  COMPLETED: { dari: 'تکمیل',       pashto: 'بشپړ',    variant: 'completed' },
  CANCELLED: { dari: 'لغو',         pashto: 'لغوه',   variant: 'cancelled' },
  OVERDUE:   { dari: 'ناوقت',       pashto: 'ناوخته', variant: 'overdue'   },
};

const inputCls = 'w-full px-3 py-2 rounded-lg input-golden text-sm';
const labelCls = 'block text-sm font-medium text-amber-800 mb-1';

/* ── 24-hour edit window helper ──────────────────────────────────── */
function canEditOrder(order: any): { allowed: boolean; reason?: string } {
  if (order.status !== 'COMPLETED') return { allowed: true };
  if (!order.completedAt)            return { allowed: false, reason: 'expired' };
  const elapsedHours = (Date.now() - new Date(order.completedAt).getTime()) / 3_600_000;
  if (elapsedHours <= 24)            return { allowed: true };
  return {
    allowed: false,
    reason: `ویرایش فقط تا ۲۴ ساعت بعد از تکمیل مجاز است. (${Math.floor(elapsedHours)} ساعت گذشته)`,
  };
}

export default function AllOrdersPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '' });
  const [pendingReturnId, setPendingReturnId] = useState<string | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [returnId, setReturnId] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  /* ── Inline total-rent cell editor ── */
  const [editingRentId,   setEditingRentId]   = useState<string | null>(null);
  const [totalRentInput,  setTotalRentInput]  = useState('');
  const [savingTotalRent, setSavingTotalRent] = useState(false);
  const [totalRentError,  setTotalRentError]  = useState('');

  const imgUrl = resolveImgUrl;

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    fetchData();
  }, [token, debouncedSearch, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({ search: debouncedSearch, status: statusFilter });
      setOrders(res.data.data);
    } catch { toast.error(t.error); } finally { setLoading(false); }
  };

  /* ── Save updated مجموع کرایه (inline cell edit) ── */
  const handleSaveTotalRent = async (orderId: string) => {
    const parsed = parseFloat(totalRentInput.replace(/,/g, ''));
    if (isNaN(parsed) || parsed <= 0) {
      setTotalRentError(lang === 'dari' ? 'مقدار معتبر وارد کنید' : 'سمه عدد ولیکئ');
      return;
    }
    setTotalRentError('');
    setSavingTotalRent(true);
    try {
      const res = await ordersAPI.update(orderId, { totalRent: parsed });
      const updated = res.data.data;
      /* Patch the row in-place so the list updates without a full refetch */
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, totalRent: updated.totalRent, remainingAmount: updated.remainingAmount,
              ownerShare: updated.ownerShare, adminShare: updated.adminShare,
              liveFinalTotal: updated.liveFinalTotal ?? updated.totalRent }
          : o,
      ));
      setEditingRentId(null);
      toast.success(lang === 'dari' ? 'مجموع کرایه بروز شد' : 'د کرایې مجموع تازه شو');
    } catch (err: any) {
      const msg = err.response?.data?.message || t.error;
      setTotalRentError(msg);
      toast.error(msg);
    } finally {
      setSavingTotalRent(false);
    }
  };

  const handleReturn = async (id: string) => {
    try {
      await ordersAPI.markReturned(id);
      toast.success(t.markReturned);
      fetchData();
    } catch { toast.error(t.error); }
  };

  const handleDelete = async (id: string) => {
    try {
      await ordersAPI.delete(id);
      toast.success(lang === 'dari' ? 'سفارش حذف شد' : 'سفارش ړنګ شو');
      fetchData();
    } catch { toast.error(t.error); }
  };

  const handlePayment = async () => {
    if (!paymentForm.amount) return toast.error(t.enterAmount);
    setSavingPayment(true);
    try {
      const payRes = await ordersAPI.addPayment(paymentModal.id, paymentForm);
      /* Backend now returns { payment, remainingAmount } */
      const newRemaining: number = payRes.data.data?.remainingAmount ?? 0;

      toast.success(t.paymentSaved);
      const returnAfter = pendingReturnId;
      setPaymentModal(null);
      setPendingReturnId(null);
      setPaymentForm({ amount: '', notes: '' });
      fetchData();

      /* Only mark as returned when the balance is fully settled */
      if (returnAfter) {
        if (newRemaining === 0) {
          await ordersAPI.markReturned(returnAfter);
          toast.success(t.markReturned);
          fetchData();
        } else {
          /* Partial payment — keep order active, inform admin */
          toast(
            lang === 'dari'
              ? `پرداخت ثبت شد. باقی‌مانده: ${newRemaining.toLocaleString('en-US')} ${t.currency} — سفارش همچنان فعال است.`
              : `تادیه ثبت شوه. پاتې: ${newRemaining.toLocaleString('en-US')} ${t.currency} — سفارش لا هم فعال دی.`,
            { icon: '⚠️', duration: 5000 },
          );
        }
      }
    } catch { toast.error(t.error); } finally { setSavingPayment(false); }
  };


  const formatDate = (d: string) => formatAfghanDate(d);
  const formatCurrency = (n: number) => fmtCur(n, t.currency);

  // Reset lightbox when switching orders
  useEffect(() => { setLightboxIdx(null); }, [viewOrder]);

  const orderImages = viewOrder ? [
    { url: imgUrl(viewOrder.customer?.photo),    label: lang === 'dari' ? 'عکس مشتری'          : 'د مشتري انځور',      filename: 'customer-photo' },
    { url: imgUrl(viewOrder.guarantor?.photo),   label: lang === 'dari' ? 'عکس ضامن (۱)'       : 'د ضامن انځور (۱)',   filename: 'guarantor-photo-1' },
    { url: imgUrl(viewOrder.guarantor?.photo2),  label: lang === 'dari' ? 'عکس ضامن (۲)'       : 'د ضامن انځور (۲)',   filename: 'guarantor-photo-2' },
    { url: imgUrl(viewOrder.billDocPhoto),        label: lang === 'dari' ? 'عکس بل / قرارداد'   : 'د بل انځور',         filename: 'bill-doc' },
    { url: imgUrl(viewOrder.tazkiraDocPhoto),     label: lang === 'dari' ? 'عکس تذکره (۱)'      : 'د تذکرې انځور (۱)', filename: 'tazkira-doc-1' },
    { url: imgUrl(viewOrder.tazkiraDocPhoto2),    label: lang === 'dari' ? 'عکس تذکره (۲)'      : 'د تذکرې انځور (۲)', filename: 'tazkira-doc-2' },
  ].filter((img): img is { url: string; label: string; filename: string } => !!img.url) : [];

  const downloadImage = async (url: string, filename: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const ext  = blob.type.split('/')[1]?.split('+')[0] || 'jpg';
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error(lang === 'dari' ? 'خطا در دانلود تصویر' : 'د انځور ډاونلوډ کې تیروتنه');
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < orderImages.length; i++) {
      await downloadImage(
        orderImages[i].url,
        `${viewOrder?.contractNumber || 'order'}-${orderImages[i].filename}`,
      );
      if (i < orderImages.length - 1) await new Promise(r => setTimeout(r, 400));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-amber-900">{t.allOrders}</h2>
          <Link
            href="/orders/new"
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t.carOrder}
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pr-10 py-2 px-3 rounded-lg input-golden text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg input-golden text-sm min-w-[140px]"
          >
            <option value="">{t.all}</option>
            {STATUS_LIST.map(s => (
              <option key={s} value={s}>{statusMap[s]?.[lang]}</option>
            ))}
          </select>
        </div>

        {/* Orders Table */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-golden min-w-[800px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-right text-sm">{t.contractNo}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.customer}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.car}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.startDate}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.endDate}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.totalRent}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.remainingAmount}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.status}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-amber-500">{t.loading}</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-amber-500">{t.noData}</td>
                  </tr>
                ) : orders.map(c => {
                  const isOverdue = c.status === 'OVERDUE';
                  const overdueDays = c.liveOverdueDays ?? 0;
                  const overdueCharge = c.liveOverdueCharges ?? 0;
                  const finalTotal = c.liveFinalTotal ?? c.totalRent;
                  return (
                  <tr key={c.id}
                    className={`border-b transition-colors ${isOverdue ? 'bg-red-50/60 border-red-200 hover:bg-red-50' : 'border-amber-100 hover:bg-amber-50/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        <span className="text-xs font-mono text-amber-700">{c.contractNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{c.customer?.fullName}</div>
                      <div className="text-xs text-amber-500">{c.customer?.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{c.car?.carName}</div>
                      <div className="text-xs text-amber-500">{c.car?.plateNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDate(c.startDate)}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{formatDate(c.endDate)}</div>
                      {isOverdue && overdueDays > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-red-500" />
                          <span className="text-xs font-bold text-red-600">+{overdueDays} {lang === 'dari' ? 'روز تاخیر' : 'ورځ ناوخته'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ minWidth: '148px' }}>
                      {editingRentId === c.id ? (
                        /* ── Inline edit form ── */
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <input
                              value={totalRentInput}
                              onChange={numericInputHandler(v => { setTotalRentInput(v); setTotalRentError(''); })}
                              inputMode="decimal"
                              dir="ltr"
                              autoFocus
                              className="w-24 px-2 py-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 text-sm font-bold text-amber-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 transition-all"
                              onKeyDown={e => {
                                if (e.key === 'Enter')  handleSaveTotalRent(c.id);
                                if (e.key === 'Escape') { setEditingRentId(null); setTotalRentError(''); }
                              }}
                            />
                            {/* Save */}
                            <button
                              onClick={() => handleSaveTotalRent(c.id)}
                              disabled={savingTotalRent}
                              className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50 shrink-0"
                              title={lang === 'dari' ? 'ذخیره' : 'خوندي کول'}
                            >
                              {savingTotalRent
                                ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <CheckIcon className="w-3.5 h-3.5" />}
                            </button>
                            {/* Cancel */}
                            <button
                              onClick={() => { setEditingRentId(null); setTotalRentError(''); }}
                              disabled={savingTotalRent}
                              className="p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors disabled:opacity-50 shrink-0"
                              title={lang === 'dari' ? 'لغو' : 'لغوه'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {totalRentError && (
                            <p className="text-[10px] text-red-600 font-medium flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />{totalRentError}
                            </p>
                          )}
                        </div>
                      ) : (
                        /* ── Display mode ── */
                        <div className="flex items-center gap-1.5 group">
                          <div>
                            <div className="text-sm font-medium">{formatCurrency(c.totalRent)}</div>
                            {isOverdue && overdueCharge > 0 && (
                              <div className="text-xs font-bold text-red-600">+{formatCurrency(overdueCharge)} {lang === 'dari' ? 'جریمه' : 'جریمه'}</div>
                            )}
                          </div>
                          {/* Edit icon — only when canEdit */}
                          {canEditOrder(c).allowed && (
                            <button
                              onClick={() => {
                                setEditingRentId(c.id);
                                setTotalRentInput(String(c.totalRent ?? 0));
                                setTotalRentError('');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition-all shrink-0"
                              title={lang === 'dari' ? 'ویرایش مجموع کرایه' : 'د کرایې مجموع سمول'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-medium ${c.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(c.remainingAmount)}
                      </div>
                      {isOverdue && overdueCharge > 0 && (
                        <div className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          {lang === 'dari' ? 'مجموع:' : 'ټول:'} {formatCurrency(finalTotal)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusMap[c.status]?.variant} label={statusMap[c.status]?.[lang] || c.status} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          onClick={() => setViewOrder(c)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {lang === 'dari' ? 'مشاهده' : 'کتل'}
                        </button>
                        {(() => {
                          const { allowed, reason } = canEditOrder(c);
                          return allowed ? (
                            <button
                              onClick={() => router.push(`/orders/new?edit=${c.id}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-200"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {lang === 'dari' ? 'ویرایش' : 'سمول'}
                            </button>
                          ) : (
                            <span
                              title={reason}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed select-none"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              {lang === 'dari' ? 'ویرایش' : 'سمول'}
                            </span>
                          );
                        })()}
                        <button
                          onClick={() => router.push(`/orders/print/${c.id}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {lang === 'dari' ? 'چاپ بل' : 'بل'}
                        </button>
                        {(c.status === 'ACTIVE' || c.status === 'OVERDUE') && (
                          <>
                            <button
                              onClick={() => { setPaymentModal(c); setPendingReturnId(null); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {lang === 'dari' ? 'پرداخت' : 'تادیه'}
                            </button>
                            <button
                              onClick={() => {
                                if ((c.remainingAmount ?? 0) > 0) {
                                  setPendingReturnId(c.id);
                                  setPaymentModal(c);
                                } else {
                                  setReturnId(c.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {lang === 'dari' ? 'برگشت' : 'راستون'}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {lang === 'dari' ? 'حذف' : 'ړنګول'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Order Modal */}
      {viewOrder && (
        <Modal
          open={!!viewOrder}
          onClose={() => { setViewOrder(null); setTotalRentError(''); }}
          title={`${lang === 'dari' ? 'جزئیات سفارش' : 'د سفارش جزئیات'} — ${viewOrder.contractNumber}`}
          size="xl"
        >
          <div className="space-y-5">

            {/* ── Status Banner ── */}
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl border"
              style={{
                background: viewOrder.status === 'ACTIVE'    ? 'linear-gradient(135deg,#d1fae5,#ecfdf5)' :
                            viewOrder.status === 'COMPLETED' ? 'linear-gradient(135deg,#e0f2fe,#f0f9ff)' :
                            viewOrder.status === 'CANCELLED' ? 'linear-gradient(135deg,#fee2e2,#fff1f2)' :
                            viewOrder.status === 'OVERDUE'   ? 'linear-gradient(135deg,#fff1f2,#ffe4e6)' :
                            'linear-gradient(135deg,#fef3c7,#fefce8)',
                borderColor: viewOrder.status === 'ACTIVE'    ? '#6ee7b7' :
                             viewOrder.status === 'COMPLETED' ? '#7dd3fc' :
                             viewOrder.status === 'CANCELLED' ? '#fca5a5' :
                             viewOrder.status === 'OVERDUE'   ? '#fca5a5' : '#fde68a',
              }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-gray-800 font-mono">{viewOrder.contractNumber}</span>
                <Badge variant={statusMap[viewOrder.status]?.variant} label={statusMap[viewOrder.status]?.[lang]} />
              </div>
              <div className="text-xs text-gray-500">{formatDate(viewOrder.createdAt || viewOrder.startDate)}</div>
            </div>

            {/* ── Section Helper ── */}
            {/* Section 1: Car Information */}
            <SectionTable
              icon={<Car className="w-4 h-4" />}
              title={lang === 'dari' ? 'معلومات موتر' : 'د موتر معلومات'}
              color="#d97706"
              rows={[
                [lang === 'dari' ? 'نام موتر' : 'د موتر نوم', viewOrder.car?.carName],
                [lang === 'dari' ? 'نمبر پلیت' : 'بلیت نمبر', viewOrder.car?.plateNumber],
                [lang === 'dari' ? 'مدل' : 'ماډل', viewOrder.car?.model],
                [lang === 'dari' ? 'رنگ' : 'رنګ', viewOrder.car?.color],
              ]}
            />

            {/* Section 2: Rental Details */}
            <SectionTable
              icon={<Receipt className="w-4 h-4" />}
              title={lang === 'dari' ? 'جزئیات کرایه' : 'د کرایې جزئیات'}
              color="#059669"
              rows={[
                [lang === 'dari' ? 'تاریخ تحویل' : 'د ورلو نیټه', `${formatDate(viewOrder.startDate)}${viewOrder.startTime ? '  ' + viewOrder.startTime : ''}`],
                [lang === 'dari' ? 'تاریخ برگشت' : 'د راستون نیټه', `${formatDate(viewOrder.endDate)}${viewOrder.endTime ? '  ' + viewOrder.endTime : ''}`],
                [lang === 'dari' ? 'کرایه روزانه' : 'ورځنۍ کرایه', formatCurrency(viewOrder.rentPrice || viewOrder.dailyRate || 0), false, 'text-amber-800 font-bold'],
                [lang === 'dari' ? 'مجموع کرایه' : 'ټوله کرایه', formatCurrency(viewOrder.totalRent), false, 'text-amber-900 font-black text-base'],
              ]}
            />

            {/* Section 3: Payment Information */}
            <SectionTable
              icon={<DollarSign className="w-4 h-4" />}
              title={lang === 'dari' ? 'اطلاعات مالی' : 'مالي معلومات'}
              color="#7c3aed"
              rows={[
                [lang === 'dari' ? 'پیش پرداخت' : 'مخکنۍ تادیه', formatCurrency(viewOrder.advancePayment), false, 'text-green-700 font-bold'],
                [lang === 'dari' ? 'باقی مانده' : 'پاتې مبلغ', formatCurrency(viewOrder.remainingAmount), false, viewOrder.remainingAmount > 0 ? 'text-red-600 font-bold' : 'text-green-700 font-bold'],
                [lang === 'dari' ? 'سهم صاحب موتر' : 'د موتر د خاوند برخه', formatCurrency(viewOrder.ownerShare || 0)],
                [lang === 'dari' ? 'سهم ادمین' : 'د ادمین برخه', formatCurrency(viewOrder.adminShare || 0)],
              ]}
            />

            {/* Section 3b: Overdue Charges — shown when order is OVERDUE or has frozen overdueCharges */}
            {(viewOrder.status === 'OVERDUE' || (viewOrder.liveOverdueCharges > 0) || (viewOrder.overdueCharges > 0)) && (
              <div className="rounded-2xl overflow-hidden border-2 border-red-300">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3"
                  style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <h4 className="text-sm font-bold text-white">
                    {lang === 'dari' ? 'محاسبه تأخیر / ناوقت' : 'د ناوخته حساب'}
                  </h4>
                  {viewOrder.status === 'OVERDUE' && (
                    <span className="mr-auto text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lang === 'dari' ? 'در حال تأخیر' : 'اوس ناوخته دی'}
                    </span>
                  )}
                </div>
                {/* Body */}
                <div className="p-4 bg-red-50 space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: lang === 'dari' ? 'کرایه اصلی' : 'اصلي کرایه',
                        value: formatCurrency(viewOrder.totalRent),
                        cls: 'text-gray-800',
                        bg: 'bg-white border-gray-200',
                      },
                      {
                        label: lang === 'dari' ? 'کرایه روزانه' : 'ورځنۍ کرایه',
                        value: formatCurrency(viewOrder.rentPrice || 0),
                        cls: 'text-amber-700',
                        bg: 'bg-amber-50 border-amber-200',
                      },
                      {
                        label: lang === 'dari' ? 'روزهای تأخیر' : 'د ناوخته ورځې',
                        value: `${viewOrder.liveOverdueDays ?? 0} ${lang === 'dari' ? 'روز' : 'ورځ'}`,
                        cls: 'text-red-700 font-black',
                        bg: 'bg-red-100 border-red-300',
                      },
                      {
                        label: lang === 'dari' ? 'جریمه تأخیر' : 'د ناوخته جریمه',
                        value: formatCurrency(viewOrder.liveOverdueCharges ?? viewOrder.overdueCharges ?? 0),
                        cls: 'text-red-700 font-black',
                        bg: 'bg-red-100 border-red-300',
                      },
                    ].map(({ label, value, cls, bg }) => (
                      <div key={label} className={`rounded-xl p-3 border text-center ${bg}`}>
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className={`text-sm font-bold ${cls}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Final total */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-red-400 bg-red-100">
                    <span className="text-sm font-bold text-red-800">
                      {lang === 'dari' ? 'مجموع نهایی (اصلی + جریمه)' : 'وروستی ټول (اصلي + جریمه)'}
                    </span>
                    <span className="text-xl font-black text-red-900">
                      {formatCurrency(viewOrder.liveFinalTotal ?? (viewOrder.totalRent + (viewOrder.liveOverdueCharges ?? viewOrder.overdueCharges ?? 0)))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Customer Information */}
            <SectionTable
              icon={<User className="w-4 h-4" />}
              title={lang === 'dari' ? 'معلومات مشتری' : 'د مشتري معلومات'}
              color="#2563eb"
              rows={[
                [lang === 'dari' ? 'نام و تخلص' : 'نوم او تخلص', viewOrder.customer?.fullName],
                [lang === 'dari' ? 'نام پدر' : 'د پلار نوم', viewOrder.customer?.fatherName],
                [lang === 'dari' ? 'نام پدرکلان' : 'د نیکه نوم', viewOrder.customer?.grandfatherName],
                [lang === 'dari' ? 'نمبر تذکره' : 'د تذکرې نمبر', viewOrder.customer?.tazkiraNumber],
                [lang === 'dari' ? 'شماره تلفن' : 'تلیفون شمیره', viewOrder.customer?.phoneNumber, true],
                [lang === 'dari' ? 'شغل' : 'مسلک', viewOrder.customer?.occupation],
                [lang === 'dari' ? 'ولایت' : 'ولایت', viewOrder.customer?.province],
                [lang === 'dari' ? 'ناحیه' : 'ناحیه', viewOrder.customer?.district],
                [lang === 'dari' ? 'قریه' : 'ولسوالۍ', viewOrder.customer?.village],
                [lang === 'dari' ? 'آدرس فعلی' : 'اوسنی پته', viewOrder.customer?.currentAddress],
                [lang === 'dari' ? 'آدرس دایمی' : 'دایمي پته', viewOrder.customer?.permanentAddress],
              ].filter(r => r[1]) as [string, any, boolean?, string?][]}
            />

            {/* Section 5: Guarantor Information */}
            {viewOrder.guarantor && (
              <SectionTable
                icon={<Shield className="w-4 h-4" />}
                title={lang === 'dari' ? 'معلومات ضامن' : 'د ضامن معلومات'}
                color="#7c3aed"
                rows={[
                  [lang === 'dari' ? 'نام و تخلص' : 'نوم او تخلص', viewOrder.guarantor.fullName],
                  [lang === 'dari' ? 'نام پدر' : 'د پلار نوم', viewOrder.guarantor.fatherName],
                  [lang === 'dari' ? 'نام پدرکلان' : 'د نیکه نوم', viewOrder.guarantor.grandfatherName],
                  [lang === 'dari' ? 'نمبر تذکره' : 'د تذکرې نمبر', viewOrder.guarantor.tazkiraNumber],
                  [lang === 'dari' ? 'شماره تلفن' : 'تلیفون شمیره', viewOrder.guarantor.phoneNumber, true],
                  [lang === 'dari' ? 'رابطه' : 'اړیکه', viewOrder.guarantor.relationship],
                  [lang === 'dari' ? 'ولایت' : 'ولایت', viewOrder.guarantor.province],
                  [lang === 'dari' ? 'ناحیه' : 'ناحیه', viewOrder.guarantor.district],
                  [lang === 'dari' ? 'آدرس فعلی' : 'اوسنی پته', viewOrder.guarantor.currentAddress],
                ].filter(r => r[1]) as [string, any, boolean?, string?][]}
              />
            )}

            {/* Section 6: Driver Information */}
            {(viewOrder.driverName || viewOrder.driverLicense || viewOrder.driverPhone) && (
              <SectionTable
                icon={<UserCheck className="w-4 h-4" />}
                title={lang === 'dari' ? 'معلومات راننده' : 'د دریور معلومات'}
                color="#0891b2"
                rows={[
                  [lang === 'dari' ? 'نام راننده' : 'د دریور نوم', viewOrder.driverName],
                  [lang === 'dari' ? 'نمبر لیسنس' : 'لیسنس نمبر', viewOrder.driverLicense, true],
                  [lang === 'dari' ? 'شماره تلفن' : 'تلیفون', viewOrder.driverPhone, true],
                ].filter(r => r[1]) as [string, any, boolean?, string?][]}
              />
            )}

            {/* Section 7: Payment History */}
            {viewOrder.payments?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs"
                    style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {lang === 'dari' ? 'تاریخچه پرداخت‌ها' : 'د تادیو تاریخچه'}
                  </h4>
                </div>
                <div className="rounded-2xl border border-green-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                        <th className="px-4 py-2.5 text-right text-white text-xs font-semibold">#</th>
                        <th className="px-4 py-2.5 text-right text-white text-xs font-semibold">{lang === 'dari' ? 'مبلغ' : 'مبلغ'}</th>
                        <th className="px-4 py-2.5 text-right text-white text-xs font-semibold">{lang === 'dari' ? 'تاریخ' : 'نیټه'}</th>
                        <th className="px-4 py-2.5 text-right text-white text-xs font-semibold">{lang === 'dari' ? 'یادداشت' : 'نوټ'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.payments.map((p: any, i: number) => (
                        <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-green-50/50'}>
                          <td className="px-4 py-2.5 text-green-600 font-medium text-xs border-b border-green-100">{i + 1}</td>
                          <td className="px-4 py-2.5 text-green-800 font-bold border-b border-green-100">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-2.5 text-green-700 text-xs border-b border-green-100">{formatAfghanDate(p.paymentDate)}</td>
                          <td className="px-4 py-2.5 text-green-600 text-xs border-b border-green-100">{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 8: Documents */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg,#d97706,#b45309)' }}>
                    <FileImage className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {lang === 'dari' ? 'تصاویر و اسناد' : 'انځورونه او اسناد'}
                  </h4>
                </div>
                {orderImages.length > 0 && (
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {lang === 'dari' ? 'دانلود همه' : 'ټول ډاونلوډ'}
                  </button>
                )}
              </div>

              {orderImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50">
                  <ImageOff className="w-8 h-8 text-amber-300 mb-2" />
                  <p className="text-sm font-semibold text-amber-500">
                    {lang === 'dari' ? 'هیچ تصویری برای این سفارش ثبت نشده است' : 'د دې سفارش لپاره هیڅ انځور نشته'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {orderImages.map((img, idx) => (
                    <div key={idx} className="group rounded-xl overflow-hidden border-2 border-amber-100 bg-white shadow-sm hover:shadow-md transition-all">
                      <div
                        className="relative aspect-square cursor-pointer overflow-hidden bg-amber-50"
                        onClick={() => setLightboxIdx(idx)}
                      >
                        <img src={img.url} alt={img.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="w-4 h-4 text-amber-800" />
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5 border-t border-amber-100">
                        <p className="text-xs font-semibold text-amber-800 truncate text-center mb-1.5">{img.label}</p>
                        <button
                          onClick={() => downloadImage(img.url, `${viewOrder.contractNumber}-${img.filename}`)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          {lang === 'dari' ? 'دانلود' : 'ډاونلوډ'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            {viewOrder.notes && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-700 mb-1">{lang === 'dari' ? 'یادداشت' : 'نوټ'}</p>
                <p className="text-sm text-amber-800">{viewOrder.notes}</p>
              </div>
            )}

            {/* Status & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-amber-200">
              <Badge variant={statusMap[viewOrder.status]?.variant} label={statusMap[viewOrder.status]?.[lang]} />
              {(viewOrder.status === 'ACTIVE' || viewOrder.status === 'OVERDUE') && (
                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => { setPendingReturnId(null); setPaymentModal(viewOrder); setViewOrder(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />{t.addPayment}
                  </button>
                  <button
                    onClick={() => {
                      const totalOwed = (viewOrder.liveFinalTotal ?? viewOrder.totalRent) - viewOrder.advancePayment;
                      if (totalOwed > 0) {
                        setPendingReturnId(viewOrder.id);
                        setPaymentModal(viewOrder);
                      } else {
                        setReturnId(viewOrder.id);
                      }
                      setViewOrder(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition-colors ${
                      viewOrder.status === 'OVERDUE' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {viewOrder.status === 'OVERDUE'
                      ? (lang === 'dari' ? 'برگشت موتر (ناوقت)' : 'موتر راستون (ناوخته)')
                      : t.markReturned}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      <Modal
        open={!!paymentModal}
        onClose={() => { setPaymentModal(null); setPendingReturnId(null); }}
        title={pendingReturnId ? (lang === 'dari' ? 'تسویه باقی و برگشت موتر' : 'پاتې تادیه او راستون') : t.addPayment}
        size="sm"
      >
        <div className="space-y-4">
          {pendingReturnId && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50 border-2 border-orange-300 text-sm">
              <span className="text-orange-500 text-base shrink-0">⚠️</span>
              <p className="text-orange-800 font-medium">
                {lang === 'dari'
                  ? 'موتر هنوز باقی پرداخت دارد. ابتدا مبلغ باقی را دریافت کنید، سپس موتر برگشت داده می‌شود.'
                  : 'لا موتر پاتې تادیه لري. لومړی پاتې مبلغ تادیه کړئ، بیا موتر راستون کیږي.'}
              </p>
            </div>
          )}
          {paymentModal && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm">
              <p className="text-amber-700">
                {t.remainingAmount}: <span className="font-bold text-red-600">{formatCurrency(paymentModal.remainingAmount)}</span>
              </p>
            </div>
          )}
          <div>
            <label className={labelCls}>{t.amount} *</label>
            <input
              type="text"
              inputMode="decimal"
              value={paymentForm.amount}
              {...numericInputProps(v => setPaymentForm(f => ({ ...f, amount: v })))}
              className={inputCls}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelCls}>{t.notes}</label>
            <input
              value={paymentForm.notes}
              onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className={inputCls}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setPaymentModal(null); setPendingReturnId(null); }} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">
              {t.cancel}
            </button>
            <button onClick={handlePayment} disabled={savingPayment} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">
              {savingPayment ? t.loading : pendingReturnId ? (lang === 'dari' ? 'دریافت و برگشت' : 'تادیه او راستون') : t.save}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!returnId}
        onClose={() => setReturnId(null)}
        onConfirm={() => handleReturn(returnId!)}
        message={lang === 'dari' ? 'آیا موتر برگشت داده شده است؟' : 'ایا موټر راستون شوی دی؟'}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId!)}
        message={lang === 'dari'
          ? 'آیا از حذف این سفارش مطمئن هستید؟ اگر مشتری فقط همین سفارش را داشته باشد، اطلاعات مشتری نیز حذف خواهد شد.'
          : 'ایا د دې سفارش د ړنګولو ډاډه یاست؟ که مشتري یوازې دا سفارش ولري، د مشتري معلومات به هم ړنګ شي.'}
      />

      {/* Lightbox */}
      {lightboxIdx !== null && viewOrder && orderImages[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[9998] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative w-full max-w-4xl flex flex-col max-h-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox header */}
            <div className="flex items-center justify-between mb-3 gap-3">
              <div className="flex items-center gap-3">
                <span className="text-white/50 text-sm font-mono">{lightboxIdx + 1} / {orderImages.length}</span>
                <p className="text-white font-semibold text-sm">{orderImages[lightboxIdx].label}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(
                    orderImages[lightboxIdx].url,
                    `${viewOrder.contractNumber}-${orderImages[lightboxIdx].filename}`,
                  )}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {lang === 'dari' ? 'دانلود' : 'ډاونلوډ'}
                </button>
                <button
                  onClick={() => setLightboxIdx(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center rounded-xl overflow-hidden bg-black/40 min-h-0">
              <img
                src={orderImages[lightboxIdx].url}
                alt={orderImages[lightboxIdx].label}
                className="max-w-full max-h-[72vh] object-contain select-none"
                draggable={false}
              />
            </div>

            {/* Navigation */}
            {orderImages.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setLightboxIdx((lightboxIdx - 1 + orderImages.length) % orderImages.length)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex gap-1.5">
                  {orderImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIdx(i)}
                      className={`h-2 rounded-full transition-all duration-200 ${
                        i === lightboxIdx ? 'bg-amber-400 w-6' : 'w-2 bg-white/35 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % orderImages.length)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </MainLayout>
  );
}

/* ─── Section Table Helper ─── */
function SectionTable({
  icon, title, color, rows,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  rows: [string, any, boolean?, string?][];
}) {
  if (!rows.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: `linear-gradient(135deg,${color},${color}cc)` }}
        >
          {icon}
        </div>
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}40` }}>
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value, ltr, extraCls], i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                <td
                  className="px-4 py-2.5 font-semibold whitespace-nowrap border-b text-xs w-36"
                  style={{ borderColor: `${color}25`, color: `${color}` }}
                >
                  {label}
                </td>
                <td
                  className={`px-4 py-2.5 text-gray-800 border-b text-sm ${extraCls || 'font-medium'}`}
                  style={{ borderColor: `${color}25` }}
                  dir={ltr ? 'ltr' : undefined}
                >
                  {value || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
