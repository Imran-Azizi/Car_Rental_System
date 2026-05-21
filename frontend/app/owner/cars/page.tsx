'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ownerPortalAPI } from '@/lib/api';
import { Car, Search, Filter, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  AVAILABLE: { label: 'آزاد', color: '#16a34a', bg: '#dcfce7', dot: '#10b981' },
  RENTED: { label: 'کرایه', color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
  MAINTENANCE: { label: 'تعمیر', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  INACTIVE: { label: 'غیرفعال', color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
};

function formatAFN(amount: number) {
  return new Intl.NumberFormat('fa-AF').format(Math.round(amount)) + ' ؋';
}

export default function OwnerCarsPage() {
  const router = useRouter();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchCars(); }, [search, statusFilter]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await ownerPortalAPI.getCars({ search: search || undefined, status: statusFilter || undefined });
      setCars(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) router.replace('/owner-login');
      else toast.error('خطا در بارگذاری موترها');
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
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-amber-900">موترهای من</h2>
            <p className="text-sm text-amber-600">{cars.length} موتر ثبت شده</p>
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
            <option value="AVAILABLE">آزاد</option>
            <option value="RENTED">کرایه</option>
            <option value="MAINTENANCE">تعمیر</option>
            <option value="INACTIVE">غیرفعال</option>
          </select>
        </div>
      </div>

      {/* Cars Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: '#fef3c7' }} />
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="rounded-2xl border border-amber-100 bg-white py-20 text-center">
          <Car className="w-12 h-12 text-amber-200 mx-auto mb-3" />
          <p className="text-amber-400">موتری یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cars.map((car) => {
            const sc = statusConfig[car.status] || statusConfig.INACTIVE;
            const thumb = car.images?.[0]?.url;
            const activeContract = car.rentalContracts?.[0];
            return (
              <div key={car.id} className="rounded-2xl border border-amber-100 bg-white overflow-hidden hover:shadow-md transition-shadow">
                {/* Car Image */}
                <div className="h-40 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                  {thumb ? (
                    <img src={`${API_URL}${thumb}`} alt={car.carName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-10 h-10 text-amber-300" />
                      <span className="text-amber-400 text-xs">بدون عکس</span>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow"
                      style={{ background: sc.bg, color: sc.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {sc.label}
                    </span>
                  </div>
                </div>

                {/* Car Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-amber-900">{car.carName}</h3>
                      <p className="text-amber-600 text-xs">{car.carType} — {car.model}</p>
                    </div>
                    <span className="text-amber-500 text-xs font-medium" dir="ltr">{car.plateNumber}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-amber-600 mb-3">
                    <span>رنگ: {car.color}</span>
                    <span>{formatAFN(car.dailyRate)} / روز</span>
                  </div>

                  {activeContract && (
                    <div className="p-2.5 rounded-xl text-xs" style={{ background: '#dbeafe', color: '#1e40af' }}>
                      <p className="font-medium">در حال کرایه توسط:</p>
                      <p>{activeContract.customer?.fullName}</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-amber-500">
                    <span>{car._count?.rentalContracts || 0} قرارداد</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
