'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useApp } from '@/lib/context';
import { draftsAPI } from '@/lib/api';
import { FileEdit, Trash2, Plus, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatAfghanDate } from '@/lib/utils';

const STEP_LABELS: Record<number, { dari: string; pashto: string }> = {
  0: { dari: 'انتخاب موتر',   pashto: 'موتر غوره کول' },
  1: { dari: 'معلومات مشتری', pashto: 'د مشتري معلومات' },
  2: { dari: 'معلومات ضامن',  pashto: 'د ضامن معلومات' },
  3: { dari: 'محاسبه مالی',   pashto: 'مالي حساب' },
  4: { dari: 'اسناد و تأیید', pashto: 'اسناد او تایید' },
};

export default function DraftsPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    fetchDrafts();
  }, [token]);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const res = await draftsAPI.getAll();
      setDrafts(res.data.data || []);
    } catch { toast.error(t.error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await draftsAPI.delete(id);
      toast.success(lang === 'dari' ? 'پیش‌نویس حذف شد' : 'مسوده ړنګه شوه');
      fetchDrafts();
    } catch { toast.error(t.error); }
  };

  const stepLabel = (step: number) =>
    STEP_LABELS[step]?.[lang] || STEP_LABELS[0][lang];

  const stepPct = (step: number) => Math.round(((step + 1) / 5) * 100);

  const relativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return lang === 'dari' ? 'همین الان' : 'اوس مهال';
    if (mins < 60)  return lang === 'dari' ? `${mins} دقیقه پیش` : `${mins} دقیقه مخکې`;
    if (hours < 24) return lang === 'dari' ? `${hours} ساعت پیش` : `${hours} ساعت مخکې`;
    return lang === 'dari' ? `${days} روز پیش` : `${days} ورځ مخکې`;
  };

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-900">
              {lang === 'dari' ? 'پیش‌نویس‌های سفارش' : 'د سفارش مسودې'}
            </h2>
            <p className="text-sm text-amber-600 mt-0.5">
              {lang === 'dari'
                ? 'فرم‌های ذخیره‌شده ناتمام که می‌توانید ادامه دهید'
                : 'خوندي شوي نيمه بشپړ فورمونه چې کولی شئ دوام ورکړئ'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchDrafts} className="btn-secondary p-2.5 rounded-xl" title={lang === 'dari' ? 'بارگذاری مجدد' : 'بیا بارول'}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link href="/orders/new" className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />
              {lang === 'dari' ? 'سفارش جدید' : 'نوی سفارش'}
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-golden rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-amber-100 rounded w-1/3" />
                    <div className="h-3 bg-amber-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div className="card-golden rounded-2xl py-20 text-center">
            <FileEdit className="w-14 h-14 mx-auto text-amber-300 mb-4" />
            <p className="text-amber-700 font-semibold text-lg mb-2">
              {lang === 'dari' ? 'پیش‌نویسی وجود ندارد' : 'هیڅ مسوده نشته'}
            </p>
            <p className="text-amber-500 text-sm mb-6">
              {lang === 'dari'
                ? 'وقتی سفارش را نیمه‌کاره رها کنید، اینجا ذخیره می‌شود'
                : 'کله چې سفارش نیمه پریږدئ، دلته خوندي کیږي'}
            </p>
            <Link href="/orders/new"
              className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" />
              {lang === 'dari' ? 'شروع سفارش جدید' : 'نوی سفارش پیل کړئ'}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map(draft => {
              const pct = stepPct(draft.step);
              return (
                <div key={draft.id} className="card-golden rounded-2xl p-5 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow"
                      style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                      <FileEdit className="w-6 h-6 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-bold text-amber-900 truncate">
                          {draft.name || (lang === 'dari' ? 'پیش‌نویس بدون نام' : 'بې نامه مسوده')}
                        </p>
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {lang === 'dari' ? `مرحله ${draft.step + 1} از 5` : `مرحله ${draft.step + 1} له 5`}
                        </span>
                      </div>
                      <p className="text-amber-600 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lang === 'dari' ? 'آخرین ذخیره:' : 'وروستۍ ذخیره:'} {relativeTime(draft.updatedAt)}
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#059669)' }}
                          />
                        </div>
                        <span className="text-xs text-amber-500 shrink-0">{pct}%</span>
                      </div>
                      <p className="text-xs text-amber-500 mt-0.5">
                        {lang === 'dari' ? 'متوقف در:' : 'ودریدلی:'}
                        {' '}<span className="font-medium text-amber-700">{stepLabel(draft.step)}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/orders/new?draft=${draft.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white shadow transition-all hover:shadow-md active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        {lang === 'dari' ? 'ادامه' : 'دوام'}
                      </Link>
                      <button
                        onClick={() => setDeleteId(draft.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { handleDelete(deleteId!); setDeleteId(null); }}
        message={lang === 'dari' ? 'آیا از حذف این پیش‌نویس مطمئن هستید؟' : 'ایا د دې مسودې د ړنګولو ډاډه یاست؟'}
      />
    </MainLayout>
  );
}
