'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContractBill, { BillData } from '@/components/ContractBill';
import CustomerBill, { CustomerBillData } from '@/components/CustomerBill';
import { FileX, ArrowRight, Printer, User, ShieldCheck } from 'lucide-react';

type BillMode = 'choose' | 'admin' | 'customer';

export default function OrderPrintPage() {
  const router = useRouter();
  const [adminBill,    setAdminBill]    = useState<BillData | null>(null);
  const [customerBill, setCustomerBill] = useState<CustomerBillData | null>(null);
  const [mode,         setMode]         = useState<BillMode>('choose');
  const [loaded,       setLoaded]       = useState(false);

  useEffect(() => {
    try {
      const raw  = localStorage.getItem('lastOrderBill');
      const rawC = localStorage.getItem('lastCustomerBill');
      if (raw)  setAdminBill(JSON.parse(raw));
      if (rawC) setCustomerBill(JSON.parse(rawC));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  /* ── No data ── */
  if (!adminBill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 gap-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-amber-100">
          <FileX className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-800">بل یافت نشد</h2>
        <p className="text-amber-600 text-sm text-center max-w-xs">
          لطفاً ابتدا یک سفارش جدید ثبت کنید تا بل آن چاپ شود.
        </p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/orders/new')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <ArrowRight className="w-4 h-4" />
            سفارش جدید
          </button>
          <button onClick={() => router.push('/orders')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg border border-amber-300 text-amber-700">
            همه سفارش‌ها
          </button>
        </div>
      </div>
    );
  }

  /* ── Admin bill view ── */
  if (mode === 'admin') {
    return (
      <ContractBill
        data={adminBill}
        onClose={() => setMode('choose')}
        autoPrint={false}
      />
    );
  }

  /* ── Customer bill view ── */
  if (mode === 'customer' && customerBill) {
    return (
      <CustomerBill
        data={customerBill}
        onClose={() => setMode('choose')}
        autoPrint={false}
      />
    );
  }

  /* ── Choice screen ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8"
      style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)' }}
      dir="rtl">

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-2xl"
          style={{ background: '#fff', padding: '4px', border: '3px solid rgba(245,158,11,0.5)' }}>
          <img src="/logo.png" alt="افشار" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-white mt-4">سفارش موفقانه ثبت شد</h1>
        <p className="text-amber-300 text-sm">
          شماره سفارش:
          <span className="font-mono font-bold text-amber-400 mr-2">{adminBill.contractNumber}</span>
        </p>
        <p className="text-white/50 text-xs">کدام بل را می‌خواهید چاپ کنید؟</p>
      </div>

      {/* Bill choice cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">

        {/* Customer Bill */}
        <button
          onClick={() => setMode('customer')}
          disabled={!customerBill}
          className="group flex flex-col items-center gap-4 p-7 rounded-2xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed text-center"
          style={{ borderColor: '#3b82f6', background: 'rgba(59,130,246,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)' }}>
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base">بل مشتری</p>
            <p className="text-blue-300 text-xs mt-1">رسید ساده A5 برای مشتری</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>
            <Printer className="w-3.5 h-3.5" />
            چاپ بل مشتری
          </div>
        </button>

        {/* Admin / Contract Bill */}
        <button
          onClick={() => setMode('admin')}
          className="group flex flex-col items-center gap-4 p-7 rounded-2xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-2xl text-center"
          style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base">بل ادمین (قرارداد)</p>
            <p className="text-amber-300 text-xs mt-1">قرارداد رسمی کامل A4</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(245,158,11,0.20)', color: '#fbbf24' }}>
            <Printer className="w-3.5 h-3.5" />
            چاپ بل ادمین
          </div>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={() => router.push('/orders/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-400/40 text-amber-300 text-sm font-medium hover:bg-amber-500/10 transition-colors">
          سفارش جدید
        </button>
        <button onClick={() => router.push('/orders')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
          <ArrowRight className="w-4 h-4" />
          همه سفارش‌ها
        </button>
      </div>
    </div>
  );
}
