'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ownerPortalAPI } from '@/lib/api';
import { OWNER_PAYMENT_METHODS, openCarOwnerPaymentReceipt } from '@/lib/carOwnerReceipt';
import { formatAfghanDate, formatCurrency, formatNumber } from '@/lib/utils';
import { Banknote, Search, Eye, Printer, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerPaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('ownerUser');
    if (user) setOwner(JSON.parse(user));
    fetchPayments();
  }, []);

  const fetchPayments = async (searchValue = search) => {
    setLoading(true);
    try {
      const res = await ownerPortalAPI.getPayments({ search: searchValue || undefined, limit: 100 });
      setPayments(res.data.data.payments);
      setTotalPaid(res.data.data.totalPaid || 0);
      setCount(res.data.data.count || 0);
    } catch (err: any) {
      if (err.response?.status === 401) router.replace('/owner-login');
      else toast.error('خطا در بارگذاری پرداخت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const paymentForReceipt = (payment: any) => ({ ...payment, owner });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)' }}>
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-amber-900">پول داده شده</h2>
            <p className="text-sm text-amber-600">{count} رسید پرداخت</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
          <div className="h-1 bg-emerald-500" />
          <div className="p-5">
            <p className="text-sm text-emerald-700 font-bold">مجموع پول داده شده</p>
            <p className="text-2xl font-black text-emerald-900 mt-2">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-white overflow-hidden">
          <div className="h-1 bg-cyan-600" />
          <div className="p-5">
            <p className="text-sm text-cyan-700 font-bold">تعداد رسیدها</p>
            <p className="text-2xl font-black text-cyan-900 mt-2">{formatNumber(count)}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white overflow-hidden">
          <div className="h-1 bg-amber-500" />
          <div className="p-5">
            <p className="text-sm text-amber-700 font-bold">آخرین پرداخت</p>
            <p className="text-lg font-black text-amber-900 mt-2">{payments[0] ? formatAfghanDate(payments[0].paymentDate) : '-'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجوی شماره رسید، روش پرداخت یا یادداشت..."
            className="w-full pr-10 pl-3 py-2 rounded-xl border border-amber-200 bg-white text-sm outline-none focus:border-amber-400"
          />
        </div>
        <button onClick={() => fetchPayments(search)} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600">
          جستجو
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-amber-500">در حال بارگذاری...</div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-white py-20 text-center">
          <FileText className="w-12 h-12 text-amber-200 mx-auto mb-3" />
          <p className="text-amber-400">هنوز رسید پرداختی ثبت نشده است</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-100 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)' }}>
                <tr className="border-b border-amber-200">
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-700">شماره رسید</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-700">تاریخ پرداخت</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-700">مبلغ پرداخت</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-700">روش پرداخت</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-700">یادداشت</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-700">ثبت توسط</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-amber-700">رسید</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-amber-50/40">
                    <td className="px-4 py-3 text-xs font-mono text-amber-800" dir="ltr">{payment.receiptNumber}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatAfghanDate(payment.paymentDate)}</td>
                    <td className="px-4 py-3 text-sm font-black text-emerald-700" dir="ltr">{formatNumber(payment.amount)} ؋</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{OWNER_PAYMENT_METHODS[payment.paymentMethod || ''] || payment.paymentMethod || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{payment.notes || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{payment.createdBy || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openCarOwnerPaymentReceipt(paymentForReceipt(payment), 'view')} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="مشاهده رسید"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openCarOwnerPaymentReceipt(paymentForReceipt(payment), 'print')} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50" title="چاپ رسید"><Printer className="w-4 h-4" /></button>
                        <button onClick={() => openCarOwnerPaymentReceipt(paymentForReceipt(payment), 'pdf')} className="p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-50" title="دانلود PDF"><Download className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
