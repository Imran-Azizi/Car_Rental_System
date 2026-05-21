'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ownerPortalAPI } from '@/lib/api';
import { User, Phone, MapPin, Hash, UserCheck, Car } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function OwnerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await ownerPortalAPI.getProfile();
      setProfile(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) router.replace('/owner-login');
      else toast.error('خطا در بارگذاری پروفایل');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-2xl animate-pulse" style={{ background: '#fef3c7' }} />;
  }

  const photoUrl = profile?.photo ? `${API_URL}${profile.photo}` : null;

  const fields = [
    { label: 'نام کامل', value: profile?.fullName, icon: User },
    { label: 'نام پدر', value: profile?.fatherName, icon: UserCheck },
    { label: 'نمبر تذکره', value: profile?.tazkiraNumber || '—', icon: Hash },
    { label: 'شماره تلفن', value: profile?.phoneNumber, icon: Phone, ltr: true },
    { label: 'آدرس', value: profile?.address || '—', icon: MapPin },
    { label: 'تعداد موترها', value: profile?._count?.cars ?? 0, icon: Car },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Card */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-100">
        {/* Header banner */}
        <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #f59e0b, transparent 60%)' }} />
        </div>

        {/* Avatar */}
        <div className="px-6 pb-6 bg-white">
          <div className="flex items-end gap-4 -mt-10 mb-5">
            {photoUrl ? (
              <img src={photoUrl} alt={profile?.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                {profile?.fullName?.[0] || 'م'}
              </div>
            )}
            <div className="mb-2">
              <h2 className="text-xl font-bold text-amber-900">{profile?.fullName}</h2>
              <p className="text-amber-600 text-sm flex items-center gap-1">
                <Car className="w-4 h-4" /> {profile?._count?.cars || 0} موتر ثبت شده
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ label, value, icon: Icon, ltr }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #fef9f0, #fffbf0)', border: '1px solid #fde68a' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-amber-600 text-xs mb-0.5">{label}</p>
                  <p className={`text-amber-900 font-semibold text-sm ${ltr ? 'dir-ltr' : ''}`}
                    dir={ltr ? 'ltr' : undefined}>
                    {String(value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-amber-500/60 text-xs text-center">
        برای تغییر اطلاعات یا رمز عبور با مدیریت تماس بگیرید
      </p>
    </div>
  );
}
