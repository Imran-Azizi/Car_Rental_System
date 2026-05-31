'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useApp } from '@/lib/context';
import { authAPI } from '@/lib/api';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { t, setLang, lang, setToken, setUser } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('ایمیل و رمز عبور الزامی است');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const { token, role, user } = res.data.data;

      if (role === 'owner') {
        localStorage.setItem('ownerToken', token);
        localStorage.setItem('ownerUser', JSON.stringify(user));
        router.push('/owner/dashboard');
      } else {
        setToken(token);
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'ایمیل یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: 'email' | 'password', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#f5f5f5' }} dir="rtl">

      <div className="w-full max-w-md mx-4 fade-in">
        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setLang('dari')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${lang === 'dari' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            دری
          </button>
          <button onClick={() => setLang('pashto')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${lang === 'pashto' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            پښتو
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-8 text-center">
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
            <h1 className="text-xl font-bold text-gray-900">{t.appName}</h1>
            <p className="text-gray-500 text-sm mt-1">{t.loginSubtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.email}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  placeholder="example@email.com"
                  dir="ltr"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  className="w-full pr-10 pl-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t.loading}
                </span>
              ) : t.login}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">© ۱۴۰۳ مرکز کرایه موتر افشار</p>
      </div>
    </div>
  );
}