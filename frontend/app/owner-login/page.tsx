'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ownerAuthAPI } from '@/lib/api';
import { Eye, EyeOff, Phone, Lock, AlertCircle } from 'lucide-react';

export default function OwnerLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ phone: '', password: '' });

  useEffect(() => {
    const token = localStorage.getItem('ownerToken');
    if (token) router.replace('/owner/dashboard');
  }, []);

  const validate = () => {
    const errs = { phone: '', password: '' };
    if (!phoneNumber.trim()) errs.phone = 'شماره تلفن الزامی است';
    if (!password.trim()) errs.password = 'رمز عبور الزامی است';
    setFieldErrors(errs);
    return !errs.phone && !errs.password;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await ownerAuthAPI.login({ phoneNumber: phoneNumber.trim(), password });
      const { token, owner } = res.data.data;
      localStorage.setItem('ownerToken', token);
      localStorage.setItem('ownerUser', JSON.stringify(owner));
      router.push('/owner/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'شماره تلفن یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
      style={{ background: '#f5f5f5' }}>

      <div className="w-full max-w-md fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 border border-gray-100 bg-white shadow-sm">
            <Image
              src="/logo.png"
              alt="مرکز کرایه موتر افشار"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900">مرکز کرایه موتر افشار</h1>
          <p className="text-gray-500 text-sm mt-1">پنل اختصاصی صاحب موتر</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">ورود به پنل</h2>
            <p className="text-gray-500 text-sm mt-0.5">با شماره تلفن و رمز عبور وارد شوید</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg mb-4 bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">شماره تلفن</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => { setPhoneNumber(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); setError(''); }}
                  placeholder="07X-XXXXXXX"
                  dir="ltr"
                  className={`w-full pr-10 pl-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${fieldErrors.phone ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'}`}
                />
              </div>
              {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); setError(''); }}
                  placeholder="رمز عبور خود را وارد کنید"
                  className={`w-full pr-10 pl-10 py-2.5 rounded-lg border text-sm outline-none transition-all ${fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  در حال ورود...
                </span>
              ) : 'ورود به پنل'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-xs">
              برای دریافت رمز عبور با مدیریت تماس بگیرید
            </p>
          </div>
        </div>

        {/* Admin link */}
        <div className="text-center mt-4">
          <a href="/" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">
            ورود مدیریت ←
          </a>
        </div>
      </div>
    </div>
  );
}