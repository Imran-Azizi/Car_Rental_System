'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContractBill, { BillData } from '@/components/ContractBill';
import { FileX, ArrowRight } from 'lucide-react';

export default function OrderPrintPage() {
  const router = useRouter();
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lastOrderBill');
      if (raw) {
        setBillData(JSON.parse(raw));
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Not loaded yet — avoid flash
  if (!loaded) return null;

  // No bill data
  if (!billData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 gap-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-amber-100">
          <FileX className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-800">بل یافت نشد</h2>
        <p className="text-amber-600 text-sm text-center max-w-xs">
          لطفاً ابتدا یک سفارش جدید ثبت کنید تا بل آن چاپ شود.
        </p>
        <button
          onClick={() => router.push('/orders/new')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-lg"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
        >
          <ArrowRight className="w-4 h-4" />
          سفارش جدید
        </button>
      </div>
    );
  }

  return (
    <ContractBill
      data={billData}
      onClose={() => router.push('/orders/new')}
    />
  );
}
