'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ownerPortalAPI } from '@/lib/api';
import { FileText, Search, Filter, ChevronDown, ChevronUp, CreditCard, CalendarClock, Lock, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatAfghanDate, formatCurrency } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'فعال', color: '#16a34a', bg: '#dcfce7' },
  COMPLETED: { label: 'تکمیل شده', color: '#2563eb', bg: '#dbeafe' },
  CANCELLED: { label: 'لغو شده', color: '#dc2626', bg: '#fee2e2' },
  OVERDUE: { label: 'ناوقت', color: '#d97706', bg: '#fef3c7' },
};

export default function OwnerContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchContracts(); }, [search, statusFilter]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await ownerPortalAPI.getContracts({ search: search || undefined, status: statusFilter || undefined });
      setContracts(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) router.replace('/owner-login');
      else toast.error('خطا در بارگذاری قراردادها');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-amber-900">قراردادهای من</h2>
            <p className="text-sm text-amber-600">{contracts.length} قرارداد</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو..."
            className="pr-10 pl-4 py-2 rounded-xl border border-amber-200 text-sm outline-none focus:border-amber-400 bg-white text-amber-900 min-w-[200px]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pr-9 pl-4 py-2 rounded-xl border border-amber-200 text-sm outline-none focus:border-amber-400 bg-white text-amber-900 appearance-none cursor-pointer">
            <option value="">همه وضعیت‌ها</option>
            <option value="ACTIVE">فعال</option>
            <option value="COMPLETED">تکمیل شده</option>
            <option value="CANCELLED">لغو شده</option>
            <option value="OVERDUE">ناوقت</option>
          </select>
        </div>
      </div>

      {/* Contracts List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#fef3c7' }} />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-white py-20 text-center">
          <FileText className="w-12 h-12 text-amber-200 mx-auto mb-3" />
          <p className="text-amber-400">قراردادی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const sc = statusConfig[c.status] || statusConfig.ACTIVE;
            const isExpanded = expandedId === c.id;
            const isActive = c.status === 'ACTIVE';
            const totalPaid = c.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

            return (
              <div key={c.id} className={`rounded-2xl overflow-hidden hover:shadow-sm transition-shadow ${
                isActive
                  ? 'border-2 border-blue-200 bg-blue-50/30'
                  : 'border border-amber-100 bg-white'
              }`}>
                {/* Main row */}
                <button
                  onClick={() => !isActive && setExpandedId(isExpanded ? null : c.id)}
                  className={`w-full px-5 py-4 flex items-center gap-4 text-right transition-colors ${
                    isActive ? 'cursor-default' : 'hover:bg-amber-50/30 cursor-pointer'
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-amber-900 text-sm">{c.contractNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="text-xs text-amber-600">
                      موتر: {c.car?.carName} ({c.car?.plateNumber})
                    </div>

                    {/* Booking period — always visible */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium"
                      style={{ color: isActive ? '#1d4ed8' : '#78716c' }}>
                      <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                      {formatAfghanDate(c.startDate)} — {formatAfghanDate(c.endDate)}
                    </div>

                    {/* Customer — only after return */}
                    {!isActive && c.customer?.fullName && (
                      <p className="text-amber-500 text-xs mt-0.5">مشتری: {c.customer.fullName}</p>
                    )}
                  </div>

                  {isActive ? (
                    /* ── ACTIVE: locked badge ── */
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0"
                      style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                      <Lock className="w-3.5 h-3.5" />
                      اطلاعات پس از برگشت
                    </div>
                  ) : (
                    <>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-amber-900">{formatCurrency(c.totalRent)}</p>
                        {(c.remainingAmount ?? 0) > 0 ? (
                          <p className="text-red-500 text-xs">باقی: {formatCurrency(c.remainingAmount)}</p>
                        ) : (
                          <p className="text-green-600 text-xs">پرداخت کامل</p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                    </>
                  )}
                </button>

                {/* ACTIVE — restricted notice */}
                {isActive && (
                  <div className="mx-5 mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-xs"
                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      موتر در حال کرایه است. جزئیات مالی و اطلاعات مشتری پس از برگشت موتر نمایش داده می‌شود.
                    </span>
                  </div>
                )}

                {/* Expanded Detail — only for non-active contracts */}
                {!isActive && isExpanded && (
                  <div className="px-5 pb-4 border-t border-amber-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 mb-4">
                      <div className="p-3 rounded-xl text-xs" style={{ background: '#fef9f0', border: '1px solid #fde68a' }}>
                        <p className="text-amber-500 mb-1">قیمت روزانه</p>
                        <p className="font-bold text-amber-900">{formatCurrency(c.rentPrice)}</p>
                      </div>
                      <div className="p-3 rounded-xl text-xs" style={{ background: '#fef9f0', border: '1px solid #fde68a' }}>
                        <p className="text-amber-500 mb-1">پیش پرداخت</p>
                        <p className="font-bold text-amber-900">{formatCurrency(c.advancePayment)}</p>
                      </div>
                      <div className="p-3 rounded-xl text-xs" style={{ background: '#fef9f0', border: '1px solid #fde68a' }}>
                        <p className="text-amber-500 mb-1">مجموع دریافت شده</p>
                        <p className="font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                      </div>
                    </div>

                    {/* Payments */}
                    {c.payments?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5" /> پرداخت‌ها ({c.payments.length})
                        </h4>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {c.payments.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                              <span className="text-green-700 font-medium">{formatCurrency(p.amount)}</span>
                              <span className="text-green-600">{formatAfghanDate(p.paymentDate)}</span>
                              {p.paymentMethod && <span className="text-green-500">{p.paymentMethod}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
