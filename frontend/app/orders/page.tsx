'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useApp } from '@/lib/context';
import { ordersAPI } from '@/lib/api';
import { Plus, Search, Eye, Trash2, CheckCircle, CreditCard, Printer, Pencil, Download, ZoomIn, ImageOff, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ContractBill, { BillData } from '@/components/ContractBill';
import { formatAfghanDate, formatCurrency as fmtCur, numericInputProps } from '@/lib/utils';

const STATUS_LIST = ['ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE'] as const;
const statusMap: any = {
  ACTIVE:    { dari: 'فعال',        pashto: 'فعال',    variant: 'active'    },
  COMPLETED: { dari: 'تکمیل',       pashto: 'بشپړ',    variant: 'completed' },
  CANCELLED: { dari: 'لغو',         pashto: 'لغوه',   variant: 'cancelled' },
  OVERDUE:   { dari: 'ناوقت',       pashto: 'ناوخته', variant: 'overdue'   },
};

const inputCls = 'w-full px-3 py-2 rounded-lg input-golden text-sm';
const labelCls = 'block text-sm font-medium text-amber-800 mb-1';

export default function AllOrdersPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewOrder, setViewOrder] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: '', notes: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [returnId, setReturnId] = useState<string | null>(null);
  const [printBill, setPrintBill] = useState<BillData | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
  const imgUrl = (p: string | null | undefined) => (p ? `${API_BASE}${p}` : null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const buildBillData = (c: any): BillData => ({
    contractNumber:          c.contractNumber,
    carName:                 c.car?.carName || '',
    model:                   c.car?.model || '',
    color:                   c.car?.color || '',
    plateNumber:             c.car?.plateNumber || '',
    dailyRate:               c.dailyRate || c.car?.dailyRate || 0,
    totalRent:               c.totalRent,
    advancePayment:          c.advancePayment,
    remainingAmount:         c.remainingAmount,
    startDate:               c.startDate,
    startTime:               c.startTime,
    endDate:                 c.endDate,
    endTime:                 c.endTime,
    carStatus:               c.car?.status,
    customerFullName:        c.customer?.fullName || '',
    customerFatherName:      c.customer?.fatherName || '',
    customerDistrict:        c.customer?.district,
    customerVillage:         c.customer?.village,
    customerProvince:        c.customer?.province,
    customerCurrentAddress:  c.customer?.currentAddress,
    customerTazkira:         c.customer?.tazkiraNumber,
    customerPhone:           c.customer?.phoneNumber,
    guarantorFullName:       c.guarantor?.fullName,
    guarantorFatherName:     c.guarantor?.fatherName,
    guarantorDistrict:       c.guarantor?.district,
    guarantorVillage:        c.guarantor?.village,
    guarantorProvince:       c.guarantor?.province,
    guarantorCurrentAddress: c.guarantor?.currentAddress,
    guarantorTazkira:        c.guarantor?.tazkiraNumber,
    guarantorPhone:          c.guarantor?.phoneNumber,
    notes:                   c.notes,
    customerPhoto:           c.customer?.photo,
  });

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
      await ordersAPI.addPayment(paymentModal.id, paymentForm);
      toast.success(t.paymentSaved);
      setPaymentModal(null);
      setPaymentForm({ amount: '', paymentMethod: '', notes: '' });
      fetchData();
    } catch { toast.error(t.error); } finally { setSavingPayment(false); }
  };


  const formatDate = (d: string) => formatAfghanDate(d);
  const formatCurrency = (n: number) => fmtCur(n, t.currency);

  // Reset lightbox when switching orders
  useEffect(() => { setLightboxIdx(null); }, [viewOrder]);

  const orderImages = viewOrder ? [
    { url: imgUrl(viewOrder.customer?.photo),    label: lang === 'dari' ? 'عکس مشتری'         : 'د مشتري انځور',   filename: 'customer-photo' },
    { url: imgUrl(viewOrder.guarantor?.photo),   label: lang === 'dari' ? 'عکس ضامن'          : 'د ضامن انځور',    filename: 'guarantor-photo' },
    { url: imgUrl(viewOrder.billDocPhoto),        label: lang === 'dari' ? 'عکس بل / قرارداد'  : 'د بل انځور',      filename: 'bill-doc' },
    { url: imgUrl(viewOrder.tazkiraDocPhoto),     label: lang === 'dari' ? 'عکس تذکره / هویت' : 'د تذکرې انځور',  filename: 'tazkira-doc' },
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
                ) : orders.map(c => (
                  <tr key={c.id} className="border-b border-amber-100">
                    <td className="px-4 py-3 text-xs font-mono text-amber-700">{c.contractNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{c.customer?.fullName}</div>
                      <div className="text-xs text-amber-500">{c.customer?.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{c.car?.carName}</div>
                      <div className="text-xs text-amber-500">{c.car?.plateNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDate(c.startDate)}</td>
                    <td className="px-4 py-3 text-xs">{formatDate(c.endDate)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(c.totalRent)}</td>
                    <td className="px-4 py-3 text-sm text-red-600 font-medium">{formatCurrency(c.remainingAmount)}</td>
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
                        <button
                          onClick={() => router.push(`/orders/new?edit=${c.id}`)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {lang === 'dari' ? 'ویرایش' : 'سمول'}
                        </button>
                        <button
                          onClick={() => setPrintBill(buildBillData(c))}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          {lang === 'dari' ? 'چاپ بل' : 'بل'}
                        </button>
                        {c.status === 'ACTIVE' && (
                          <>
                            <button
                              onClick={() => setPaymentModal(c)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {lang === 'dari' ? 'پرداخت' : 'تادیه'}
                            </button>
                            <button
                              onClick={() => setReturnId(c.id)}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Order Modal */}
      {viewOrder && (
        <Modal
          open={!!viewOrder}
          onClose={() => setViewOrder(null)}
          title={`${lang === 'dari' ? 'جزئیات سفارش' : 'د سفارش جزئیات'} — ${viewOrder.contractNumber}`}
          size="xl"
        >
          <div className="space-y-5">

            {/* Car & Rental Overview */}
            <div>
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                {t.carInfo}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t.carName,         value: viewOrder.car?.carName },
                  { label: t.plateNumber,     value: viewOrder.car?.plateNumber },
                  { label: t.startDate,       value: `${formatDate(viewOrder.startDate)}${viewOrder.startTime ? '  ' + viewOrder.startTime : ''}` },
                  { label: t.endDate,         value: `${formatDate(viewOrder.endDate)}${viewOrder.endTime ? '  ' + viewOrder.endTime : ''}` },
                  { label: t.totalRent,       value: formatCurrency(viewOrder.totalRent),       cls: 'font-bold text-amber-900' },
                  { label: t.advancePayment,  value: formatCurrency(viewOrder.advancePayment),  cls: 'font-bold text-green-700' },
                  { label: t.remainingAmount, value: formatCurrency(viewOrder.remainingAmount), cls: 'font-bold text-red-600' },
                  { label: t.status,          value: statusMap[viewOrder.status]?.[lang] || viewOrder.status },
                ].map(({ label, value, cls }: any) => (
                  <div key={label} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-amber-600 mb-0.5">{label}</p>
                    <p className={`text-sm ${cls || 'text-amber-900 font-medium'}`}>{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                {t.customerInfo}
              </h4>
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                  {[
                    { label: t.fullName,         value: viewOrder.customer?.fullName },
                    { label: t.fatherName,       value: viewOrder.customer?.fatherName },
                    { label: t.grandfatherName,  value: viewOrder.customer?.grandfatherName },
                    { label: t.tazkiraNumber,    value: viewOrder.customer?.tazkiraNumber },
                    { label: t.phone,            value: viewOrder.customer?.phoneNumber, ltr: true },
                    { label: t.occupation,       value: viewOrder.customer?.occupation },
                    { label: t.province,         value: viewOrder.customer?.province },
                    { label: t.district,         value: viewOrder.customer?.district },
                    { label: t.village,          value: viewOrder.customer?.village },
                    { label: t.currentAddress,   value: viewOrder.customer?.currentAddress,  span: true },
                    { label: t.permanentAddress, value: viewOrder.customer?.permanentAddress, span: true },
                    { label: t.notes,            value: viewOrder.customer?.notes,            span: true },
                  ].map(({ label, value, ltr, span }: any) => (
                    <div key={label} className={span ? 'col-span-2 sm:col-span-3' : ''}>
                      <p className="text-xs text-amber-600 font-medium mb-0.5">{label}</p>
                      <p className="text-sm text-amber-900 font-medium" dir={ltr ? 'ltr' : undefined}>{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Guarantor Details */}
            {viewOrder.guarantor && (
              <div>
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                  {t.guarantorInfo}
                </h4>
                <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                    {[
                      { label: t.fullName,        value: viewOrder.guarantor?.fullName },
                      { label: t.fatherName,      value: viewOrder.guarantor?.fatherName },
                      { label: t.grandfatherName, value: viewOrder.guarantor?.grandfatherName },
                      { label: t.tazkiraNumber,   value: viewOrder.guarantor?.tazkiraNumber },
                      { label: t.phone,           value: viewOrder.guarantor?.phoneNumber, ltr: true },
                      { label: t.relationship,    value: viewOrder.guarantor?.relationship },
                      { label: t.province,        value: viewOrder.guarantor?.province },
                      { label: t.district,        value: viewOrder.guarantor?.district },
                      { label: t.village,         value: viewOrder.guarantor?.village },
                      { label: t.currentAddress,  value: viewOrder.guarantor?.currentAddress, span: true },
                      { label: t.notes,           value: viewOrder.guarantor?.notes,           span: true },
                    ].map(({ label, value, ltr, span }: any) => (
                      <div key={label} className={span ? 'col-span-2 sm:col-span-3' : ''}>
                        <p className="text-xs text-purple-600 font-medium mb-0.5">{label}</p>
                        <p className="text-sm text-purple-900 font-medium" dir={ltr ? 'ltr' : undefined}>{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            {viewOrder.payments?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                  {t.payments}
                </h4>
                <div className="space-y-2">
                  {viewOrder.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                      <span className="text-green-800 font-bold">{formatCurrency(p.amount)}</span>
                      <span className="text-green-600 text-xs">{formatAfghanDate(p.paymentDate)}</span>
                      {p.notes && <span className="text-green-600 text-xs">{p.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images & Documents */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 inline-block" />
                  {lang === 'dari' ? 'تصاویر و اسناد' : 'انځورونه او اسناد'}
                </h4>
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
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50">
                  <ImageOff className="w-10 h-10 text-amber-300 mb-3" />
                  <p className="text-sm font-semibold text-amber-500">
                    {lang === 'dari' ? 'هیچ تصویری برای این سفارش ثبت نشده است' : 'د دې سفارش لپاره هیڅ انځور نشته'}
                  </p>
                  <p className="text-xs text-amber-400 mt-1">
                    {lang === 'dari' ? 'تصاویر هنگام ثبت سفارش آپلود می‌شوند' : 'انځورونه د سفارش د ثبت پر مهال پورته کیږي'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {orderImages.map((img, idx) => (
                    <div key={idx} className="group rounded-xl overflow-hidden border-2 border-amber-100 bg-white shadow-sm hover:shadow-md transition-all">
                      <div
                        className="relative aspect-square cursor-pointer overflow-hidden bg-amber-50"
                        onClick={() => setLightboxIdx(idx)}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-200">
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

            {/* Status & Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-amber-200">
              <Badge variant={statusMap[viewOrder.status]?.variant} label={statusMap[viewOrder.status]?.[lang]} />
              {viewOrder.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPaymentModal(viewOrder); setViewOrder(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />{t.addPayment}
                  </button>
                  <button
                    onClick={() => { setReturnId(viewOrder.id); setViewOrder(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />{t.markReturned}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Modal */}
      <Modal open={!!paymentModal} onClose={() => setPaymentModal(null)} title={t.addPayment} size="sm">
        <div className="space-y-4">
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
            <label className={labelCls}>{lang === 'dari' ? 'روش پرداخت' : 'د تادیي طریقه'}</label>
            <select
              value={paymentForm.paymentMethod}
              onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className={inputCls}
            >
              <option value="">{lang === 'dari' ? 'انتخاب کنید' : 'غوره کړئ'}</option>
              <option value="نقد">{lang === 'dari' ? 'نقد' : 'نقدي'}</option>
              <option value="انتقال">{lang === 'dari' ? 'انتقال بانکی' : 'بانکي لیږد'}</option>
              <option value="موبایل">{lang === 'dari' ? 'موبایل پیسه' : 'موبایل پیسه'}</option>
            </select>
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
            <button onClick={() => setPaymentModal(null)} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">
              {t.cancel}
            </button>
            <button onClick={handlePayment} disabled={savingPayment} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">
              {savingPayment ? t.loading : t.save}
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

      {printBill && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto', background: '#d1d5db' }}>
          <ContractBill
            data={printBill}
            lang={lang as 'dari' | 'pashto'}
            onClose={() => setPrintBill(null)}
            autoPrint={true}
          />
        </div>
      )}
    </MainLayout>
  );
}
