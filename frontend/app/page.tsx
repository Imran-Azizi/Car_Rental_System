'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Car, Lock, Mail, Globe } from 'lucide-react';

export default function LoginPage() {
  const { t, setLang, lang, setToken, setUser } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      setToken(res.data.data.token);
      setUser(res.data.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      toast.success(t.loginTitle);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background: 'linear-gradient(135deg, #1a1400 0%, #3d2c00 50%, #1a1400 100%)'}}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 25% 25%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 75% 75%, #d97706 0%, transparent 50%)'}}></div>
      
      {/* Floating gold circles */}
      <div className="absolute top-20 right-20 w-64 h-64 rounded-full opacity-5" style={{background: 'radial-gradient(circle, #f59e0b, transparent)'}}></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-5" style={{background: 'radial-gradient(circle, #d97706, transparent)'}}></div>

      <div className="relative z-10 w-full max-w-md mx-4 fade-in">
        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-6">
          <button onClick={() => setLang('dari')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${lang === 'dari' ? 'bg-amber-500 text-white' : 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50'}`}>دری</button>
          <button onClick={() => setLang('pashto')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${lang === 'pashto' ? 'bg-amber-500 text-white' : 'bg-amber-900/50 text-amber-300 hover:bg-amber-800/50'}`}>پښتو</button>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{background: 'linear-gradient(135deg, #fffdf0, #fef9c3)', border: '2px solid #f59e0b'}}>
          {/* Header */}
          <div className="p-8 text-center" style={{background: 'linear-gradient(135deg, #92400e, #b45309)'}}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
                <Car className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{t.appName}</h1>
            <p className="text-amber-200 text-sm">{t.loginSubtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1.5">{t.email}</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full pr-10 pl-4 py-3 rounded-lg input-golden text-sm"
                  placeholder="admin@afshar.af" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-amber-800 mb-1.5">{t.password}</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full pr-10 pl-4 py-3 rounded-lg input-golden text-sm"
                  placeholder="••••••••" required />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg btn-primary font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t.loading : t.login}
            </button>
          </form>
        </div>
        <p className="text-center text-amber-400/60 text-xs mt-4">© ۱۴۰۳ مرکز کرایه موتر افشار</p>
      </div>
    </div>
  );
}
