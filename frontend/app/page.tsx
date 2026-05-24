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
        // Car owner login — store separately from admin session
        localStorage.setItem('ownerToken', token);
        localStorage.setItem('ownerUser', JSON.stringify(user));
        router.push('/owner/dashboard');
      } else {
        // Admin / Staff login
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a1400 0%, #3d2c00 50%, #1a1400 100%)' }} dir="rtl">

      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 75% 75%, #d97706 0%, transparent 50%)' }} />
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
      <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #d97706, transparent)' }} />

      <div className="relative z-10 w-full max-w-md mx-4 fade-in">
        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setLang('dari')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${lang === 'dari' ? 'bg-amber-500 text-white' : 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50'}`}>
            دری
          </button>
          <button onClick={() => setLang('pashto')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${lang === 'pashto' ? 'bg-amber-500 text-white' : 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50'}`}>
            پښتو
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #fffdf0, #fef9c3)', border: '2px solid #f59e0b' }}>

          {/* Header */}
          <div className="p-8 text-center" style={{ background: 'linear-gradient(135deg, #92400e, #b45309)' }}>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center"
                style={{ background: '#fff', padding: '6px', border: '3px solid rgba(245,158,11,0.5)' }}>
                <Image
                  src="/logo.png"
                  alt="مرکز کرایه موتر افشار"
                  width={84}
                  height={84}
                  className="object-contain w-full h-full"
                  priority
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.appName}</h1>
            <p className="text-amber-200 text-sm">{t.loginSubtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-red-200 bg-red-50">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1.5">{t.email}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-lg input-golden text-sm"
                  placeholder="example@email.com"
                  dir="ltr"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1.5">{t.password}</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  className="w-full pr-10 pl-10 py-3 rounded-lg input-golden text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg btn-primary font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {t.loading}
                </span>
              ) : t.login}
            </button>
          </form>
        </div>

        <p className="text-center text-amber-400/60 text-xs mt-4">© ۱۴۰۳ مرکز کرایه موتر افشار</p>
      </div>
    </div>
  );
}
