'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/lib/context';
import { carsAPI, customersAPI, guarantorsAPI, ordersAPI, draftsAPI } from '@/lib/api';
import { parseNum, numericInputHandler, formatNumber } from '@/lib/utils';
import {
  Car, User, Shield, Receipt, FileImage, Pencil,
  Check, ChevronLeft, ChevronRight,
  Search, X, AlertCircle, CheckCircle2, Camera, Upload, UserCheck, Printer,
} from 'lucide-react';
import ContractBill, { BillData } from '@/components/ContractBill';
import CustomerBill, { CustomerBillData } from '@/components/CustomerBill';
import toast from 'react-hot-toast';

/* ─── types ─── */
interface CarItem {
  id: string; carName: string; model: string; color: string;
  plateNumber: string; dailyRate: number; status: string;
}
interface FormErrors { [k: string]: string }

/* ─── initial state ─── */
const initCustomer = {
  fullName: '', fatherName: '', tazkiraNumber: '', phoneNumber: '',
  altPhone: '', province: '', district: '', village: '',
  currentAddress: '', occupation: '', notes: '',
  startDate: '', startTime: '', endDate: '', endTime: '',
};

const initGuarantor = {
  fullName: '', fatherName: '', tazkiraNumber: '', phoneNumber: '',
  province: '', district: '', currentAddress: '',
  relationship: '', notes: '',
};

/* ─── style helpers ─── */
const inp  = 'w-full px-3 py-2.5 rounded-lg border-2 border-amber-200 bg-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';
const eInp = 'w-full px-3 py-2.5 rounded-lg border-2 border-red-400 bg-red-50 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all';
const lbl  = 'block text-xs font-semibold text-amber-800 mb-1';

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  AVAILABLE:   { text: 'موجود',       cls: 'bg-green-100 text-green-700 border-green-300' },
  RENTED:      { text: 'کرایه شده',   cls: 'bg-red-100 text-red-600 border-red-300' },
  MAINTENANCE: { text: 'تعمیر',       cls: 'bg-orange-100 text-orange-600 border-orange-300' },
};

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </p>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
      <FieldErr msg={error} />
    </div>
  );
}

/* ─── Single document upload slot ─── */
interface DocSlotProps {
  label: string;
  sublabel?: string;
  preview: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
  accept?: string;
  color?: string;
}
function DocSlot({ label, sublabel, preview, onFile, onClear, color = '#f59e0b' }: DocSlotProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-amber-800">{label}</p>
      {sublabel && <p className="text-xs text-amber-500 -mt-1">{sublabel}</p>}
      <div
        onClick={() => !preview && ref.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden cursor-pointer
          ${preview ? 'border-green-300 bg-green-50' : 'border-amber-200 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50'}`}
        style={{ minHeight: 130 }}
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-32 object-cover rounded-lg" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onClear(); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 gap-2 px-3 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${color}20` }}>
              <Camera className="w-5 h-5" style={{ color }} />
            </div>
            <p className="text-xs text-amber-600 font-medium">کلیک کنید برای آپلود</p>
            <p className="text-xs text-amber-400">JPG, PNG, WEBP • حداکثر 5MB</p>
          </div>
        )}
      </div>
      {!preview && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors hover:opacity-80"
          style={{ borderColor: color, color }}
        >
          <Upload className="w-3.5 h-3.5" /> انتخاب تصویر
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5 * 1024 * 1024) { toast.error('حجم فایل نباید بیشتر از 5MB باشد'); return; }
          onFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/* ─── Multi-file upload slot (single field, multiple images) ─── */
interface MultiDocSlotProps {
  label: string;
  sublabel?: string;
  files: (File | null)[];
  previews: (string | null)[];
  maxFiles: number;
  onFilesChange: (files: (File | null)[], previews: (string | null)[]) => void;
  color?: string;
}
function MultiDocSlot({ label, sublabel, files, previews, maxFiles, onFilesChange, color = '#f59e0b' }: MultiDocSlotProps) {
  const ref = useRef<HTMLInputElement>(null);
  const filledCount = previews.filter(Boolean).length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const available = maxFiles - filledCount;
    const toAdd = selected.slice(0, available);
    const oversized = toAdd.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length) { toast.error('یک یا چند فایل بیشتر از 5MB است'); return; }
    const newFiles = [...files];
    const newPreviews = [...previews];
    let slot = 0;
    for (const f of toAdd) {
      while (slot < maxFiles && newFiles[slot]) slot++;
      if (slot >= maxFiles) break;
      newFiles[slot] = f;
      newPreviews[slot] = URL.createObjectURL(f);
      slot++;
    }
    onFilesChange(newFiles, newPreviews);
    e.target.value = '';
  };

  const removeAt = (idx: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    if (newPreviews[idx] && newPreviews[idx]!.startsWith('blob:')) URL.revokeObjectURL(newPreviews[idx]!);
    newFiles[idx] = null;
    newPreviews[idx] = null;
    onFilesChange(newFiles, newPreviews);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold text-amber-800">{label}</p>
        {sublabel && <p className="text-xs text-amber-500 mt-0.5">{sublabel}</p>}
      </div>

      <div className="rounded-xl border-2 border-dashed p-3 space-y-3"
        style={{ borderColor: filledCount > 0 ? '#6ee7b7' : `${color}60`, background: filledCount > 0 ? '#f0fdf4' : `${color}08` }}>

        {/* Uploaded thumbnails */}
        {filledCount > 0 && (
          <div className="flex gap-2 flex-wrap">
            {previews.map((prev, idx) => prev ? (
              <div key={idx} className="relative group shrink-0">
                <img
                  src={prev}
                  alt={`تصویر ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border-2 border-green-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-center rounded-b-lg text-xs py-0.5">
                  {idx + 1}
                </div>
              </div>
            ) : null)}
          </div>
        )}

        {/* Upload trigger */}
        {filledCount < maxFiles && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-4 rounded-xl border border-dashed transition-all hover:opacity-80"
            style={{ borderColor: color, background: `${color}10` }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${color}25` }}>
              <Upload className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-xs font-semibold" style={{ color }}>
              {filledCount === 0
                ? `انتخاب تصویر (تا ${maxFiles} فایل)`
                : `افزودن تصویر (${filledCount}/${maxFiles})`}
            </p>
            <p className="text-xs text-amber-400">JPG, PNG, WEBP • حداکثر 5MB هر فایل</p>
          </button>
        )}

        {filledCount >= maxFiles && (
          <p className="text-center text-xs text-green-600 font-medium py-1">
            ✓ {maxFiles} تصویر آپلود شد
          </p>
        )}
      </div>

      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════ */
export default function OrderNewPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  /* ── Step 0: Car ── */
  const [cars, setCars] = useState<CarItem[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCarId, setSelectedCarId] = useState('');

  /* ── Step 1: Customer ── */
  const [customer, setCustomer] = useState(initCustomer);
  const [customerErrors, setCustomerErrors] = useState<FormErrors>({});

  /* ── Step 2: Guarantor ── */
  const [guarantor, setGuarantor] = useState(initGuarantor);

  /* ── Step 3: Driver ── */
  const [driverName, setDriverName]       = useState('');
  const [driverLicense, setDriverLicense] = useState('');
  const [driverPhone, setDriverPhone]     = useState('');

  /* ── Step 4: Billing ── */
  const [dailyRentInput, setDailyRentInput]   = useState('');
  const [receivedAmount, setReceivedAmount]   = useState('');
  const [billingErrors, setBillingErrors]     = useState<FormErrors>({});

  /* ── Step 5: Documents ── */
  const [customerPhoto, setCustomerPhoto]       = useState<File | null>(null);
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState<string | null>(null);
  const [guarantorPhoto, setGuarantorPhoto]     = useState<File | null>(null);
  const [guarantorPhotoPreview, setGuarantorPhotoPreview] = useState<string | null>(null);
  const [guarantorPhoto2, setGuarantorPhoto2]   = useState<File | null>(null);
  const [guarantorPhoto2Preview, setGuarantorPhoto2Preview] = useState<string | null>(null);
  const [billDocPhoto, setBillDocPhoto]         = useState<File | null>(null);
  const [billDocPhotoPreview, setBillDocPhotoPreview] = useState<string | null>(null);
  const [tazkiraDocPhoto, setTazkiraDocPhoto]   = useState<File | null>(null);
  const [tazkiraDocPhotoPreview, setTazkiraDocPhotoPreview] = useState<string | null>(null);
  const [tazkiraDocPhoto2, setTazkiraDocPhoto2] = useState<File | null>(null);
  const [tazkiraDocPhoto2Preview, setTazkiraDocPhoto2Preview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  /* ── Bill preview overlays ── */
  const [previewAdminBill,    setPreviewAdminBill]    = useState(false);
  const [previewCustomerBill, setPreviewCustomerBill] = useState(false);

  /* ── Draft system ── */
  const [draftId, setDraftId]           = useState<string | null>(null);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [draftSaving, setDraftSaving]   = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDailyRateSync = useRef(false);

  /* ── Edit mode ── */
  const [isEditMode, setIsEditMode]                   = useState(false);
  const [editId, setEditId]                           = useState<string | null>(null);
  const [existingCustomerId, setExistingCustomerId]   = useState<string | null>(null);
  const [existingGuarantorId, setExistingGuarantorId] = useState<string | null>(null);

  useEffect(() => { if (!token) router.push('/'); }, [token]);

  useEffect(() => {
    if (token) {
      carsAPI.getAll()
        .then(r => setCars(r.data.data || []))
        .catch(() => toast.error('خطا در بارگذاری موترها'))
        .finally(() => setCarsLoading(false));
    }
  }, [token]);

  /* ─── Draft helpers ─── */
  const getDraftPayload = () => ({
    step,
    formData: {
      selectedCarId,
      customer,
      guarantor,
      driverName, driverLicense, driverPhone,
      dailyRentInput,
      receivedAmount,
    },
  });

  const saveDraft = async (silent = true) => {
    if (!token || !draftEnabled || isEditMode) return;
    setDraftSaving(true);
    try {
      const payload = getDraftPayload();
      if (draftId) {
        await draftsAPI.update(draftId, payload);
      } else {
        const res = await draftsAPI.create(payload);
        setDraftId(res.data.data.id);
      }
      setDraftSavedAt(new Date());
      if (!silent) toast.success(lang === 'dari' ? 'پیش‌نویس ذخیره شد' : 'مسوده خوندي شوه');
    } catch { if (!silent) toast.error(lang === 'dari' ? 'خطا در ذخیره پیش‌نویس' : 'د مسودې ذخیره کې تیروتنه'); }
    finally { setDraftSaving(false); }
  };

  /* ─── Auto-save every 3s of inactivity (only after first step is completed) ─── */
  useEffect(() => {
    if (!token || !draftEnabled) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(true), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [step, selectedCarId, customer, guarantor, driverName, driverLicense, driverPhone, dailyRentInput, receivedAmount, token, draftEnabled]);

  /* ─── Load draft from URL param ─── */
  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('draft');
    if (!id) return;
    draftsAPI.getById(id).then(res => {
      const d = res.data.data;
      setDraftId(d.id);
      setStep(d.step || 0);
      const fd = d.formData as any;
      if (fd.selectedCarId)  setSelectedCarId(fd.selectedCarId);
      if (fd.customer)       setCustomer(fd.customer);
      if (fd.guarantor)      setGuarantor(fd.guarantor);
      if (fd.driverName)     setDriverName(fd.driverName);
      if (fd.driverLicense)  setDriverLicense(fd.driverLicense);
      if (fd.driverPhone)    setDriverPhone(fd.driverPhone);
      if (fd.dailyRentInput) setDailyRentInput(fd.dailyRentInput);
      if (fd.receivedAmount) setReceivedAmount(fd.receivedAmount);
      setShowDraftBanner(true);
      setDraftEnabled(true);
    }).catch(() => {});
  }, [token]);

  /* ─── Edit-mode: load existing order and prefill all fields ─── */
  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('edit');
    if (!id) return;
    setIsEditMode(true);
    setEditId(id);
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
    ordersAPI.getById(id).then(res => {
      const c = res.data.data;
      skipNextDailyRateSync.current = true;
      setSelectedCarId(c.carId);
      setExistingCustomerId(c.customerId);
      setCustomer({
        fullName:       c.customer?.fullName       || '',
        fatherName:     c.customer?.fatherName     || '',
        tazkiraNumber:  c.customer?.tazkiraNumber  || '',
        phoneNumber:    c.customer?.phoneNumber    || '',
        altPhone:       c.customer?.altPhone       || '',
        province:       c.customer?.province       || '',
        district:       c.customer?.district       || '',
        village:        c.customer?.village        || '',
        currentAddress: c.customer?.currentAddress || '',
        occupation:     c.customer?.occupation     || '',
        notes:          c.notes                    || '',
        startDate:      c.startDate ? c.startDate.split('T')[0] : '',
        startTime:      c.startTime || '',
        endDate:        c.endDate   ? c.endDate.split('T')[0]   : '',
        endTime:        c.endTime   || '',
      });
      if (c.guarantor) {
        setExistingGuarantorId(c.guarantorId);
        setGuarantor({
          fullName:       c.guarantor.fullName       || '',
          fatherName:     c.guarantor.fatherName     || '',
          tazkiraNumber:  c.guarantor.tazkiraNumber  || '',
          phoneNumber:    c.guarantor.phoneNumber    || '',
          province:       c.guarantor.province       || '',
          district:       c.guarantor.district       || '',
          currentAddress: c.guarantor.currentAddress || '',
          relationship:   c.guarantor.relationship   || '',
          notes:          c.guarantor.notes          || '',
        });
      }
      setDriverName(c.driverName || '');
      setDriverLicense(c.driverLicense || '');
      setDriverPhone(c.driverPhone || '');
      setDailyRentInput(String(c.rentPrice   || ''));
      setReceivedAmount(String(c.advancePayment || ''));
      const imgUrl = (p: string | null) => p ? `${API_BASE}${p}` : null;
      const cp  = imgUrl(c.customer?.photo);     if (cp)  setCustomerPhotoPreview(cp);
      const gp  = imgUrl(c.guarantor?.photo);    if (gp)  setGuarantorPhotoPreview(gp);
      const gp2 = imgUrl(c.guarantor?.photo2);   if (gp2) setGuarantorPhoto2Preview(gp2);
      const bp  = imgUrl(c.billDocPhoto);        if (bp)  setBillDocPhotoPreview(bp);
      const tp  = imgUrl(c.tazkiraDocPhoto);     if (tp)  setTazkiraDocPhotoPreview(tp);
      const tp2 = imgUrl(c.tazkiraDocPhoto2);    if (tp2) setTazkiraDocPhoto2Preview(tp2);
    }).catch(() => toast.error(lang === 'dari' ? 'خطا در بارگذاری سفارش' : 'د سفارش بارولو کې تیروتنه'));
  }, [token]);

  /* ─── Warn on page leave if form has data ─── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (selectedCarId || customer.fullName) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [selectedCarId, customer.fullName]);

  /* ─── Sync daily rent when car changes ─── */
  const selectedCar = useMemo(() => cars.find(c => c.id === selectedCarId), [cars, selectedCarId]);

  useEffect(() => {
    if (skipNextDailyRateSync.current) { skipNextDailyRateSync.current = false; return; }
    if (selectedCar) setDailyRentInput(String(selectedCar.dailyRate));
  }, [selectedCarId]);           // reset whenever car selection changes

  /* ─── Derived values ─── */
  const rentalDays = useMemo(() => {
    if (!customer.startDate || !customer.endDate) return 0;
    const d = Math.ceil(
      (new Date(customer.endDate).getTime() - new Date(customer.startDate).getTime()) / 86400000
    );
    return d > 0 ? d : 0;
  }, [customer.startDate, customer.endDate]);

  const dailyRent  = useMemo(() => parseNum(dailyRentInput) || 0, [dailyRentInput]);
  const totalRent  = useMemo(() => dailyRent * rentalDays,         [dailyRent, rentalDays]);
  const received   = useMemo(() => Math.min(parseNum(receivedAmount) || 0, totalRent), [receivedAmount, totalRent]);
  const remaining  = useMemo(() => Math.max(0, totalRent - received),   [totalRent, received]);
  const ownerShare = useMemo(() => Math.round(totalRent * 0.50 * 100) / 100, [totalRent]);
  const adminShare = useMemo(() => Math.round((totalRent - ownerShare) * 100) / 100, [totalRent, ownerShare]);

  /* ─── Filtered cars ─── */
  const filteredCars = useMemo(() => {
    let list = cars;
    if (statusFilter !== 'ALL') list = list.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.carName.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        c.plateNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cars, search, statusFilter]);

  /* ─── Step navigation ─── */
  const goStep = (next: number) => {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 200);
  };

  /* ─── Validation ─── */
  const validateStep0 = () => { if (!selectedCarId) { toast.error('لطفاً یک موتر انتخاب کنید'); return false; } return true; };
  const validateStep1 = (): boolean => {
    const e: FormErrors = {};
    if (!customer.fullName.trim())  e.fullName  = 'نام و تخلص الزامی است';
    if (!customer.fatherName.trim()) e.fatherName = 'نام پدر الزامی است';
    if (!customer.phoneNumber.trim()) e.phoneNumber = 'شماره تلفن الزامی است';
    if (!customer.startDate)         e.startDate = 'تاریخ شروع الزامی است';
    if (!customer.endDate)           e.endDate   = 'تاریخ ختم الزامی است';
    if (customer.startDate && customer.endDate && customer.endDate <= customer.startDate)
      e.endDate = 'تاریخ ختم باید بعد از تاریخ شروع باشد';
    setCustomerErrors(e);
    return Object.keys(e).length === 0;
  };
  const validateStep3 = (): boolean => {
    const e: FormErrors = {};
    if (dailyRent <= 0) e.dailyRent = lang === 'dari' ? 'کرایه روزانه الزامی است و باید بیشتر از صفر باشد' : 'ورځنۍ کرایه اړینه ده او باید له صفر زیات وي';
    if (rentalDays === 0) e.dates = lang === 'dari' ? 'تاریخ‌های کرایه را در مرحله قبل تنظیم کنید' : 'د کرایې نیټې د مخکنۍ مرحلې کې تنظیم کړئ';
    setBillingErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    setSaving(true);
    try {
      /* 1 — Create customer */
      let custRes;
      if (customerPhoto) {
        const fd = new FormData();
        Object.entries({
          fullName: customer.fullName, fatherName: customer.fatherName,
          tazkiraNumber: customer.tazkiraNumber, phoneNumber: customer.phoneNumber,
          province: customer.province, district: customer.district,
          village: customer.village, currentAddress: customer.currentAddress,
          occupation: customer.occupation, notes: customer.notes,
        }).forEach(([k, v]) => v && fd.append(k, v));
        fd.append('photo', customerPhoto);
        custRes = await customersAPI.create(fd);
      } else {
        custRes = await customersAPI.create({
          fullName: customer.fullName, fatherName: customer.fatherName,
          tazkiraNumber: customer.tazkiraNumber, phoneNumber: customer.phoneNumber,
          province: customer.province, district: customer.district,
          village: customer.village, currentAddress: customer.currentAddress,
          occupation: customer.occupation, notes: customer.notes,
        });
      }
      const customerId = custRes.data.data.id;
      const customerPhotoUrl: string | undefined = custRes.data.data.photo;

      /* 2 — Create guarantor (optional) */
      let guarantorId: string | undefined;
      if (guarantor.fullName.trim()) {
        const guarData = {
          fullName: guarantor.fullName, fatherName: guarantor.fatherName,
          tazkiraNumber: guarantor.tazkiraNumber, phoneNumber: guarantor.phoneNumber,
          province: guarantor.province, district: guarantor.district,
          currentAddress: guarantor.currentAddress, relationship: guarantor.relationship,
          notes: guarantor.notes,
        };
        const fd = new FormData();
        Object.entries(guarData).forEach(([k, v]) => v && fd.append(k, v));
        if (guarantorPhoto)  fd.append('photo',  guarantorPhoto);
        if (guarantorPhoto2) fd.append('photo2', guarantorPhoto2);
        const guarRes = await guarantorsAPI.create(fd);
        guarantorId = guarRes.data.data.id;
      }

      /* 3 — Create contract */
      const startTime = customer.startTime || '00:00';
      const endTime   = customer.endTime   || '00:00';
      const advance   = received;

      const contractBase: Record<string, any> = {
        carId: selectedCarId, customerId,
        startDate: new Date(customer.startDate).toISOString(), startTime,
        endDate:   new Date(customer.endDate).toISOString(),   endTime,
        rentPrice:       dailyRent,
        totalRent,
        advancePayment:  advance,
        remainingAmount: remaining,
        carStatus: 'خوب', agreementConfirmed: true,
        notes: customer.notes,
        ...(guarantorId    && { guarantorId }),
        ...(driverName     && { driverName }),
        ...(driverLicense  && { driverLicense }),
        ...(driverPhone    && { driverPhone }),
      };
      let contractRes;
      const hasDocs = billDocPhoto || tazkiraDocPhoto || tazkiraDocPhoto2;
      if (hasDocs) {
        const fd = new FormData();
        Object.entries(contractBase).forEach(([k, v]) => fd.append(k, String(v)));
        if (billDocPhoto)     fd.append('billDocPhoto',     billDocPhoto);
        if (tazkiraDocPhoto)  fd.append('tazkiraDocPhoto',  tazkiraDocPhoto);
        if (tazkiraDocPhoto2) fd.append('tazkiraDocPhoto2', tazkiraDocPhoto2);
        contractRes = await ordersAPI.create(fd);
      } else {
        contractRes = await ordersAPI.create(contractBase);
      }

      const contract = contractRes.data.data;

      /* 4 — Store bill data in localStorage for print page */
      const billData = {
        contractNumber:          contract.contractNumber,
        carName:                 selectedCar?.carName || '',
        model:                   selectedCar?.model || '',
        color:                   selectedCar?.color || '',
        plateNumber:             selectedCar?.plateNumber || '',
        dailyRate:               dailyRent,
        totalRent,
        advancePayment:          advance,
        remainingAmount:         remaining,
        startDate:               customer.startDate,
        startTime:               customer.startTime || '00:00',
        endDate:                 customer.endDate,
        endTime:                 customer.endTime   || '00:00',
        customerFullName:        customer.fullName,
        customerFatherName:      customer.fatherName,
        customerDistrict:        customer.district,
        customerVillage:         customer.village,
        customerProvince:        customer.province,
        customerCurrentAddress:  customer.currentAddress,
        customerTazkira:         customer.tazkiraNumber,
        customerPhone:           customer.phoneNumber,
        customerPhoto:           customerPhotoUrl,
        guarantorFullName:       guarantor.fullName,
        guarantorFatherName:     guarantor.fatherName,
        guarantorDistrict:       guarantor.district,
        guarantorVillage:        guarantor.district,
        guarantorProvince:       guarantor.province,
        guarantorCurrentAddress: guarantor.currentAddress,
        guarantorTazkira:        guarantor.tazkiraNumber,
        guarantorPhone:          guarantor.phoneNumber,
        driverName:              driverName  || undefined,
        driverLicense:           driverLicense || undefined,
        driverPhone:             driverPhone || undefined,
        notes:                   customer.notes,
      };
      localStorage.setItem('lastOrderBill', JSON.stringify(billData));

      /* Also store customer bill data for print page */
      const customerBillData: CustomerBillData = {
        billNumber:     contract.contractNumber,
        startDate:      customer.startDate,
        endDate:        customer.endDate,
        startTime:      customer.startTime,
        endTime:        customer.endTime,
        carType:        [selectedCar?.carName, selectedCar?.model].filter(Boolean).join(' — '),
        plateNumber:    selectedCar?.plateNumber,
        customerName:   customer.fullName,
        customerPhone:  customer.phoneNumber,
        guarantorName:  guarantor.fullName  || undefined,
        guarantorPhone: guarantor.phoneNumber || undefined,
        driverName:     driverName    || undefined,
        driverPhone:    driverPhone   || undefined,
        notes:          customer.notes || undefined,
        rentalDays,
        dailyRate:      dailyRent,
        totalRent,
        received:       advance,
        remaining,
      };
      localStorage.setItem('lastCustomerBill', JSON.stringify(customerBillData));

      // Delete draft from server after successful submission
      if (draftId) { draftsAPI.delete(draftId).catch(() => {}); }
      toast.success(lang === 'dari' ? 'سفارش موفقانه ثبت شد!' : 'سفارش بریالیتوب سره ثبت شو!');
      router.push('/orders/print');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Edit submit ─── */
  const handleEditSubmit = async () => {
    setSaving(true);
    try {
      /* 1 — Update customer */
      const custData: Record<string, string> = {
        fullName: customer.fullName, fatherName: customer.fatherName,
        tazkiraNumber: customer.tazkiraNumber, phoneNumber: customer.phoneNumber,
        province: customer.province, district: customer.district,
        village: customer.village, currentAddress: customer.currentAddress,
        occupation: customer.occupation, notes: customer.notes,
      };
      if (customerPhoto) {
        const fd = new FormData();
        Object.entries(custData).forEach(([k, v]) => v && fd.append(k, v));
        fd.append('photo', customerPhoto);
        await customersAPI.update(existingCustomerId!, fd);
      } else {
        await customersAPI.update(existingCustomerId!, custData);
      }

      /* 2 — Update / create guarantor */
      let finalGuarantorId: string | undefined = existingGuarantorId || undefined;
      if (guarantor.fullName.trim()) {
        const guarData: Record<string, string> = {
          fullName: guarantor.fullName, fatherName: guarantor.fatherName,
          tazkiraNumber: guarantor.tazkiraNumber, phoneNumber: guarantor.phoneNumber,
          province: guarantor.province, district: guarantor.district,
          currentAddress: guarantor.currentAddress, relationship: guarantor.relationship,
          notes: guarantor.notes,
        };
        const fd = new FormData();
        Object.entries(guarData).forEach(([k, v]) => v && fd.append(k, v));
        if (guarantorPhoto)  fd.append('photo',  guarantorPhoto);
        if (guarantorPhoto2) fd.append('photo2', guarantorPhoto2);
        if (finalGuarantorId) {
          await guarantorsAPI.update(finalGuarantorId, fd);
        } else {
          const guarRes = await guarantorsAPI.create(fd);
          finalGuarantorId = guarRes.data.data.id;
        }
      }

      /* 3 — Update contract */
      const advance = received;
      const contractBase: Record<string, any> = {
        carId: selectedCarId,
        startDate: new Date(customer.startDate).toISOString(), startTime: customer.startTime || '00:00',
        endDate:   new Date(customer.endDate).toISOString(),   endTime:   customer.endTime   || '00:00',
        rentPrice: dailyRent, totalRent, advancePayment: advance, remainingAmount: remaining,
        carStatus: 'خوب', agreementConfirmed: true, notes: customer.notes,
        ...(finalGuarantorId && { guarantorId: finalGuarantorId }),
        ...(driverName     && { driverName }),
        ...(driverLicense  && { driverLicense }),
        ...(driverPhone    && { driverPhone }),
      };
      const hasDocs = billDocPhoto || tazkiraDocPhoto || tazkiraDocPhoto2;
      if (hasDocs) {
        const fd = new FormData();
        Object.entries(contractBase).forEach(([k, v]) => fd.append(k, String(v)));
        if (billDocPhoto)     fd.append('billDocPhoto',     billDocPhoto);
        if (tazkiraDocPhoto)  fd.append('tazkiraDocPhoto',  tazkiraDocPhoto);
        if (tazkiraDocPhoto2) fd.append('tazkiraDocPhoto2', tazkiraDocPhoto2);
        await ordersAPI.update(editId!, fd);
      } else {
        await ordersAPI.update(editId!, contractBase);
      }

      toast.success(lang === 'dari' ? 'سفارش موفقانه ویرایش شد!' : 'سفارش بریالیتوب سره سم شو!');
      router.push('/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Step definitions ─── */
  const steps = [
    { label: lang === 'dari' ? 'انتخاب موتر'    : 'موتر غوره کول',    icon: Car },
    { label: lang === 'dari' ? 'معلومات مشتری'  : 'د مشتري معلومات', icon: User },
    { label: lang === 'dari' ? 'معلومات ضامن'   : 'د ضامن معلومات',  icon: Shield },
    { label: lang === 'dari' ? 'معلومات راننده' : 'د دریور معلومات', icon: UserCheck },
    { label: lang === 'dari' ? 'محاسبه مالی'    : 'مالي حساب',       icon: Receipt },
    { label: lang === 'dari' ? 'اسناد و ثبت'    : 'اسناد او ثبت',    icon: FileImage },
  ];

  const fmtCur = (n: number) => `${formatNumber(n)} ${lang === 'dari' ? 'افغانی' : 'افغاني'}`;

  /* ── Build admin bill preview data ── */
  const buildAdminBillPreview = (): BillData => ({
    contractNumber:          isEditMode ? '—' : lang === 'dari' ? 'پیش‌نویس' : 'مسوده',
    carName:                 selectedCar?.carName     || '',
    model:                   selectedCar?.model       || '',
    color:                   selectedCar?.color       || '',
    plateNumber:             selectedCar?.plateNumber || '',
    dailyRate:               dailyRent,
    totalRent,
    advancePayment:          received,
    remainingAmount:         remaining,
    startDate:               customer.startDate || new Date().toISOString().split('T')[0],
    startTime:               customer.startTime || '00:00',
    endDate:                 customer.endDate   || new Date().toISOString().split('T')[0],
    endTime:                 customer.endTime   || '00:00',
    customerFullName:        customer.fullName,
    customerFatherName:      customer.fatherName,
    customerDistrict:        customer.district,
    customerVillage:         customer.village,
    customerProvince:        customer.province,
    customerCurrentAddress:  customer.currentAddress,
    customerTazkira:         customer.tazkiraNumber,
    customerPhone:           customer.phoneNumber,
    customerPhoto:           customerPhotoPreview || undefined,
    guarantorFullName:       guarantor.fullName,
    guarantorFatherName:     guarantor.fatherName,
    guarantorDistrict:       guarantor.district,
    guarantorVillage:        guarantor.district,
    guarantorProvince:       guarantor.province,
    guarantorCurrentAddress: guarantor.currentAddress,
    guarantorTazkira:        guarantor.tazkiraNumber,
    guarantorPhone:          guarantor.phoneNumber,
    driverName:              driverName    || undefined,
    driverLicense:           driverLicense || undefined,
    driverPhone:             driverPhone   || undefined,
    notes:                   customer.notes,
  });

  /* ── Build customer bill preview data ── */
  const buildCustomerBillPreview = (): CustomerBillData => ({
    billNumber:      isEditMode ? '—' : lang === 'dari' ? 'پیش‌نویس' : 'مسوده',
    startDate:       customer.startDate || new Date().toISOString().split('T')[0],
    endDate:         customer.endDate   || new Date().toISOString().split('T')[0],
    startTime:       customer.startTime,
    endTime:         customer.endTime,
    carType:         [selectedCar?.carName, selectedCar?.model].filter(Boolean).join(' — '),
    plateNumber:     selectedCar?.plateNumber,
    customerName:    customer.fullName,
    customerPhone:   customer.phoneNumber,
    guarantorName:   guarantor.fullName  || undefined,
    guarantorPhone:  guarantor.phoneNumber || undefined,
    driverName:      driverName    || undefined,
    driverPhone:     driverPhone   || undefined,
    notes:           customer.notes || undefined,
    rentalDays,
    dailyRate:       dailyRent,
    totalRent,
    received,
    remaining,
  });

  /* ═══ RENDER ═══ */
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Edit mode banner */}
        {isEditMode && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
            <Pencil className="w-4 h-4 text-orange-600 shrink-0" />
            <p className="text-sm font-semibold text-orange-800">
              {lang === 'dari'
                ? 'حالت ویرایش — تغییرات شما جایگزین اطلاعات قبلی خواهد شد'
                : 'د سمولو حالت — ستاسو بدلونونه به د مخکنیو معلوماتو ځای ونیسي'}
            </p>
          </div>
        )}

        {/* Draft restored banner */}
        {showDraftBanner && !isEditMode && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm">
            <div className="flex items-center gap-2 text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {lang === 'dari' ? 'پیش‌نویس بازیابی شد. اطلاعات قبلی بارگذاری شد.' : 'مسوده بیرته راغله. پخوانۍ معلومات بارګزاري شول.'}
            </div>
            <button onClick={() => setShowDraftBanner(false)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">بستن</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-900">
              {isEditMode
                ? (lang === 'dari' ? 'ویرایش سفارش' : 'د سفارش سمول')
                : (lang === 'dari' ? 'سفارش موتر جدید' : 'نوی د موتر امر')}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-sm text-amber-600">
                {lang === 'dari' ? 'تمام مراحل را تکمیل کنید' : 'ټول مرحلې بشپړ کړئ'}
              </p>
              {/* Draft status — only shown after first step is completed, not in edit mode */}
              {draftEnabled && !isEditMode && (
                draftSaving ? (
                  <span className="flex items-center gap-1 text-xs text-amber-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {lang === 'dari' ? 'در حال ذخیره...' : 'ذخیره کیږي...'}
                  </span>
                ) : draftSavedAt ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {lang === 'dari' ? 'پیش‌نویس ذخیره شد' : 'مسوده خوندي شوه'}
                  </span>
                ) : null
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draftEnabled && !isEditMode && (
              <button
                onClick={() => saveDraft(false)}
                disabled={draftSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {draftSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>💾</span>
                )}
                {lang === 'dari' ? 'ذخیره پیش‌نویس' : 'مسوده ذخیره'}
              </button>
            )}
            <button onClick={() => router.push('/orders')} className="btn-secondary px-4 py-2 rounded-xl text-sm">
              {t.back}
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {steps.map((s, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center flex-1">
                <button
                  onClick={() => done && goStep(i)}
                  disabled={!done}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all w-full justify-center
                    ${done ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700 shadow-md'
                      : active ? 'text-white shadow-lg cursor-default'
                      : 'bg-amber-100 text-amber-400 cursor-default'}`}
                  style={active ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)' } : {}}
                >
                  {done ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <s.icon className="w-4 h-4 shrink-0" />}
                  <span className="hidden sm:block truncate">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-0.5 rounded-full ${i < step ? 'bg-green-400' : 'bg-amber-100'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step card */}
        <div
          className={`card-golden rounded-2xl p-6 transition-all duration-200 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        >

          {/* ═══ STEP 0: Car Selection ═══ */}
          {step === 0 && (
            <div className="space-y-5">
              <StepHeader icon={Car} title={lang === 'dari' ? 'موتر مورد نظر را انتخاب کنید' : 'خپل موتر وټاکئ'} gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={lang === 'dari' ? 'جستجوی موتر...' : 'موتر لټول...'}
                    className={`${inp} pr-9`} />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {[
                    { key: 'ALL',         label: lang === 'dari' ? 'همه'        : 'ټول' },
                    { key: 'AVAILABLE',   label: lang === 'dari' ? 'موجود'      : 'موجود' },
                    { key: 'RENTED',      label: lang === 'dari' ? 'کرایه شده'  : 'کرایه' },
                    { key: 'MAINTENANCE', label: lang === 'dari' ? 'تعمیر'      : 'ترمیم' },
                  ].map(f => (
                    <button key={f.key} onClick={() => setStatusFilter(f.key)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all
                        ${statusFilter === f.key ? 'bg-amber-500 text-white border-amber-500 shadow' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {carsLoading ? (
                <div className="text-center py-12 text-amber-500">
                  <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3" />
                  {lang === 'dari' ? 'در حال بارگذاری...' : 'بارول...'}
                </div>
              ) : filteredCars.length === 0 ? (
                <div className="text-center py-12 text-amber-400">
                  <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{lang === 'dari' ? 'موتری یافت نشد' : 'موتر ونه موندل شو'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                  {filteredCars.map(car => {
                    const sel = car.id === selectedCarId;
                    const si  = STATUS_LABEL[car.status] || { text: car.status, cls: 'bg-gray-100 text-gray-600 border-gray-300' };
                    return (
                      <button key={car.id} onClick={() => setSelectedCarId(car.id)}
                        className={`relative text-right rounded-xl border-2 p-4 transition-all shadow-sm hover:shadow-md
                          ${sel ? 'border-amber-500 bg-amber-50 shadow-amber-200' : 'border-amber-100 bg-white hover:border-amber-300'}`}>
                        {sel && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow"
                            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto ${sel ? 'bg-amber-100' : 'bg-amber-50'}`}>
                          <span className="text-2xl">🚗</span>
                        </div>
                        <h4 className="font-bold text-amber-900 text-sm mb-1 truncate">{car.carName}</h4>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{car.model}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{car.color}</span>
                        </div>
                        <div className="text-xs text-amber-600 font-mono mb-2 bg-amber-50 px-2 py-1 rounded text-center">{car.plateNumber}</div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-amber-800">
                            {formatNumber(car.dailyRate)}
                            <span className="text-xs font-normal text-amber-500 mr-1">افغانی/روز</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${si.cls}`}>{si.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedCar && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border-2 border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-green-800">{lang === 'dari' ? 'موتر انتخاب شد:' : 'موتر وټاکل شو:'} {selectedCar.carName}</p>
                    <p className="text-sm text-green-600">{selectedCar.model} — {selectedCar.plateNumber} — {formatNumber(selectedCar.dailyRate)} افغانی/روز</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 1: Customer Info ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              <StepHeader icon={User} title={lang === 'dari' ? 'معلومات مشتری' : 'د مشتري معلومات'} gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label={t.fullName}    required error={customerErrors.fullName}>
                  <input value={customer.fullName}    onChange={e => setCustomer(p => ({ ...p, fullName: e.target.value }))} className={customerErrors.fullName ? eInp : inp} />
                </Field>
                <Field label={t.fatherName}  required error={customerErrors.fatherName}>
                  <input value={customer.fatherName}  onChange={e => setCustomer(p => ({ ...p, fatherName: e.target.value }))} className={customerErrors.fatherName ? eInp : inp} />
                </Field>
                <Field label={t.tazkiraNumber}>
                  <input value={customer.tazkiraNumber} onChange={e => setCustomer(p => ({ ...p, tazkiraNumber: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.phone} required error={customerErrors.phoneNumber}>
                  <input value={customer.phoneNumber} onChange={e => setCustomer(p => ({ ...p, phoneNumber: e.target.value }))} className={customerErrors.phoneNumber ? eInp : inp} dir="ltr" />
                </Field>
                <Field label={lang === 'dari' ? 'شماره تلفن دوم' : 'دویم تلیفون'}>
                  <input value={customer.altPhone} onChange={e => setCustomer(p => ({ ...p, altPhone: e.target.value }))} className={inp} dir="ltr" />
                </Field>
                <Field label={t.occupation}>
                  <input value={customer.occupation} onChange={e => setCustomer(p => ({ ...p, occupation: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.province}>
                  <input value={customer.province} onChange={e => setCustomer(p => ({ ...p, province: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.district}>
                  <input value={customer.district} onChange={e => setCustomer(p => ({ ...p, district: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.village}>
                  <input value={customer.village} onChange={e => setCustomer(p => ({ ...p, village: e.target.value }))} className={inp} />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label={t.currentAddress}>
                    <input value={customer.currentAddress} onChange={e => setCustomer(p => ({ ...p, currentAddress: e.target.value }))} className={inp} />
                  </Field>
                </div>
              </div>
              {/* Rental dates */}
              <div className="border-t border-amber-200 pt-4">
                <h4 className="text-sm font-bold text-amber-800 mb-3">{lang === 'dari' ? 'تاریخ و وقت کرایه' : 'د کرایې نیټه او وخت'}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={t.startDate} required error={customerErrors.startDate}>
                    <input type="date" value={customer.startDate} onChange={e => setCustomer(p => ({ ...p, startDate: e.target.value }))} className={customerErrors.startDate ? eInp : inp} />
                    <input type="time" value={customer.startTime} onChange={e => setCustomer(p => ({ ...p, startTime: e.target.value }))} className={`${inp} mt-1.5`} />
                  </Field>
                  <Field label={t.endDate} required error={customerErrors.endDate}>
                    <input type="date" value={customer.endDate} onChange={e => setCustomer(p => ({ ...p, endDate: e.target.value }))} className={customerErrors.endDate ? eInp : inp} />
                    <input type="time" value={customer.endTime} onChange={e => setCustomer(p => ({ ...p, endTime: e.target.value }))} className={`${inp} mt-1.5`} />
                  </Field>
                </div>
                {rentalDays > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-sm text-green-800">
                      <strong>{rentalDays}</strong> {lang === 'dari' ? 'روز انتخاب شده' : 'ورځې غوره شوي'}
                      {dailyRent > 0 && (
                        <span>
                          {' '}—{' '}
                          {lang === 'dari' ? 'کرایه در مرحله مالی تنظیم می‌شود' : 'کرایه د مالي مرحلې کې تنظیمیږي'}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              <Field label={t.notes}>
                <textarea value={customer.notes} onChange={e => setCustomer(p => ({ ...p, notes: e.target.value }))} rows={2} className={`${inp} resize-none`} />
              </Field>
            </div>
          )}

          {/* ═══ STEP 2: Guarantor ═══ */}
          {step === 2 && (
            <div className="space-y-5">
              <StepHeader icon={Shield} title={lang === 'dari' ? 'معلومات ضامن (اختیاری)' : 'د ضامن معلومات (اختیاري)'} gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label={t.fullName}>
                  <input value={guarantor.fullName} onChange={e => setGuarantor(p => ({ ...p, fullName: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.fatherName}>
                  <input value={guarantor.fatherName} onChange={e => setGuarantor(p => ({ ...p, fatherName: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.tazkiraNumber}>
                  <input value={guarantor.tazkiraNumber} onChange={e => setGuarantor(p => ({ ...p, tazkiraNumber: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.phone}>
                  <input value={guarantor.phoneNumber} onChange={e => setGuarantor(p => ({ ...p, phoneNumber: e.target.value }))} className={inp} dir="ltr" />
                </Field>
                <Field label={t.province}>
                  <input value={guarantor.province} onChange={e => setGuarantor(p => ({ ...p, province: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.district}>
                  <input value={guarantor.district} onChange={e => setGuarantor(p => ({ ...p, district: e.target.value }))} className={inp} />
                </Field>
                <Field label={t.relationship}>
                  <input value={guarantor.relationship} onChange={e => setGuarantor(p => ({ ...p, relationship: e.target.value }))} className={inp}
                    placeholder={lang === 'dari' ? 'مثلاً: برادر، پدر...' : 'مثلاً: وروڼه، پلار...'} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={t.currentAddress}>
                    <input value={guarantor.currentAddress} onChange={e => setGuarantor(p => ({ ...p, currentAddress: e.target.value }))} className={inp} />
                  </Field>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label={t.notes}>
                    <textarea value={guarantor.notes} onChange={e => setGuarantor(p => ({ ...p, notes: e.target.value }))} rows={2} className={`${inp} resize-none`} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Driver Info ═══ */}
          {step === 3 && (
            <div className="space-y-5">
              <StepHeader icon={UserCheck} title={lang === 'dari' ? 'معلومات راننده (اختیاری)' : 'د دریور معلومات (اختیاري)'} gradient="linear-gradient(135deg,#0891b2,#0e7490)" />
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
                {lang === 'dari'
                  ? 'اگر موتر توسط راننده جداگانه‌ای استفاده می‌شود، معلومات راننده را وارد کنید. در غیر این صورت می‌توانید این مرحله را رد کنید.'
                  : 'که موتر د جلا دریور لخوا کارول کیږي، د دریور معلومات دننه کړئ. نه د دې خو تاسو کولی شئ دا مرحله رد کړئ.'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label={lang === 'dari' ? 'نام راننده' : 'د دریور نوم'}>
                  <input
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className={inp}
                    placeholder={lang === 'dari' ? 'نام و تخلص...' : 'نوم او تخلص...'}
                  />
                </Field>
                <Field label={lang === 'dari' ? 'نمبر لیسنس' : 'لیسنس نمبر'}>
                  <input
                    value={driverLicense}
                    onChange={e => setDriverLicense(e.target.value)}
                    className={inp}
                    placeholder={lang === 'dari' ? 'شماره لیسنس...' : 'لیسنس شمیره...'}
                    dir="ltr"
                  />
                </Field>
                <Field label={lang === 'dari' ? 'شماره تلفن راننده' : 'د دریور تلیفون'}>
                  <input
                    value={driverPhone}
                    onChange={e => setDriverPhone(e.target.value)}
                    className={inp}
                    dir="ltr"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Financial Calculation ═══ */}
          {step === 4 && (
            <div className="space-y-4">
              <StepHeader icon={Receipt} title={lang === 'dari' ? 'محاسبه مالی' : 'مالي حساب'} gradient="linear-gradient(135deg,#059669,#047857)" />

              {/* Car + period context strip */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50/60">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl bg-amber-100 shrink-0">🚗</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 truncate text-sm">{selectedCar?.carName}
                    <span className="font-normal text-amber-500 text-xs mr-2">— {selectedCar?.plateNumber}</span>
                  </p>
                  <p className="text-xs text-amber-500">{customer.startDate} → {customer.endDate}</p>
                </div>
                {rentalDays > 0 && (
                  <div className="shrink-0 text-center px-3 py-1.5 rounded-xl bg-white border border-amber-200 shadow-sm">
                    <p className="text-lg font-black text-amber-900 leading-none">{rentalDays}</p>
                    <p className="text-[10px] text-amber-500 mt-0.5">{lang === 'dari' ? 'روز' : 'ورځ'}</p>
                  </div>
                )}
              </div>

              {/* Input + auto-calculation row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Daily rate */}
                <div>
                  <label className={lbl}>
                    {lang === 'dari' ? 'کرایه روزانه (افغانی)' : 'ورځنۍ کرایه (افغاني)'}
                    <span className="text-red-500 mr-1"> *</span>
                  </label>
                  <input
                    value={dailyRentInput}
                    onChange={numericInputHandler(setDailyRentInput)}
                    inputMode="numeric"
                    placeholder="0"
                    className={`${billingErrors.dailyRent ? eInp : inp} text-lg font-bold`}
                    dir="ltr"
                  />
                  {billingErrors.dailyRent && <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3 shrink-0" />{billingErrors.dailyRent}</p>}
                  {billingErrors.dates     && <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3 shrink-0" />{billingErrors.dates}</p>}
                </div>

                {/* Advance payment */}
                <div>
                  <label className={lbl}>{lang === 'dari' ? 'پیش پرداخت دریافتی (افغانی)' : 'ترلاسه شوی پیش پرداخت (افغاني)'}</label>
                  <input
                    value={receivedAmount}
                    onChange={numericInputHandler(setReceivedAmount)}
                    inputMode="numeric"
                    placeholder="0"
                    className={`${inp} text-lg font-bold`}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Auto-calculated summary — 3 cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl p-4 text-center border-2 border-amber-200 bg-amber-50">
                  <p className="text-xs text-amber-600 font-medium mb-1">{lang === 'dari' ? 'مجموع کرایه' : 'ټوله کرایه'}</p>
                  <p className="text-xl font-black text-amber-900">{formatNumber(totalRent)}</p>
                  <p className="text-[10px] text-amber-400 mt-0.5">افغانی</p>
                </div>
                <div className="rounded-2xl p-4 text-center border-2 border-green-300 bg-green-50">
                  <p className="text-xs text-green-600 font-medium mb-1">{lang === 'dari' ? 'دریافت شده' : 'ترلاسه شوي'}</p>
                  <p className="text-xl font-black text-green-800">{formatNumber(received)}</p>
                  <p className="text-[10px] text-green-400 mt-0.5">افغانی</p>
                </div>
                <div className={`rounded-2xl p-4 text-center border-2 ${remaining > 0 ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
                  <p className={`text-xs font-medium mb-1 ${remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{lang === 'dari' ? 'باقی‌مانده' : 'پاتې'}</p>
                  <p className={`text-xl font-black ${remaining > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatNumber(remaining)}</p>
                  <p className={`text-[10px] mt-0.5 ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>افغانی</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 5: Documents + Review ═══ */}
          {step === 5 && (
            <div className="space-y-6">
              <StepHeader icon={FileImage} title={lang === 'dari' ? 'آپلود اسناد' : 'د اسنادو پورته کول'} gradient="linear-gradient(135deg,#0891b2,#0e7490)" />

              {/* Document uploads */}
              <div className="space-y-5">
                {/* Row 1: Customer photo + Bill doc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DocSlot
                    label={lang === 'dari' ? 'عکس مشتری' : 'د مشتري انځور'}
                    sublabel={lang === 'dari' ? 'برای تأیید هویت' : 'د هویت تایید لپاره'}
                    preview={customerPhotoPreview}
                    onFile={f => { setCustomerPhoto(f); setCustomerPhotoPreview(URL.createObjectURL(f)); }}
                    onClear={() => { setCustomerPhoto(null); setCustomerPhotoPreview(null); }}
                    color="#3b82f6"
                  />
                  <DocSlot
                    label={lang === 'dari' ? 'عکس بل / قرارداد' : 'د بل / قرارداد انځور'}
                    sublabel={lang === 'dari' ? 'عکس از بل چاپ شده' : 'د چاپ شوي بل انځور'}
                    preview={billDocPhotoPreview}
                    onFile={f => { setBillDocPhoto(f); setBillDocPhotoPreview(URL.createObjectURL(f)); }}
                    onClear={() => { setBillDocPhoto(null); setBillDocPhotoPreview(null); }}
                    color="#059669"
                  />
                </div>

                {/* Row 2: Guarantor photos — single multi-upload field */}
                <MultiDocSlot
                  label={lang === 'dari' ? 'عکس ضامن' : 'د ضامن انځور'}
                  sublabel={lang === 'dari' ? 'حداکثر ۲ تصویر را با هم انتخاب کنید' : 'تر ۲ پورې انځورونه یو ځل وټاکئ'}
                  files={[guarantorPhoto, guarantorPhoto2]}
                  previews={[guarantorPhotoPreview, guarantorPhoto2Preview]}
                  maxFiles={2}
                  onFilesChange={(fs, ps) => {
                    setGuarantorPhoto(fs[0] ?? null);
                    setGuarantorPhoto2(fs[1] ?? null);
                    setGuarantorPhotoPreview(ps[0] ?? null);
                    setGuarantorPhoto2Preview(ps[1] ?? null);
                  }}
                  color="#8b5cf6"
                />

                {/* Row 3: Tazkira doc photos — single multi-upload field */}
                <MultiDocSlot
                  label={lang === 'dari' ? 'عکس تذکره / هویت' : 'د تذکرې / هویت انځور'}
                  sublabel={lang === 'dari' ? 'حداکثر ۲ تصویر را با هم انتخاب کنید' : 'تر ۲ پورې انځورونه یو ځل وټاکئ'}
                  files={[tazkiraDocPhoto, tazkiraDocPhoto2]}
                  previews={[tazkiraDocPhotoPreview, tazkiraDocPhoto2Preview]}
                  maxFiles={2}
                  onFilesChange={(fs, ps) => {
                    setTazkiraDocPhoto(fs[0] ?? null);
                    setTazkiraDocPhoto2(fs[1] ?? null);
                    setTazkiraDocPhotoPreview(ps[0] ?? null);
                    setTazkiraDocPhoto2Preview(ps[1] ?? null);
                  }}
                  color="#dc2626"
                />
              </div>

              {/* Compact order summary at the foot of step 5 */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-700">
                <span className="font-bold">{selectedCar?.carName}</span>
                <span className="text-amber-300">·</span>
                <span>{customer.fullName}</span>
                <span className="text-amber-300">·</span>
                <span className="font-semibold text-green-700">{fmtCur(totalRent)}</span>
                {remaining > 0 && <><span className="text-amber-300">·</span><span className="font-semibold text-red-600">{lang === 'dari' ? 'باقی:' : 'پاتې:'} {fmtCur(remaining)}</span></>}
              </div>
            </div>
          )}

          {/* ─── Navigation ─── */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t-2 border-amber-100 gap-3">
            {step > 0 ? (
              <button onClick={() => goStep(step - 1)} className="flex items-center gap-2 px-5 py-2.5 btn-secondary rounded-xl text-sm font-semibold">
                <ChevronRight className="w-4 h-4" />{t.previous}
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={() => {
                  if (step === 0 && !validateStep0()) return;
                  if (step === 1 && !validateStep1()) return;
                  if (step === 4 && !validateStep3()) return;
                  setDraftEnabled(true);
                  goStep(step + 1);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
              >
                {t.next}<ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              /* Step 5 = final save + redirect to print */
              <button
                onClick={isEditMode ? handleEditSubmit : handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                style={{ background: saving ? '#9ca3af' : 'linear-gradient(135deg,#059669,#047857)' }}
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.loading}</>
                ) : isEditMode ? (
                  <><Check className="w-4 h-4" />{lang === 'dari' ? 'ذخیره تغییرات' : 'بدلونونه خوندي کول'}</>
                ) : (
                  <><Check className="w-4 h-4" />{lang === 'dari' ? 'ثبت سفارش و چاپ بل' : 'سفارش ثبت کړئ او بل چاپ کړئ'}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* ── Admin Bill overlay ── */}
      {previewAdminBill && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto', background: '#d1d5db' }}>
          <ContractBill
            data={buildAdminBillPreview()}
            lang={lang as 'dari' | 'pashto'}
            onClose={() => setPreviewAdminBill(false)}
            autoPrint={false}
          />
        </div>
      )}

      {/* ── Customer Bill overlay ── */}
      {previewCustomerBill && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto', background: '#d1d5db' }}>
          <CustomerBill
            data={buildCustomerBillPreview()}
            lang={lang as 'dari' | 'pashto'}
            onClose={() => setPreviewCustomerBill(false)}
            autoPrint={false}
          />
        </div>
      )}

    </MainLayout>
  );
}

/* ─── Shared step header ─── */
function StepHeader({ icon: Icon, title, gradient }: { icon: any; title: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow" style={{ background: gradient }}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-amber-900">{title}</h3>
    </div>
  );
}
