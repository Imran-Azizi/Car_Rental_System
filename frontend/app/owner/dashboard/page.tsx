'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ownerPortalAPI } from '@/lib/api';
import { Car, FileText, TrendingUp, DollarSign, CheckCircle, Clock, ArrowLeft, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'فعال', color: '#16a34a', bg: '#dcfce7' },
  COMPLETED: { label: 'تکمیل شده', color: '#2563eb', bg: '#dbeafe' },
  CANCELLED: { label: 'لغو شده', color: '#dc2626', bg: '#fee2e2' },
  OVERDUE: { label: 'ناوقت', color: '#d97706', bg: '#fef3c7' },
};

function formatAFN(amount: number) {
  return new Intl.NumberFormat('fa-AF').format(Math.round(amount)) + ' ؋';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fa-AF', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('ownerUser');
    if (user) setOwner(JSON.parse(user));
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await ownerPortalAPI.getDashboard();
      setData(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) router.replace('/owner-login');
      else toast.error('خطا در بارگذاری داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: '#fef3c7' }} />
          ))}
        </div>
      </div>
    );
  }

  const { stats, recentContracts, cars } = data || {};

  const statCards = [
    { label: 'مجموع موترها', value: stats?.totalCars ?? 0, icon: Car, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', suffix: '' },
    { label: 'موترهای آزاد', value: stats?.availableCars ?? 0, icon: CheckCircle, gradient: 'linear-gradient(135deg, #10b981, #059669)', suffix: '' },
    { label: 'موترهای کرایه', value: stats?.rentedCars ?? 0, icon: Clock, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', suffix: '' },
    { label: 'قراردادهای فعال', value: stats?.activeContracts ?? 0, icon: FileText, gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', suffix: '' },
    { label: 'مجموع درآمد', value: formatAFN(stats?.totalContractValue ?? 0), icon: TrendingUp, gradient: 'linear-gradient(135deg, #f59e0b, #92400e)', suffix: '' },
    { label: 'مجموع دریافتی', value: formatAFN(stats?.totalReceived ?? 0), icon: DollarSign, gradient: 'linear-gradient(135deg, #10b981, #064e3b)', suffix: '' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">
            خوش آمدید، {owner?.fullName || 'صاحب موتر'} 👋
          </h1>
          <p className="text-amber-600 text-sm mt-1">خلاصه وضعیت موترها و قراردادهای شما</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-amber-800"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.06))', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Activity className="w-4 h-4" />
          داشبورد زنده
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="rounded-2xl p-5 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
            style={{ background: '#fff' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.gradient }}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-900 mb-1">{card.value}</p>
            <p className="text-amber-600 text-xs">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Contracts + Cars Quick View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Contracts */}
        <div className="xl:col-span-2 rounded-2xl border border-amber-100 overflow-hidden" style={{ background: '#fff' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">قراردادهای اخیر</h3>
            </div>
            <Link href="/owner/contracts" className="text-amber-600 hover:text-amber-800 text-sm flex items-center gap-1">
              مشاهده همه <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {!recentContracts?.length ? (
            <div className="py-12 text-center text-amber-400 text-sm">هنوز قراردادی ثبت نشده</div>
          ) : (
            <div className="divide-y divide-amber-50">
              {recentContracts.map((c: any) => (
                <div key={c.id} className="px-6 py-4 hover:bg-amber-50/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-amber-900 text-sm">{c.contractNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: statusLabels[c.status]?.bg, color: statusLabels[c.status]?.color }}>
                          {statusLabels[c.status]?.label}
                        </span>
                      </div>
                      <p className="text-amber-700 text-xs">{c.car?.carName} — {c.car?.plateNumber}</p>
                      <p className="text-amber-500 text-xs">{c.customer?.fullName}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-amber-800 font-semibold text-sm">{formatAFN(c.totalRent)}</p>
                      {c.remainingAmount > 0 && (
                        <p className="text-red-500 text-xs">باقی: {formatAFN(c.remainingAmount)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cars Quick View */}
        <div className="rounded-2xl border border-amber-100 overflow-hidden" style={{ background: '#fff' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-50">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">موترهای من</h3>
            </div>
            <Link href="/owner/cars" className="text-amber-600 hover:text-amber-800 text-sm flex items-center gap-1">
              همه <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {!cars?.length ? (
            <div className="py-12 text-center text-amber-400 text-sm">موتری ثبت نشده</div>
          ) : (
            <div className="divide-y divide-amber-50">
              {cars.slice(0, 6).map((car: any) => {
                const statusColors: Record<string, { dot: string; text: string }> = {
                  AVAILABLE: { dot: '#10b981', text: 'آزاد' },
                  RENTED: { dot: '#3b82f6', text: 'کرایه' },
                  MAINTENANCE: { dot: '#f59e0b', text: 'تعمیر' },
                  INACTIVE: { dot: '#9ca3af', text: 'غیرفعال' },
                };
                const sc = statusColors[car.status] || statusColors.INACTIVE;
                return (
                  <div key={car.id} className="px-5 py-3 hover:bg-amber-50/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-amber-900 text-sm">{car.carName}</p>
                        <p className="text-amber-500 text-xs" dir="ltr">{car.plateNumber}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                        <span className="text-xs font-medium" style={{ color: sc.dot }}>{sc.text}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
