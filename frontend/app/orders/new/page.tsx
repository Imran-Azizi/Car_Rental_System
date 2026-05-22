'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/lib/context';
import { carsAPI, customersAPI, guarantorsAPI, ordersAPI, draftsAPI } from '@/lib/api';
import { parseNum, numericInputHandler, formatNumber } from '@/lib/utils';
import {
  Car, User, Shield, Receipt, FileImage,
  Check, ChevronLeft, ChevronRight,
  Search, X, AlertCircle, CheckCircle2, Camera, Upload,
} from 'lucide-react';
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

/* ─── Document upload slot ─── */
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
              className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
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

  /* ── Step 3: Billing ── */
  const [dailyRentInput, setDailyRentInput]   = useState('');
  const [receivedAmount, setReceivedAmount]   = useState('');
  const [billingErrors, setBillingErrors]     = useState<FormErrors>({});

  /* ── Step 4: Documents ── */
  const [customerPhoto, setCustomerPhoto]       = useState<File | null>(null);
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState<string | null>(null);
  const [guarantorPhoto, setGuarantorPhoto]     = useState<File | null>(null);
  const [guarantorPhotoPreview, setGuarantorPhotoPreview] = useState<string | null>(null);
  const [billDocPhoto, setBillDocPhoto]         = useState<File | null>(null);
  const [billDocPhotoPreview, setBillDocPhotoPreview] = useState<string | null>(null);
  const [tazkiraDocPhoto, setTazkiraDocPhoto]   = useState<File | null>(null);
  const [tazkiraDocPhotoPreview, setTazkiraDocPhotoPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  /* ── Draft system ── */
  const [draftId, setDraftId]           = useState<string | null>(null);
  const [draftSaving, setDraftSaving]   = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      dailyRentInput,
      receivedAmount,
    },
  });

  const saveDraft = async (silent = true) => {
    if (!token) return;
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

  /* ─── Auto-save every 3s of inactivity ─── */
  useEffect(() => {
    if (!token) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(true), 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [step, selectedCarId, customer, guarantor, dailyRentInput, receivedAmount, token]);

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
      if (fd.selectedCarId) setSelectedCarId(fd.selectedCarId);
      if (fd.customer)      setCustomer(fd.customer);
      if (fd.guarantor)     setGuarantor(fd.guarantor);
      if (fd.dailyRentInput) setDailyRentInput(fd.dailyRentInput);
      if (fd.receivedAmount) setReceivedAmount(fd.receivedAmount);
      setShowDraftBanner(true);
    }).catch(() => {});
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
        let guarRes;
        if (guarantorPhoto) {
          const fd = new FormData();
          Object.entries({
            fullName: guarantor.fullName, fatherName: guarantor.fatherName,
            tazkiraNumber: guarantor.tazkiraNumber, phoneNumber: guarantor.phoneNumber,
            province: guarantor.province, district: guarantor.district,
            currentAddress: guarantor.currentAddress, relationship: guarantor.relationship,
            notes: guarantor.notes,
          }).forEach(([k, v]) => v && fd.append(k, v));
          fd.append('photo', guarantorPhoto);
          guarRes = await guarantorsAPI.create(fd);
        } else {
          guarRes = await guarantorsAPI.create({
            fullName: guarantor.fullName, fatherName: guarantor.fatherName,
            tazkiraNumber: guarantor.tazkiraNumber, phoneNumber: guarantor.phoneNumber,
            province: guarantor.province, district: guarantor.district,
            currentAddress: guarantor.currentAddress, relationship: guarantor.relationship,
            notes: guarantor.notes,
          });
        }
        guarantorId = guarRes.data.data.id;
      }

      /* 3 — Create contract */
      const startTime = customer.startTime || '00:00';
      const endTime   = customer.endTime   || '00:00';
      const advance   = received;

      const hasDocs = billDocPhoto || tazkiraDocPhoto;
      let contractRes;
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
        ...(guarantorId && { guarantorId }),
      };
      if (hasDocs) {
        const fd = new FormData();
        Object.entries(contractBase).forEach(([k, v]) => fd.append(k, String(v)));
        if (billDocPhoto)    fd.append('billDocPhoto',    billDocPhoto);
        if (tazkiraDocPhoto) fd.append('tazkiraDocPhoto', tazkiraDocPhoto);
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
        notes:                   customer.notes,
      };
      localStorage.setItem('lastOrderBill', JSON.stringify(billData));
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

  /* ─── Step definitions ─── */
  const steps = [
    { label: lang === 'dari' ? 'انتخاب موتر'    : 'موتر غوره کول',       icon: Car },
    { label: lang === 'dari' ? 'معلومات مشتری'  : 'د مشتري معلومات',    icon: User },
    { label: lang === 'dari' ? 'معلومات ضامن'   : 'د ضامن معلومات',     icon: Shield },
    { label: lang === 'dari' ? 'محاسبه مالی'    : 'مالي حساب',          icon: Receipt },
    { label: lang === 'dari' ? 'اسناد و تأیید'  : 'اسناد او تایید',     icon: FileImage },
  ];

  const fmtCur = (n: number) => `${formatNumber(n)} ${lang === 'dari' ? 'افغانی' : 'افغاني'}`;

  /* ═══ RENDER ═══ */
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Draft restored banner */}
        {showDraftBanner && (
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
              {lang === 'dari' ? 'سفارش موتر جدید' : 'نوی د موتر امر'}
            </h2>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-sm text-amber-600">
                {lang === 'dari' ? 'تمام مراحل را تکمیل کنید' : 'ټول مرحلې بشپړ کړئ'}
              </p>
              {/* Draft status */}
              {draftSaving ? (
                <span className="flex items-center gap-1 text-xs text-amber-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {lang === 'dari' ? 'در حال ذخیره...' : 'ذخیره کیږي...'}
                </span>
              ) : draftSavedAt ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {lang === 'dari' ? 'پیش‌نویس ذخیره شد' : 'مسوده خوندي شوه'}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                          <span className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow"
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

          {/* ═══ STEP 3: Billing ═══ */}
          {step === 3 && (
            <div className="space-y-5">
              <StepHeader icon={Receipt} title={lang === 'dari' ? 'محاسبه مالی' : 'مالي حساب'} gradient="linear-gradient(135deg,#059669,#047857)" />

              {/* Car + period summary */}
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-50 to-white">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-amber-100 shrink-0">🚗</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-900 truncate">{selectedCar?.carName} <span className="font-normal text-amber-600 text-sm">— {selectedCar?.plateNumber}</span></p>
                  <p className="text-xs text-amber-500 mt-0.5">{selectedCar?.model} · {selectedCar?.color}</p>
                </div>
                {rentalDays > 0 && (
                  <div className="shrink-0 text-center px-4 py-2 rounded-xl bg-amber-100 border border-amber-200">
                    <p className="text-xl font-extrabold text-amber-900">{rentalDays}</p>
                    <p className="text-xs text-amber-600">{lang === 'dari' ? 'روز' : 'ورځ'}</p>
                  </div>
                )}
              </div>

              {/* ── Main billing card ── */}
              <div className="rounded-2xl border-2 border-amber-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                  <Receipt className="w-4 h-4 text-white" />
                  <h4 className="font-bold text-white text-sm">{lang === 'dari' ? 'جزئیات مالی' : 'مالي جزئیات'}</h4>
                </div>

                <div className="p-5 space-y-5">

                  {/* ── Daily Rent Input (required, editable) ── */}
                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-2">
                      {lang === 'dari' ? 'کرایه روزانه' : 'ورځنۍ کرایه'}
                      <span className="text-red-500 mr-1">*</span>
                      <span className="text-xs font-normal text-amber-500 mr-2">
                        {lang === 'dari' ? '(می‌توانید تغییر دهید)' : '(بدلولی شئ)'}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        value={dailyRentInput}
                        onChange={numericInputHandler(setDailyRentInput)}
                        inputMode="numeric"
                        placeholder={lang === 'dari' ? '0' : '۰'}
                        className={`${billingErrors.dailyRent ? eInp : inp} pl-20 text-lg font-bold`}
                        style={{ direction: 'ltr', textAlign: 'right' }}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-amber-500 font-medium pointer-events-none">
                        {lang === 'dari' ? 'افغانی' : 'افغاني'}
                      </span>
                    </div>
                    {billingErrors.dailyRent && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 shrink-0" />{billingErrors.dailyRent}
                      </p>
                    )}
                    {billingErrors.dates && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3 shrink-0" />{billingErrors.dates}
                      </p>
                    )}
                  </div>

                  {/* ── Formula: rate × days = total ── */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl p-3 text-center border-2 border-amber-200 bg-amber-50">
                      <p className="text-xs text-amber-600 mb-1 font-medium">{lang === 'dari' ? 'کرایه روزانه' : 'ورځنۍ کرایه'}</p>
                      <p className="text-xl font-extrabold text-amber-900">{formatNumber(dailyRent)}</p>
                      <p className="text-xs text-amber-500">افغانی</p>
                    </div>

                    <div className="rounded-xl p-3 text-center border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                      <div>
                        <p className="text-2xl font-black text-gray-400">×</p>
                        <p className="text-xl font-extrabold text-gray-700">{rentalDays}</p>
                        <p className="text-xs text-gray-500">{lang === 'dari' ? 'روز' : 'ورځ'}</p>
                      </div>
                    </div>

                    <div className="rounded-xl p-3 text-center border-2 border-green-400 bg-green-50">
                      <p className="text-xs text-green-700 mb-1 font-bold">{lang === 'dari' ? 'مجموع کرایه' : 'ټوله کرایه'}</p>
                      <p className="text-xl font-extrabold text-green-800">{formatNumber(totalRent)}</p>
                      <p className="text-xs text-green-600">افغانی</p>
                    </div>
                  </div>

                  {/* ── Payment input + remaining ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-amber-900 mb-2">
                        {lang === 'dari' ? 'مبلغ دریافت شده' : 'ترلاسه شوی مبلغ'}
                        <span className="text-xs font-normal text-amber-500 mr-2">(افغانی)</span>
                      </label>
                      <div className="relative">
                        <input
                          value={receivedAmount}
                          onChange={numericInputHandler(setReceivedAmount)}
                          inputMode="numeric"
                          placeholder="0"
                          className={`${inp} pl-20 text-lg font-bold`}
                          style={{ direction: 'ltr', textAlign: 'right' }}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-amber-500 font-medium pointer-events-none">
                          {lang === 'dari' ? 'افغانی' : 'افغاني'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 justify-end">
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border-2 border-red-200">
                        <span className="text-sm text-red-700 font-semibold">{lang === 'dari' ? 'باقی مانده' : 'پاتې مبلغ'}</span>
                        <span className="text-lg font-extrabold text-red-700">{formatNumber(remaining)} <span className="text-xs font-normal">افغانی</span></span>
                      </div>
                    </div>
                  </div>

                  {/* ── Total summary banner ── */}
                  <div className="px-5 py-4 rounded-2xl border-2 border-green-300" style={{ background: 'linear-gradient(135deg,#d1fae5,#ecfdf5)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-bold text-green-800">{lang === 'dari' ? 'مجموع کل کرایه' : 'د کرایې ټول مجموع'}</span>
                      <span className="text-2xl font-black text-green-900">{formatNumber(totalRent)} <span className="text-sm font-normal text-green-700">افغانی</span></span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 border border-green-300 px-3 py-1.5 rounded-full font-semibold">
                        ✓ {lang === 'dari' ? 'دریافت شده:' : 'ترلاسه شوي:'} {formatNumber(received)} افغانی
                      </span>
                      {remaining > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-full font-semibold">
                          ◌ {lang === 'dari' ? 'باقی:' : 'پاتې:'} {formatNumber(remaining)} افغانی
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Revenue split 50/50 ── */}
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-px bg-amber-200" />
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider px-2">
                        {lang === 'dari' ? 'تقسیم درآمد' : 'عاید تقسیم'}
                      </span>
                      <div className="flex-1 h-px bg-amber-200" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Owner 50% */}
                      <div className="relative rounded-2xl overflow-hidden border-2 border-teal-200">
                        <div className="px-4 py-2 text-center" style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
                          <p className="text-xs font-bold text-white">{lang === 'dari' ? 'سهم صاحب موتر' : 'د موتر د خاوند برخه'}</p>
                        </div>
                        <div className="px-4 py-3 bg-teal-50 text-center">
                          <p className="text-2xl font-black text-teal-800">{formatNumber(ownerShare)}</p>
                          <p className="text-xs text-teal-600 mt-0.5">افغانی</p>
                          <span className="inline-block mt-2 text-xs bg-teal-100 text-teal-700 border border-teal-300 px-2 py-0.5 rounded-full font-bold">50%</span>
                        </div>
                      </div>

                      {/* Admin 50% */}
                      <div className="relative rounded-2xl overflow-hidden border-2 border-violet-200">
                        <div className="px-4 py-2 text-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                          <p className="text-xs font-bold text-white">{lang === 'dari' ? 'سهم ادمین' : 'د ادمین برخه'}</p>
                        </div>
                        <div className="px-4 py-3 bg-violet-50 text-center">
                          <p className="text-2xl font-black text-violet-800">{formatNumber(adminShare)}</p>
                          <p className="text-xs text-violet-600 mt-0.5">افغانی</p>
                          <span className="inline-block mt-2 text-xs bg-violet-100 text-violet-700 border border-violet-300 px-2 py-0.5 rounded-full font-bold">50%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Documents + Review ═══ */}
          {step === 4 && (
            <div className="space-y-6">
              <StepHeader icon={FileImage} title={lang === 'dari' ? 'آپلود اسناد' : 'د اسنادو پورته کول'} gradient="linear-gradient(135deg,#0891b2,#0e7490)" />

              {/* Document uploads */}
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
                  label={lang === 'dari' ? 'عکس ضامن' : 'د ضامن انځور'}
                  sublabel={lang === 'dari' ? 'در صورت وجود ضامن' : 'که چیرې ضامن وي'}
                  preview={guarantorPhotoPreview}
                  onFile={f => { setGuarantorPhoto(f); setGuarantorPhotoPreview(URL.createObjectURL(f)); }}
                  onClear={() => { setGuarantorPhoto(null); setGuarantorPhotoPreview(null); }}
                  color="#8b5cf6"
                />
                <DocSlot
                  label={lang === 'dari' ? 'عکس بل / قرارداد' : 'د بل / قرارداد انځور'}
                  sublabel={lang === 'dari' ? 'عکس از بل چاپ شده' : 'د چاپ شوي بل انځور'}
                  preview={billDocPhotoPreview}
                  onFile={f => { setBillDocPhoto(f); setBillDocPhotoPreview(URL.createObjectURL(f)); }}
                  onClear={() => { setBillDocPhoto(null); setBillDocPhotoPreview(null); }}
                  color="#059669"
                />
                <DocSlot
                  label={lang === 'dari' ? 'عکس تذکره / هویت' : 'د تذکرې / هویت انځور'}
                  sublabel={lang === 'dari' ? 'تصویر تذکره مشتری' : 'د مشتري د تذکرې انځور'}
                  preview={tazkiraDocPhotoPreview}
                  onFile={f => { setTazkiraDocPhoto(f); setTazkiraDocPhotoPreview(URL.createObjectURL(f)); }}
                  onClear={() => { setTazkiraDocPhoto(null); setTazkiraDocPhotoPreview(null); }}
                  color="#dc2626"
                />
              </div>

              {/* Final review summary */}
              <div className="border-t-2 border-amber-200 pt-5">
                <h4 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {lang === 'dari' ? 'بررسی نهایی سفارش' : 'د سفارش وروستۍ بیاکتنه'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border-2 border-amber-100 bg-amber-50 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-amber-800 text-sm">{lang === 'dari' ? 'موتر' : 'موتر'}</span>
                    </div>
                    <p className="font-bold text-amber-900 text-sm">{selectedCar?.carName}</p>
                    <p className="text-xs text-amber-600">{selectedCar?.plateNumber}</p>
                    <p className="text-xs text-amber-600">{customer.startDate} ← {customer.endDate}</p>
                    <p className="text-sm font-bold text-green-700">{fmtCur(totalRent)}</p>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-blue-800 text-sm">{lang === 'dari' ? 'مشتری' : 'مشتری'}</span>
                    </div>
                    <p className="font-bold text-blue-900 text-sm">{customer.fullName || '—'}</p>
                    <p className="text-xs text-blue-600">{customer.phoneNumber}</p>
                    <p className="text-xs text-blue-600">{lang === 'dari' ? 'پرداخت:' : 'تادیه:'} {fmtCur(received)}</p>
                    <p className="text-xs text-red-600">{lang === 'dari' ? 'باقی:' : 'پاتې:'} {fmtCur(remaining)}</p>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-purple-100 bg-purple-50 space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-purple-800 text-sm">{lang === 'dari' ? 'ضامن' : 'ضامن'}</span>
                    </div>
                    {guarantor.fullName ? (
                      <>
                        <p className="font-bold text-purple-900 text-sm">{guarantor.fullName}</p>
                        <p className="text-xs text-purple-600">{guarantor.phoneNumber}</p>
                      </>
                    ) : (
                      <p className="text-purple-400 text-sm">{lang === 'dari' ? 'ضامن ثبت نشده' : 'ضامن نشته'}</p>
                    )}
                  </div>
                </div>
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

            {step < 4 ? (
              <button
                onClick={() => {
                  if (step === 0 && !validateStep0()) return;
                  if (step === 1 && !validateStep1()) return;
                  if (step === 3 && !validateStep3()) return;
                  goStep(step + 1);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
              >
                {t.next}<ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                style={{ background: saving ? '#9ca3af' : 'linear-gradient(135deg,#059669,#047857)' }}
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t.loading}</>
                ) : (
                  <><Check className="w-4 h-4" />{lang === 'dari' ? 'ثبت و چاپ بل' : 'ثبت او چاپ بل'}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
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
