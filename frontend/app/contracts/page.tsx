'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useApp } from '@/lib/context';
import { contractsAPI } from '@/lib/api';
import { Plus, Search, Eye, Trash2, CheckCircle, CreditCard, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ContractBill, { BillData } from '@/components/ContractBill';
import { formatAfghanDate } from '@/lib/utils';

const STATUS_LIST = ['ACTIVE','COMPLETED','CANCELLED','OVERDUE'] as const;
const statusMap: any = {
  ACTIVE: { dari:'فعال', pashto:'فعال', variant:'active' },
  COMPLETED: { dari:'تکمیل', pashto:'بشپړ', variant:'completed' },
  CANCELLED: { dari:'لغو', pashto:'لغوه', variant:'cancelled' },
  OVERDUE: { dari:'ناوقت', pashto:'ناوخته', variant:'overdue' },
};

const inputCls = "w-full px-3 py-2 rounded-lg input-golden text-sm";
const labelCls = "block text-sm font-medium text-amber-800 mb-1";

export default function ContractsPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewContract, setViewContract] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: '', notes: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [returnId, setReturnId] = useState<string | null>(null);
  const [printBill, setPrintBill] = useState<BillData | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const buildBillData = (c: any): BillData => ({
    contractNumber:       c.contractNumber,
    carName:              c.car?.carName || '',
    model:                c.car?.model || '',
    color:                c.car?.color || '',
    plateNumber:          c.car?.plateNumber || '',
    dailyRate:            c.dailyRate || c.car?.dailyRate || 0,
    totalRent:            c.totalRent,
    advancePayment:       c.advancePayment,
    remainingAmount:      c.remainingAmount,
    startDate:            c.startDate,
    startTime:            c.startTime,
    endDate:              c.endDate,
    endTime:              c.endTime,
    carStatus:            c.car?.status,
    customerFullName:     c.customer?.fullName || '',
    customerFatherName:   c.customer?.fatherName || '',
    customerDistrict:     c.customer?.district,
    customerVillage:      c.customer?.village,
    customerProvince:     c.customer?.province,
    customerCurrentAddress: c.customer?.currentAddress,
    customerTazkira:      c.customer?.tazkiraNumber,
    customerPhone:        c.customer?.phoneNumber,
    guarantorFullName:    c.guarantor?.fullName,
    guarantorFatherName:  c.guarantor?.fatherName,
    guarantorDistrict:    c.guarantor?.district,
    guarantorVillage:     c.guarantor?.village,
    guarantorProvince:    c.guarantor?.province,
    guarantorCurrentAddress: c.guarantor?.currentAddress,
    guarantorTazkira:     c.guarantor?.tazkiraNumber,
    guarantorPhone:       c.guarantor?.phoneNumber,
    notes:                c.notes,
  });

  // Debounce search input — avoids API call on every keystroke
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Single combined effect — no double-fetch on mount
  useEffect(() => {
    if (!token) { router.push('/'); return; }
    fetchData();
  }, [token, debouncedSearch, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await contractsAPI.getAll({ search: debouncedSearch, status: statusFilter });
      setContracts(res.data.data);
    } catch { toast.error(t.error); } finally { setLoading(false); }
  };

  const handleReturn = async (id: string) => {
    try { await contractsAPI.markReturned(id); toast.success(t.markReturned); fetchData(); }
    catch { toast.error(t.error); }
  };

  const handleDelete = async (id: string) => {
    try { await contractsAPI.delete(id); toast.success('قرارداد حذف شد'); fetchData(); }
    catch { toast.error(t.error); }
  };

  const handlePayment = async () => {
    if (!paymentForm.amount) return toast.error(t.enterAmount);
    setSavingPayment(true);
    try {
      await contractsAPI.addPayment(paymentModal.id, paymentForm);
      toast.success(t.paymentSaved);
      setPaymentModal(null);
      setPaymentForm({ amount: '', paymentMethod: '', notes: '' });
      fetchData();
    } catch { toast.error(t.error); } finally { setSavingPayment(false); }
  };

  const formatDate = (d: string) => formatAfghanDate(d);
  const formatCurrency = (n: number) => `${(n || 0).toLocaleString()} ${t.currency}`;

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-amber-900">{t.contracts}</h2>
          <Link href="/contracts/new" className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />{t.newContract}
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder} className="w-full pr-10 py-2 px-3 rounded-lg input-golden text-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg input-golden text-sm min-w-[140px]">
            <option value="">{t.all}</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{statusMap[s]?.[lang]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-golden min-w-[800px]">
              <thead><tr>
                <th className="px-4 py-3 text-right text-sm">{t.contractNo}</th>
                <th className="px-4 py-3 text-right text-sm">{t.customer}</th>
                <th className="px-4 py-3 text-right text-sm">{t.car}</th>
                <th className="px-4 py-3 text-right text-sm">{t.startDate}</th>
                <th className="px-4 py-3 text-right text-sm">{t.endDate}</th>
                <th className="px-4 py-3 text-right text-sm">{t.totalRent}</th>
                <th className="px-4 py-3 text-right text-sm">{t.remainingAmount}</th>
                <th className="px-4 py-3 text-right text-sm">{t.status}</th>
                <th className="px-4 py-3 text-right text-sm">{t.actions}</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-amber-500">{t.loading}</td></tr>
                ) : contracts.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-amber-500">{t.noData}</td></tr>
                ) : contracts.map(c => (
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
                    <td className="px-4 py-3"><Badge variant={statusMap[c.status]?.variant} label={statusMap[c.status]?.[lang] || c.status} /></td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <button onClick={() => setViewContract(c)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200">
                          <Eye className="w-3.5 h-3.5" />{lang === 'dari' ? 'مشاهده' : 'کتل'}
                        </button>
                        <button onClick={() => setPrintBill(buildBillData(c))}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200">
                          <Printer className="w-3.5 h-3.5" />{lang === 'dari' ? 'چاپ بل' : 'بل'}
                        </button>
                        {c.status === 'ACTIVE' && <>
                          <button onClick={() => setPaymentModal(c)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors border border-green-200">
                            <CreditCard className="w-3.5 h-3.5" />{lang === 'dari' ? 'پرداخت' : 'تادیه'}
                          </button>
                          <button onClick={() => setReturnId(c.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200">
                            <CheckCircle className="w-3.5 h-3.5" />{lang === 'dari' ? 'برگشت' : 'راستون'}
                          </button>
                        </>}
                        <button onClick={() => setDeleteId(c.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200">
                          <Trash2 className="w-3.5 h-3.5" />{lang === 'dari' ? 'حذف' : 'ړنګول'}
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

      {/* View Contract Modal */}
      {viewContract && (
        <Modal open={!!viewContract} onClose={() => setViewContract(null)} title={`${t.contractDetails} — ${viewContract.contractNumber}`} size="xl">
          <div className="space-y-5">

            {/* ── Contract & Car Overview ── */}
            <div>
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-amber-400 inline-block"/>
                {t.carInfo}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t.carName,         value: viewContract.car?.carName },
                  { label: t.plateNumber,     value: viewContract.car?.plateNumber },
                  { label: t.startDate,       value: `${formatDate(viewContract.startDate)}${viewContract.startTime ? '  ' + viewContract.startTime : ''}` },
                  { label: t.endDate,         value: `${formatDate(viewContract.endDate)}${viewContract.endTime ? '  ' + viewContract.endTime : ''}` },
                  { label: t.totalRent,       value: formatCurrency(viewContract.totalRent),       cls: 'font-bold text-amber-900' },
                  { label: t.advancePayment,  value: formatCurrency(viewContract.advancePayment),  cls: 'font-bold text-green-700' },
                  { label: t.remainingAmount, value: formatCurrency(viewContract.remainingAmount), cls: 'font-bold text-red-600' },
                  { label: t.status,          value: statusMap[viewContract.status]?.[lang] || viewContract.status },
                ].map(({ label, value, cls }: any) => (
                  <div key={label} className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-amber-600 mb-0.5">{label}</p>
                    <p className={`text-sm ${cls || 'text-amber-900 font-medium'}`}>{value || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Customer Details ── */}
            <div>
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-4 h-0.5 bg-amber-400 inline-block"/>
                {t.customerInfo}
              </h4>
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                  {[
                    { label: t.fullName,         value: viewContract.customer?.fullName },
                    { label: t.fatherName,       value: viewContract.customer?.fatherName },
                    { label: t.grandfatherName,  value: viewContract.customer?.grandfatherName },
                    { label: t.tazkiraNumber,    value: viewContract.customer?.tazkiraNumber },
                    { label: t.phone,            value: viewContract.customer?.phoneNumber, ltr: true },
                    { label: t.occupation,       value: viewContract.customer?.occupation },
                    { label: t.province,         value: viewContract.customer?.province },
                    { label: t.district,         value: viewContract.customer?.district },
                    { label: t.village,          value: viewContract.customer?.village },
                    { label: t.currentAddress,   value: viewContract.customer?.currentAddress,  span: true },
                    { label: t.permanentAddress, value: viewContract.customer?.permanentAddress, span: true },
                    { label: t.notes,            value: viewContract.customer?.notes,            span: true },
                  ].map(({ label, value, ltr, span }: any) => (
                    <div key={label} className={span ? 'col-span-2 sm:col-span-3' : ''}>
                      <p className="text-xs text-amber-600 font-medium mb-0.5">{label}</p>
                      <p className="text-sm text-amber-900 font-medium" dir={ltr ? 'ltr' : undefined}>{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Guarantor Details ── */}
            {viewContract.guarantor && (
              <div>
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 inline-block"/>
                  {t.guarantorInfo}
                </h4>
                <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                    {[
                      { label: t.fullName,        value: viewContract.guarantor?.fullName },
                      { label: t.fatherName,      value: viewContract.guarantor?.fatherName },
                      { label: t.grandfatherName, value: viewContract.guarantor?.grandfatherName },
                      { label: t.tazkiraNumber,   value: viewContract.guarantor?.tazkiraNumber },
                      { label: t.phone,           value: viewContract.guarantor?.phoneNumber, ltr: true },
                      { label: t.relationship,    value: viewContract.guarantor?.relationship },
                      { label: t.province,        value: viewContract.guarantor?.province },
                      { label: t.district,        value: viewContract.guarantor?.district },
                      { label: t.village,         value: viewContract.guarantor?.village },
                      { label: t.currentAddress,  value: viewContract.guarantor?.currentAddress, span: true },
                      { label: t.notes,           value: viewContract.guarantor?.notes,           span: true },
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

            {/* ── Payments ── */}
            {viewContract.payments?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-amber-400 inline-block"/>
                  {t.payments}
                </h4>
                <div className="space-y-2">
                  {viewContract.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                      <span className="text-green-800 font-bold">{formatCurrency(p.amount)}</span>
                      <span className="text-green-600 text-xs">{formatAfghanDate(p.paymentDate)}</span>
                      {p.notes && <span className="text-green-600 text-xs">{p.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Status & Actions ── */}
            <div className="flex items-center justify-between pt-3 border-t border-amber-200">
              <Badge variant={statusMap[viewContract.status]?.variant} label={statusMap[viewContract.status]?.[lang]} />
              {viewContract.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <button onClick={() => { setPaymentModal(viewContract); setViewContract(null); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-green-500 hover:bg-green-600 text-white transition-colors">
                    <CreditCard className="w-4 h-4" />{t.addPayment}
                  </button>
                  <button onClick={() => { setReturnId(viewContract.id); setViewContract(null); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors">
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
              <p className="text-amber-700">{t.remainingAmount}: <span className="font-bold text-red-600">{formatCurrency(paymentModal.remainingAmount)}</span></p>
            </div>
          )}
          <div>
            <label className={labelCls}>{t.amount} *</label>
            <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>{lang === 'dari' ? 'روش پرداخت' : 'د تادیي طریقه'}</label>
            <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} className={inputCls}>
              <option value="">{lang === 'dari' ? 'انتخاب کنید' : 'غوره کړئ'}</option>
              <option value="نقد">{lang === 'dari' ? 'نقد' : 'نقدي'}</option>
              <option value="انتقال">{lang === 'dari' ? 'انتقال بانکی' : 'بانکي لیږد'}</option>
              <option value="موبایل">{lang === 'dari' ? 'موبایل پیسه' : 'موبایل پیسه'}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{t.notes}</label>
            <input value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setPaymentModal(null)} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">{t.cancel}</button>
            <button onClick={handlePayment} disabled={savingPayment} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">
              {savingPayment ? t.loading : t.save}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!returnId} onClose={() => setReturnId(null)} onConfirm={() => handleReturn(returnId!)} message={lang === 'dari' ? 'آیا موتر برگشت داده شده است؟' : 'ایا موټر راستون شوی دی؟'} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => handleDelete(deleteId!)} message={lang === 'dari' ? 'آیا از حذف این قرارداد مطمئن هستید؟' : 'ایا د دې قرارداد د ړنګولو ډاډه یاست؟'} />

      {printBill && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto', background: '#d1d5db' }}>
          <ContractBill data={printBill} lang={lang as 'dari' | 'pashto'} onClose={() => setPrintBill(null)} autoPrint={true} />
        </div>
      )}
    </MainLayout>
  );
}
