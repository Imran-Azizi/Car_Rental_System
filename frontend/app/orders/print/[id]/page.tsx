'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ContractBill, { BillData } from '@/components/ContractBill';
import CustomerBill, { CustomerBillData } from '@/components/CustomerBill';
import { ordersAPI } from '@/lib/api';
import { Printer, User, ShieldCheck, ArrowRight, FileX, Loader2 } from 'lucide-react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');

type Mode = 'choose' | 'admin' | 'customer';

export default function OrderPrintByIdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [adminBill,    setAdminBill]    = useState<BillData | null>(null);
  const [customerBill, setCustomerBill] = useState<CustomerBillData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [mode,         setMode]         = useState<Mode>('choose');

  useEffect(() => {
    if (!id) return;
    ordersAPI.getById(id)
      .then(res => {
        const c = res.data.data;

        /* ── Admin / Contract Bill ── */
        const admin: BillData = {
          contractNumber:          c.contractNumber,
          carName:                 c.car?.carName          || '',
          model:                   c.car?.model            || '',
          color:                   c.car?.color            || '',
          plateNumber:             c.car?.plateNumber      || '',
          dailyRate:               c.rentPrice             || 0,
          totalRent:               c.totalRent,
          advancePayment:          c.advancePayment,
          remainingAmount:         c.remainingAmount,
          startDate:               c.startDate,
          startTime:               c.startTime,
          endDate:                 c.endDate,
          endTime:                 c.endTime,
          customerFullName:        c.customer?.fullName    || '',
          customerFatherName:      c.customer?.fatherName  || '',
          customerDistrict:        c.customer?.district,
          customerVillage:         c.customer?.village,
          customerProvince:        c.customer?.province,
          customerCurrentAddress:  c.customer?.currentAddress,
          customerTazkira:         c.customer?.tazkiraNumber,
          customerPhone:           c.customer?.phoneNumber,
          customerPhoto:           c.customer?.photo
                                     ? `${API_BASE}${c.customer.photo}`
                                     : undefined,
          guarantorFullName:       c.guarantor?.fullName,
          guarantorFatherName:     c.guarantor?.fatherName,
          guarantorDistrict:       c.guarantor?.district,
          guarantorVillage:        c.guarantor?.village,
          guarantorProvince:       c.guarantor?.province,
          guarantorCurrentAddress: c.guarantor?.currentAddress,
          guarantorTazkira:        c.guarantor?.tazkiraNumber,
          guarantorPhone:          c.guarantor?.phoneNumber,
          driverName:              c.driverName,
          driverLicense:           c.driverLicense,
          driverPhone:             c.driverPhone,
          notes:                   c.notes,
        };
        setAdminBill(admin);

        /* ── Customer Bill ── */
        const rentalDays = Math.max(
          1,
          Math.ceil(
            (new Date(c.endDate).getTime() - new Date(c.startDate).getTime()) / 86_400_000,
          ),
        );
        const cust: CustomerBillData = {
          billNumber:     c.contractNumber,
          startDate:      c.startDate,
          endDate:        c.endDate,
          startTime:      c.startTime,
          endTime:        c.endTime,
          carType:        [c.car?.carName, c.car?.model].filter(Boolean).join(' — '),
          plateNumber:    c.car?.plateNumber,
          customerName:   c.customer?.fullName  || '',
          customerPhone:  c.customer?.phoneNumber,
          guarantorName:  c.guarantor?.fullName,
          guarantorPhone: c.guarantor?.phoneNumber,
          driverName:     c.driverName,
          driverPhone:    c.driverPhone,
          notes:          c.notes,
          rentalDays,
          dailyRate:      c.rentPrice      || 0,
          totalRent:      c.totalRent,
          received:       c.advancePayment,
          remaining:      c.remainingAmount,
        };
        setCustomerBill(cust);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
        <p className="text-amber-300 font-medium">در حال بارگذاری بل...</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error || !adminBill) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 gap-6">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
        <FileX className="w-10 h-10 text-amber-400" />
      </div>
      <h2 className="text-xl font-bold text-amber-800">سفارش یافت نشد</h2>
      <div className="flex gap-3">
        <button onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-amber-300 text-amber-700 font-semibold hover:bg-amber-50 transition-colors">
          بازگشت
        </button>
        <button onClick={() => router.push('/orders')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
          <ArrowRight className="w-4 h-4" />
          همه سفارش‌ها
        </button>
      </div>
    </div>
  );

  /* ── Admin bill ── */
  if (mode === 'admin') return (
    <ContractBill data={adminBill} onClose={() => setMode('choose')} autoPrint={false} />
  );

  /* ── Customer bill ── */
  if (mode === 'customer' && customerBill) return (
    <CustomerBill data={customerBill} onClose={() => setMode('choose')} autoPrint={false} />
  );

  /* ── Choice screen ── */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-8" dir="rtl"
      style={{ background: 'linear-gradient(135deg,#111827 0%,#1e2d45 55%,#0f3460 100%)' }}>

      {/* Logo + contract number */}
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-2xl"
          style={{ background: '#fff', padding: '4px', border: '3px solid rgba(245,158,11,0.5)' }}>
          <img src="/logo.png" alt="افشار" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-white/60 text-xs uppercase tracking-wider mb-1">شماره سفارش</p>
          <p className="text-2xl font-black text-amber-400 font-mono">{adminBill.contractNumber}</p>
        </div>
        <p className="text-white/50 text-sm">کدام بل را می‌خواهید چاپ کنید؟</p>
      </div>

      {/* Choice cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-md">

        {/* Customer Bill */}
        <button onClick={() => setMode('customer')} disabled={!customerBill}
          className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-2xl disabled:opacity-40 text-center"
          style={{ borderColor: '#3b82f6', background: 'rgba(59,130,246,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
            style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)' }}>
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">بل مشتری</p>
            <p className="text-blue-300 text-xs mt-1">رسید ساده A5</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(59,130,246,0.18)', color: '#93c5fd' }}>
            <Printer className="w-3.5 h-3.5" />چاپ بل مشتری
          </span>
        </button>

        {/* Admin / Contract Bill */}
        <button onClick={() => setMode('admin')}
          className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-2xl text-center"
          style={{ borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">بل ادمین (قرارداد)</p>
            <p className="text-amber-300 text-xs mt-1">قرارداد رسمی A4</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.18)', color: '#fbbf24' }}>
            <Printer className="w-3.5 h-3.5" />چاپ قرارداد
          </span>
        </button>
      </div>

      {/* Back navigation */}
      <button onClick={() => router.push('/orders')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-400/30 text-amber-300 text-sm font-medium hover:bg-amber-500/10 transition-colors">
        <ArrowRight className="w-4 h-4" />
        بازگشت به همه سفارش‌ها
      </button>
    </div>
  );
}
