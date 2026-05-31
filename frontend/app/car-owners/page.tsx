'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useApp } from '@/lib/context';
import { carOwnersAPI } from '@/lib/api';
import { Plus, Search, Edit, Trash2, UserCheck, Camera, X, Car, Eye, EyeOff, KeyRound, Mail, Banknote, History, Printer, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { resolveImgUrl } from '@/lib/imageUrl';
import { formatAfghanDate, formatNumber, numericInputHandler } from '@/lib/utils';
import { OWNER_PAYMENT_METHODS, openCarOwnerPaymentReceipt } from '@/lib/carOwnerReceipt';

const emptyForm = { fullName: '', fatherName: '', tazkiraNumber: '', phoneNumber: '', address: '', email: '', password: '' };
const todayISO = () => new Date().toISOString().split('T')[0];
const emptyPaymentForm = { amount: '', paymentDate: todayISO(), paymentMethod: 'cash', notes: '', receiptNumber: '' };

export default function CarOwnersPage() {
  const { t, token, lang, user } = useApp();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editOwner, setEditOwner] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payOwner, setPayOwner] = useState<any>(null);
  const [editPayment, setEditPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyOwner, setHistoryOwner] = useState<any>(null);
  const [historyPayments, setHistoryPayments] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => { if (!token) router.push('/'); else fetchOwners(); }, [token]);
  useEffect(() => { if (token) fetchOwners(); }, [search]);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const res = await carOwnersAPI.getAll({ search });
      setOwners(res.data.data);
    } catch { toast.error(t.error); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditOwner(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrors({});
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (owner: any) => {
    setEditOwner(owner);
    setForm({ fullName: owner.fullName, fatherName: owner.fatherName, tazkiraNumber: owner.tazkiraNumber || '', phoneNumber: owner.phoneNumber, address: owner.address || '', email: owner.email || '', password: '' });
    setPhotoFile(null);
    setPhotoPreview(owner.photo ? resolveImgUrl(owner.photo)! : null);
    setErrors({});
    setShowPassword(false);
    setModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('حجم عکس نباید از ۵ مگابایت بیشتر باشد'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'اسم الزامی است';
    if (!form.fatherName.trim()) errs.fatherName = 'ولد الزامی است';
    if (!form.phoneNumber.trim()) errs.phoneNumber = 'شماره تماس الزامی است';
    if (form.email.trim() && !emailRegex.test(form.email.trim())) errs.email = 'فرمت ایمیل صحیح نیست';
    if (form.password && form.password.length < 6) errs.password = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName.trim());
      fd.append('fatherName', form.fatherName.trim());
      fd.append('tazkiraNumber', form.tazkiraNumber.trim());
      fd.append('phoneNumber', form.phoneNumber.trim());
      fd.append('address', form.address.trim());
      if (form.email.trim()) fd.append('email', form.email.trim());
      if (form.password.trim()) fd.append('password', form.password.trim());
      if (photoFile) fd.append('photo', photoFile);

      if (editOwner) await carOwnersAPI.update(editOwner.id, fd);
      else await carOwnersAPI.create(fd);

      toast.success(t.carOwnerSaved);
      setModalOpen(false);
      fetchOwners();
    } catch (err: any) { toast.error(err.response?.data?.message || t.error); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await carOwnersAPI.delete(id); toast.success('صاحب موتر حذف شد'); fetchOwners(); }
    catch (err: any) { toast.error(err.response?.data?.message || t.error); }
  };

  const openPaymentModal = async (owner: any, payment?: any) => {
    setPayOwner(owner);
    setEditPayment(payment || null);
    setPaymentErrors({});
    setPaymentForm({
      amount: payment ? String(payment.amount) : '',
      paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : todayISO(),
      paymentMethod: payment?.paymentMethod || 'cash',
      notes: payment?.notes || '',
      receiptNumber: payment?.receiptNumber || '...',
    });
    setPayModalOpen(true);

    if (!payment) {
      try {
        const res = await carOwnersAPI.getNextReceiptNumber();
        setPaymentForm(prev => ({ ...prev, receiptNumber: res.data.data.receiptNumber }));
      } catch {
        setPaymentForm(prev => ({ ...prev, receiptNumber: 'خودکار' }));
      }
    }
  };

  const validatePayment = () => {
    const errs: Record<string, string> = {};
    const amount = parseFloat(paymentForm.amount);
    if (!paymentForm.amount) errs.amount = 'مبلغ پرداخت الزامی است';
    else if (Number.isNaN(amount) || amount <= 0) errs.amount = 'مبلغ پرداخت باید مثبت باشد';
    if (!paymentForm.paymentDate) errs.paymentDate = 'تاریخ پرداخت الزامی است';
    setPaymentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePayment = async () => {
    if (!payOwner || !validatePayment()) return;
    setPaymentSaving(true);
    try {
      const payload = {
        ownerId: payOwner.id,
        amount: paymentForm.amount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes.trim() || undefined,
      };
      const res = editPayment
        ? await carOwnersAPI.updatePayment(editPayment.id, payload)
        : await carOwnersAPI.createPayment(payload);
      const payment = res.data.data;
      toast.success(editPayment ? 'رسید پول بروزرسانی شد' : 'رسید پول ثبت شد');
      setPayModalOpen(false);
      fetchOwners();
      if (historyOwner) fetchPaymentHistory(historyOwner, historySearch);
      openCarOwnerPaymentReceipt(payment, 'view');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setPaymentSaving(false);
    }
  };

  const fetchPaymentHistory = async (owner: any, searchValue = historySearch) => {
    setHistoryOwner(owner);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const res = await carOwnersAPI.getPayments({ ownerId: owner.id, search: searchValue || undefined, limit: 100 });
      setHistoryPayments(res.data.data.payments);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      await carOwnersAPI.deletePayment(id);
      toast.success('رسید پرداخت حذف شد');
      if (historyOwner) fetchPaymentHistory(historyOwner, historySearch);
      fetchOwners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-3 py-2 rounded-lg input-golden text-sm ${errors[field] ? 'border-red-400 bg-red-50' : ''}`;
  const labelCls = "block text-sm font-medium text-amber-800 mb-1";

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-900">{t.carOwners}</h2>
              <p className="text-sm text-amber-600">{owners.length} صاحب موتر</p>
            </div>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />{t.addCarOwner}
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pr-10 py-2 px-3 rounded-lg input-golden text-sm"
          />
        </div>

        {/* Owners Table */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-golden min-w-[760px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-right text-sm">#</th>
                  <th className="px-4 py-3 text-right text-sm">{t.photo}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.fullName}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.fatherName}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.tazkiraNumber}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.phone}</th>
                  <th className="px-4 py-3 text-right text-sm">ایمیل</th>
                  <th className="px-4 py-3 text-right text-sm">{t.address}</th>
                  <th className="px-4 py-3 text-right text-sm">{t.carCount}</th>
                  <th className="px-4 py-3 text-right text-sm">پول داده شده</th>
                  <th className="px-4 py-3 text-right text-sm">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="px-4 py-12 text-center text-amber-500">{t.loading}</td></tr>
                ) : owners.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-12 text-center text-amber-500">{t.noData}</td></tr>
                ) : owners.map((owner, i) => (
                  <tr key={owner.id} className="border-b border-amber-100 hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-amber-600">{i + 1}</td>
                    <td className="px-4 py-3">
                      {owner.photo ? (
                        <img src={resolveImgUrl(owner.photo)!} alt={owner.fullName} className="w-10 h-10 rounded-full object-cover border-2 border-amber-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                          <UserCheck className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-amber-900">{owner.fullName}</td>
                    <td className="px-4 py-3 text-sm text-amber-700">{owner.fatherName}</td>
                    <td className="px-4 py-3 text-sm text-amber-700">{owner.tazkiraNumber || '—'}</td>
                    <td className="px-4 py-3 text-sm text-amber-700" dir="ltr">{owner.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm text-amber-700 max-w-[160px] truncate" dir="ltr">
                      {owner.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-amber-400 shrink-0" />{owner.email}
                        </span>
                      ) : <span className="text-amber-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-700 max-w-[160px] truncate">{owner.address || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                        <Car className="w-3 h-3" />{owner._count?.cars || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-700" dir="ltr">{formatNumber(owner.totalPaid || 0)} ؋</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openPaymentModal(owner)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="رسید پول"><Banknote className="w-4 h-4" /></button>
                        <button onClick={() => fetchPaymentHistory(owner)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="تاریخچه پرداخت"><History className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(owner)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors" title={t.edit}><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(owner.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title={t.delete}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editOwner ? t.editCarOwner : t.addCarOwner} size="lg">
        <div className="space-y-5">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {photoPreview ? (
                <img src={photoPreview} alt="preview" className="w-24 h-24 rounded-full object-cover border-4 border-amber-200 shadow" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-dashed border-amber-300" style={{ background: 'linear-gradient(135deg,#fef9c3,#fef3c7)' }}>
                  <Camera className="w-8 h-8 text-amber-400" />
                </div>
              )}
              {photoPreview && (
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(resolveImgUrl(editOwner?.photo)); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-sm hover:bg-amber-50 transition-colors">
              <Camera className="w-4 h-4" />
              {photoPreview ? t.changePhoto : t.uploadPhoto}
            </button>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>اسم *</label>
              <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputCls('fullName')} placeholder="نام کامل صاحب موتر" />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className={labelCls}>ولد *</label>
              <input value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} className={inputCls('fatherName')} placeholder="نام پدر" />
              {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
            </div>
            <div>
              <label className={labelCls}>نمبر تذکره</label>
              <input value={form.tazkiraNumber} onChange={e => setForm({ ...form, tazkiraNumber: e.target.value })} className={inputCls('tazkiraNumber')} placeholder="شماره تذکره ملی" />
            </div>
            <div>
              <label className={labelCls}>شماره تماس *</label>
              <input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} className={inputCls('phoneNumber')} placeholder="07X-XXXXXXX" dir="ltr" />
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>آدرس</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className={`${inputCls('address')} resize-none`} placeholder="آدرس کامل..." />
            </div>
            {/* Email field — above password */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />ایمیل (اختیاری)</span>
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={`${inputCls('email')} pl-4`}
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              <p className="text-amber-600 text-xs mt-1">ایمیل منحصر به فرد — صاحب موتر با این ایمیل وارد پنل می‌شود</p>
            </div>

            {/* Password field */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" />{editOwner ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور (اختیاری)'}</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`${inputCls('password')} pl-10`}
                  placeholder={editOwner ? 'برای تغییر رمز، رمز جدید وارد کنید' : 'رمز عبور برای ورود به پنل'}
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 hover:text-amber-700">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              <p className="text-amber-600 text-xs mt-1">حداقل ۶ کاراکتر — همراه با ایمیل برای ورود به پنل استفاده می‌شود</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={() => setModalOpen(false)} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">{t.cancel}</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">
            {saving ? t.loading : t.save}
          </button>
        </div>
      </Modal>

      {/* Car owner payment modal */}
      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title={editPayment ? 'ویرایش رسید پول' : 'رسید پول'} size="lg">
        {payOwner && (
          <div className="mb-4 p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                {payOwner.fullName?.[0] || 'ص'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-emerald-900">{payOwner.fullName}</p>
                <p className="text-xs text-emerald-700">{payOwner.fatherName} - {payOwner.phoneNumber}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-emerald-600">مجموع پرداخت قبلی</p>
                <p className="font-bold text-emerald-900" dir="ltr">{formatNumber(payOwner.totalPaid || 0)} ؋</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>نام صاحب موتر</label>
            <input value={payOwner?.fullName || ''} readOnly className="w-full px-3 py-2.5 rounded-xl input-golden text-sm opacity-70 cursor-not-allowed" />
          </div>
          <div>
            <label className={labelCls}>شماره رسید</label>
            <input value={paymentForm.receiptNumber} readOnly dir="ltr" className="w-full px-3 py-2.5 rounded-xl input-golden text-sm opacity-70 cursor-not-allowed" />
          </div>
          <div>
            <label className={labelCls}>مبلغ پرداخت ({t.currency}) *</label>
            <input value={paymentForm.amount} onChange={numericInputHandler(v => setPaymentForm({ ...paymentForm, amount: v }))} className={`w-full px-3 py-2.5 rounded-xl input-golden text-sm ${paymentErrors.amount ? 'border-red-400 bg-red-50' : ''}`} placeholder="0" dir="ltr" inputMode="decimal" />
            {paymentErrors.amount && <p className="text-red-500 text-xs mt-1">{paymentErrors.amount}</p>}
          </div>
          <div>
            <label className={labelCls}>تاریخ پرداخت *</label>
            <input type="date" value={paymentForm.paymentDate} max={todayISO()} onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} className={`w-full px-3 py-2.5 rounded-xl input-golden text-sm ${paymentErrors.paymentDate ? 'border-red-400 bg-red-50' : ''}`} />
            {paymentErrors.paymentDate && <p className="text-red-500 text-xs mt-1">{paymentErrors.paymentDate}</p>}
          </div>
          <div>
            <label className={labelCls}>روش پرداخت</label>
            <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} className="w-full px-3 py-2.5 rounded-xl input-golden text-sm">
              {Object.entries(OWNER_PAYMENT_METHODS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>ثبت توسط</label>
            <input value={(user as any)?.name || (user as any)?.email || 'مدیر سیستم'} readOnly className="w-full px-3 py-2.5 rounded-xl input-golden text-sm opacity-70 cursor-not-allowed" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>یادداشت / توضیحات</label>
            <textarea value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl input-golden text-sm resize-none" placeholder="توضیحات پرداخت..." />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={() => setPayModalOpen(false)} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">{t.cancel}</button>
          <button onClick={handleSavePayment} disabled={paymentSaving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {paymentSaving ? t.loading : <><Banknote className="w-4 h-4" />ثبت رسید پول</>}
          </button>
        </div>
      </Modal>

      {/* Payment history modal */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`تاریخچه رسید پول - ${historyOwner?.fullName || ''}`} size="xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-bold text-amber-900">{historyOwner?.fullName}</p>
            <p className="text-xs text-amber-600">مجموع: {formatNumber(historyPayments.reduce((s, p) => s + p.amount, 0))} ؋</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
              <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="جستجو..." className="pr-9 pl-3 py-2 rounded-xl input-golden text-sm w-full sm:w-56" />
            </div>
            <button onClick={() => historyOwner && fetchPaymentHistory(historyOwner, historySearch)} className="btn-secondary px-3 rounded-xl text-sm">جستجو</button>
            {historyOwner && <button onClick={() => openPaymentModal(historyOwner)} className="btn-primary px-3 rounded-xl text-sm flex items-center gap-1"><Banknote className="w-4 h-4" />جدید</button>}
          </div>
        </div>

        {historyLoading ? (
          <div className="py-12 text-center text-amber-500">{t.loading}</div>
        ) : historyPayments.length === 0 ? (
          <div className="py-12 text-center text-amber-400"><FileText className="w-12 h-12 mx-auto mb-2 text-amber-200" />{t.noData}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-amber-200">
            <table className="w-full table-golden min-w-[760px]">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-right text-xs">شماره رسید</th>
                  <th className="px-3 py-2.5 text-right text-xs">تاریخ پرداخت</th>
                  <th className="px-3 py-2.5 text-right text-xs">مبلغ پرداخت</th>
                  <th className="px-3 py-2.5 text-right text-xs">روش پرداخت</th>
                  <th className="px-3 py-2.5 text-right text-xs">یادداشت</th>
                  <th className="px-3 py-2.5 text-right text-xs">ثبت توسط</th>
                  <th className="px-3 py-2.5 text-right text-xs">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {historyPayments.map(pay => (
                  <tr key={pay.id} className="border-b border-amber-100">
                    <td className="px-3 py-2.5 text-xs font-mono text-amber-800" dir="ltr">{pay.receiptNumber}</td>
                    <td className="px-3 py-2.5 text-xs">{formatAfghanDate(pay.paymentDate)}</td>
                    <td className="px-3 py-2.5 text-xs font-bold text-emerald-700" dir="ltr">{formatNumber(pay.amount)} ؋</td>
                    <td className="px-3 py-2.5 text-xs">{OWNER_PAYMENT_METHODS[pay.paymentMethod || ''] || pay.paymentMethod || '-'}</td>
                    <td className="px-3 py-2.5 text-xs max-w-[150px] truncate">{pay.notes || '-'}</td>
                    <td className="px-3 py-2.5 text-xs">{pay.createdBy}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openCarOwnerPaymentReceipt(pay, 'view')} className="p-1 rounded-lg text-blue-600 hover:bg-blue-50" title="مشاهده رسید"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openCarOwnerPaymentReceipt(pay, 'print')} className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50" title="چاپ رسید"><Printer className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openCarOwnerPaymentReceipt(pay, 'pdf')} className="p-1 rounded-lg text-cyan-600 hover:bg-cyan-50" title="دانلود PDF"><Download className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openPaymentModal(historyOwner, pay)} className="p-1 rounded-lg text-amber-600 hover:bg-amber-50" title={t.edit}><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeletePaymentId(pay.id)} className="p-1 rounded-lg text-red-500 hover:bg-red-50" title={t.delete}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId!)}
        message="آیا از حذف این صاحب موتر مطمئن هستید؟ این عملیات قابل بازگشت نیست."
      />

      <ConfirmDialog
        open={!!deletePaymentId}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={() => handleDeletePayment(deletePaymentId!)}
        message="آیا از حذف این رسید پرداخت مطمئن هستید؟"
      />
    </MainLayout>
  );
}
