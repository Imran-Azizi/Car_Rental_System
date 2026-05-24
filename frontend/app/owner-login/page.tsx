'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ownerAuthAPI } from '@/lib/api';
import { Eye, EyeOff, Phone, Lock, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

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
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-5 shadow-2xl"
            style={{
              background: '#fff',
              padding: '8px',
              border: '3px solid rgba(245,158,11,0.4)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.25), 0 2px 8px rgba(0,0,0,0.3)',
            }}>
            <Image
              src="/logo.png"
              alt="مرکز کرایه موتر افشار"
              width={100}
              height={100}
              className="object-contain w-full h-full"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">مرکز کرایه موتر افشار</h1>
          <p className="text-amber-300 text-sm">پنل اختصاصی صاحب موتر</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-8 shadow-2xl border"
          style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">ورود به پنل</h2>
            <p className="text-amber-200/70 text-sm mt-1">با شماره تلفن و رمز عبور وارد شوید</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-5 border"
              style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-1.5">شماره تلفن</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => { setPhoneNumber(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); setError(''); }}
                  placeholder="07X-XXXXXXX"
                  dir="ltr"
                  className="w-full pr-10 pl-4 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${fieldErrors.phone ? '#ef4444' : 'rgba(245,158,11,0.3)'}`,
                    color: '#fff',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = fieldErrors.phone ? '#ef4444' : 'rgba(245,158,11,0.3)'}
                />
              </div>
              {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-1.5">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); setError(''); }}
                  placeholder="رمز عبور خود را وارد کنید"
                  className="w-full pr-10 pl-10 py-3 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: `1px solid ${fieldErrors.password ? '#ef4444' : 'rgba(245,158,11,0.3)'}`,
                    color: '#fff',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f59e0b'}
                  onBlur={e => e.target.style.borderColor = fieldErrors.password ? '#ef4444' : 'rgba(245,158,11,0.3)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#92400e' : 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  در حال ورود...
                </span>
              ) : 'ورود به پنل'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
            <p className="text-amber-200/50 text-xs">
              برای دریافت رمز عبور با مدیریت تماس بگیرید
            </p>
          </div>
        </div>

        {/* Admin link */}
        <div className="text-center mt-4">
          <a href="/" className="text-amber-400/60 text-xs hover:text-amber-400 transition-colors">
            ورود مدیریت ←
          </a>
        </div>
      </div>
    </div>
  );
}
