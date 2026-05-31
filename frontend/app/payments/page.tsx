'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/lib/context';
import { ordersAPI, carOwnersAPI } from '@/lib/api';
import { TrendingUp, CreditCard, AlertCircle, CheckCircle, Banknote, Eye, Printer, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatAfghanDate, formatCurrency as fmtCur } from '@/lib/utils';
import { OWNER_PAYMENT_METHODS, openCarOwnerPaymentReceipt } from '@/lib/carOwnerReceipt';

export default function PaymentsPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [ownerPayments, setOwnerPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'owner'>('pending');

  useEffect(() => { if (!token) router.push('/'); else fetchData(); }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, ownerPaymentsRes] = await Promise.all([
        ordersAPI.getAll(),
        carOwnersAPI.getPayments({ limit: 100 }),
      ]);
      setContracts(contractsRes.data.data);
      setOwnerPayments(ownerPaymentsRes.data.data.payments);
    } catch { toast.error(t.error); } finally { setLoading(false); }
  };

  const formatCurrency = (n: number) => fmtCur(n, t.currency);
  const formatDate = (d: string) => d ? formatAfghanDate(d) : '-';

  const allPayments = contracts.flatMap(c => (c.payments || []).map((p: any) => ({ ...p, contract: c })));
  const pending = contracts.filter(c => c.remainingAmount > 0 && c.status === 'ACTIVE');
  const totalCollected = allPayments.reduce((s: number, p: any) => s + p.amount, 0);
  const totalPending = pending.reduce((s: number, c: any) => s + c.remainingAmount, 0);
  const totalOwnerPaid = ownerPayments.reduce((s: number, p: any) => s + p.amount, 0);

  const tabs = [
    { key: 'pending', label: lang === 'dari' ? 'پرداخت‌های باقی' : 'پاتې تادیات' },
    { key: 'all', label: lang === 'dari' ? 'همه پرداخت‌ها' : 'ټولې تادیات' },
    { key: 'owner', label: 'رسید پول صاحبان موتر' },
  ];

  return (
    <MainLayout>
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-amber-900">{t.payments}</h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="card-golden rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-amber-700">{lang === 'dari' ? 'مجموع دریافتی' : 'ټول ترلاسه شوي'}</p>
            </div>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCollected)}</p>
          </div>
          <div className="card-golden rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-amber-700">{t.pendingPayments}</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
          </div>
          <div className="card-golden rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-amber-700">{lang === 'dari' ? 'تعداد پرداخت‌ها' : 'د تادیو شمیر'}</p>
            </div>
            <p className="text-2xl font-bold text-amber-900">{allPayments.length}</p>
          </div>
          <div className="card-golden rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0891b2,#0e7490)' }}>
                <Banknote className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-amber-700">پول داده شده برای صاحبان موتر</p>
            </div>
            <p className="text-2xl font-bold text-cyan-800">{formatCurrency(totalOwnerPaid)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-amber-200">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab.key ? 'border-amber-500 text-amber-800' : 'border-transparent text-amber-500 hover:text-amber-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? <p className="text-center text-amber-500 py-8">{t.loading}</p> : (
          <>
            {/* Pending Payments */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {pending.length === 0 ? (
                  <div className="text-center py-12 text-amber-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p>{lang === 'dari' ? 'هیچ پرداخت باقی‌مانده‌ای وجود ندارد' : 'هیڅ پاتې تادیه نشته'}</p>
                  </div>
                ) : pending.map((c: any) => {
                  const isOverdue = c.status === 'OVERDUE';
                  const overdueDays = c.liveOverdueDays ?? 0;
                  const overdueCharge = c.liveOverdueCharges ?? c.liveTotalDelayPenalty ?? 0;
                  const finalTotal = c.liveFinalTotal ?? c.totalRent;
                  return (
                  <div key={c.id} className={`card-golden rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isOverdue ? 'border-2 border-red-200 bg-red-50/30' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">{c.contractNumber}</span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {lang === 'dari' ? 'تاخیر' : 'ځنډ'}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-amber-900">{c.customer?.fullName}</p>
                      <p className="text-xs text-amber-600">{c.car?.carName} — {c.car?.plateNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-600">{t.totalRent}: {formatCurrency(c.totalRent)}</p>
                      {isOverdue && overdueCharge > 0 && (
                        <p className="text-xs text-red-600 font-bold">+{formatCurrency(overdueCharge)} {lang === 'dari' ? 'جریمه تأخیر' : 'د ځنډ جریمه'}</p>
                      )}
                      <p className="text-xs text-amber-600">{t.advancePayment}: {formatCurrency(c.advancePayment)}</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(c.remainingAmount)}</p>
                      {isOverdue && overdueCharge > 0 && (
                        <p className="text-xs font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded mt-1 inline-block">
                          {lang === 'dari' ? 'نهایی:' : 'وروستی:'} {formatCurrency(finalTotal)}
                        </p>
                      )}
                      <p className="text-xs text-amber-500">{t.endDate}: {formatDate(c.endDate)}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* All Payments */}
            {activeTab === 'all' && (
              <div className="card-golden rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-golden min-w-[600px]">
                    <thead><tr>
                      <th className="px-4 py-3 text-right text-sm">{t.contractNo}</th>
                      <th className="px-4 py-3 text-right text-sm">{t.customer}</th>
                      <th className="px-4 py-3 text-right text-sm">{t.amount}</th>
                      <th className="px-4 py-3 text-right text-sm">{lang === 'dari' ? 'روش پرداخت' : 'د تادیي طریقه'}</th>
                      <th className="px-4 py-3 text-right text-sm">{t.date}</th>
                      <th className="px-4 py-3 text-right text-sm">{t.notes}</th>
                    </tr></thead>
                    <tbody>
                      {allPayments.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-amber-500">{t.noData}</td></tr>
                      ) : allPayments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((p: any) => (
                        <tr key={p.id} className="border-b border-amber-100">
                          <td className="px-4 py-3 text-xs font-mono text-amber-600">{p.contract?.contractNumber}</td>
                          <td className="px-4 py-3 text-sm">{p.contract?.customer?.fullName}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-700">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3 text-sm">{p.paymentMethod || '-'}</td>
                          <td className="px-4 py-3 text-xs">{formatAfghanDate(p.paymentDate)}</td>
                          <td className="px-4 py-3 text-xs text-amber-600">{p.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'owner' && (
              <div className="card-golden rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-golden min-w-[760px]">
                    <thead><tr>
                      <th className="px-4 py-3 text-right text-sm">شماره رسید</th>
                      <th className="px-4 py-3 text-right text-sm">صاحب موتر</th>
                      <th className="px-4 py-3 text-right text-sm">مبلغ پرداخت</th>
                      <th className="px-4 py-3 text-right text-sm">روش پرداخت</th>
                      <th className="px-4 py-3 text-right text-sm">تاریخ</th>
                      <th className="px-4 py-3 text-right text-sm">یادداشت</th>
                      <th className="px-4 py-3 text-right text-sm">رسید</th>
                    </tr></thead>
                    <tbody>
                      {ownerPayments.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-amber-500">{t.noData}</td></tr>
                      ) : ownerPayments.map((p: any) => (
                        <tr key={p.id} className="border-b border-amber-100">
                          <td className="px-4 py-3 text-xs font-mono text-amber-700" dir="ltr">{p.receiptNumber}</td>
                          <td className="px-4 py-3 text-sm font-medium">{p.owner?.fullName}</td>
                          <td className="px-4 py-3 text-sm font-bold text-cyan-700">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3 text-sm">{OWNER_PAYMENT_METHODS[p.paymentMethod || ''] || p.paymentMethod || '-'}</td>
                          <td className="px-4 py-3 text-xs">{formatAfghanDate(p.paymentDate)}</td>
                          <td className="px-4 py-3 text-xs text-amber-600 max-w-[160px] truncate">{p.notes || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openCarOwnerPaymentReceipt(p, 'view')} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50" title="مشاهده"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => openCarOwnerPaymentReceipt(p, 'print')} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50" title="چاپ"><Printer className="w-3.5 h-3.5" /></button>
                              <button onClick={() => openCarOwnerPaymentReceipt(p, 'pdf')} className="p-1 rounded-lg text-cyan-600 hover:bg-cyan-50" title="PDF"><Download className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
