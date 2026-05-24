'use client';
import { useCallback, useEffect, useState } from 'react';
import { ownerPortalAPI } from '@/lib/api';
import { formatAfghanDate, formatNumber } from '@/lib/utils';
import { Bell, BellOff, Check, CheckCheck, TrendingDown, Car, Wallet, CalendarClock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface OwnerNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  carId?: string | null;
  amount?: number | null;
  createdAt: string;
}

interface Pagination {
  total: number; page: number; limit: number; totalPages: number;
}

export default function OwnerNotificationsPage() {
  const [notifications, setNotifications] = useState<OwnerNotification[]>([]);
  const [pagination, setPagination]       = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(1);
  const [markingAll, setMarkingAll]       = useState(false);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await ownerPortalAPI.getNotifications({ page: p, limit: 20 });
      setNotifications(res.data.data.notifications);
      setPagination(res.data.data.pagination);
      setUnreadCount(res.data.data.unreadCount ?? 0);
    } catch {
      toast.error('خطا در بارگذاری اعلان‌ها');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(page); }, [page]);

  const handleMarkRead = async (id: string) => {
    try {
      await ownerPortalAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { toast.error('خطا'); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await ownerPortalAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('همه اعلان‌ها خوانده شدند');
    } catch { toast.error('خطا'); }
    finally { setMarkingAll(false); }
  };

  const typeIcon = (type: string) => {
    if (type === 'EXPENSE') return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (type === 'BOOKING') return <CalendarClock className="w-4 h-4 text-blue-500" />;
    if (type === 'RETURN')  return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (type === 'CAR')     return <Car className="w-4 h-4 text-blue-500" />;
    return <Bell className="w-4 h-4 text-amber-500" />;
  };

  const typeLabel = (type: string) => {
    if (type === 'EXPENSE') return { text: 'کسر مصرف',    cls: 'bg-red-100 text-red-700' };
    if (type === 'BOOKING') return { text: 'کرایه موتر',   cls: 'bg-blue-100 text-blue-700' };
    if (type === 'RETURN')  return { text: 'برگشت موتر',   cls: 'bg-emerald-100 text-emerald-700' };
    return { text: 'اطلاعیه', cls: 'bg-amber-100 text-amber-700' };
  };

  const typeBg = (type: string, isRead: boolean) => {
    if (isRead) return 'border-amber-100 bg-white';
    if (type === 'BOOKING') return 'border-blue-200 bg-blue-50/40 shadow-sm';
    if (type === 'RETURN')  return 'border-emerald-200 bg-emerald-50/40 shadow-sm';
    return 'border-amber-300 bg-amber-50/60 shadow-sm';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm relative"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
            <Bell className="w-5 h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-900">اعلان‌های من</h2>
            <p className="text-sm text-amber-600">
              {unreadCount > 0 ? `${unreadCount} اعلان خوانده‌نشده` : 'همه اعلان‌ها خوانده شده'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50">
            <CheckCheck className="w-4 h-4" />
            {markingAll ? 'در حال پردازش...' : 'خواندن همه'}
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse bg-amber-50 border border-amber-100" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/30">
            <BellOff className="w-12 h-12 text-amber-200 mb-3" />
            <p className="text-amber-400 font-medium">هیچ اعلانی وجود ندارد</p>
            <p className="text-amber-300 text-sm mt-1">اعلان‌های کرایه، برگشت موتر و مصارف اینجا نمایش داده می‌شود</p>
          </div>
        ) : (
          notifications.map(n => {
            const label = typeLabel(n.type);
            return (
              <div
                key={n.id}
                className={`rounded-2xl border-2 p-4 transition-all ${typeBg(n.type, n.isRead)}`}>
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.isRead ? 'bg-gray-100'
                      : n.type === 'BOOKING' ? 'bg-blue-100'
                      : n.type === 'RETURN'  ? 'bg-emerald-100'
                      : 'bg-amber-100'
                  }`}>
                    {typeIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${label.cls}`}>{label.text}</span>
                      <h4 className={`text-sm font-bold ${
                        n.isRead ? 'text-gray-700'
                          : n.type === 'BOOKING' ? 'text-blue-900'
                          : n.type === 'RETURN'  ? 'text-emerald-900'
                          : 'text-amber-900'
                      }`}>{n.title}</h4>
                      {!n.isRead && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          n.type === 'BOOKING' ? 'bg-blue-500'
                            : n.type === 'RETURN' ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`} />
                      )}
                    </div>

                    {/* Amount badge — contextual wording per type */}
                    {n.amount != null && n.amount > 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wallet className={`w-3.5 h-3.5 ${n.type === 'RETURN' ? 'text-emerald-600' : 'text-red-500'}`} />
                        <span className={`text-sm font-black ${n.type === 'RETURN' ? 'text-emerald-700' : 'text-red-600'}`} dir="ltr">
                          {formatNumber(n.amount)} افغانی
                        </span>
                        <span className={`text-xs ${n.type === 'RETURN' ? 'text-emerald-500' : 'text-red-400'}`}>
                          {n.type === 'RETURN' ? 'سهم شما از قرارداد' : 'از حساب شما کسر شد'}
                        </span>
                      </div>
                    )}

                    {/* Message — display each line separately */}
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {n.message.split('\n').filter(Boolean).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>

                    <p className="text-xs text-amber-400 mt-2">{formatAfghanDate(n.createdAt)}</p>
                  </div>

                  {/* Mark read */}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 p-1.5 rounded-lg text-amber-500 hover:bg-amber-100 transition-colors"
                      title="علامت‌گذاری به‌عنوان خوانده‌شده">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-amber-200 text-amber-600 text-sm hover:bg-amber-50 disabled:opacity-40 transition-colors">
            قبلی
          </button>
          <span className="text-sm text-amber-700 font-medium px-3">{page} / {pagination.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-xl border border-amber-200 text-amber-600 text-sm hover:bg-amber-50 disabled:opacity-40 transition-colors">
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
