'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/lib/context';
import { carsAPI, customersAPI, guarantorsAPI, contractsAPI } from '@/lib/api';
import {
  Car, User, Shield, Check, ChevronLeft, ChevronRight,
  Search, X, AlertCircle, CheckCircle2, Camera,
} from 'lucide-react';
import { useRef } from 'react';
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
  startDate: '', startTime: '', endDate: '', endTime: '', paymentAmount: '',
};

const initGuarantor = {
  fullName: '', fatherName: '', tazkiraNumber: '', phoneNumber: '',
  province: '', district: '', currentAddress: '',
  relationship: '', notes: '',
};

/* ─── helpers ─── */
const inp = 'w-full px-3 py-2.5 rounded-lg border-2 border-amber-200 bg-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all';
const errInp = 'w-full px-3 py-2.5 rounded-lg border-2 border-red-400 bg-red-50 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all';
const lbl = 'block text-xs font-semibold text-amber-800 mb-1';

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </p>
  );
}

function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={lbl}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      <FieldErr msg={error} />
    </div>
  );
}

/* ─── STATUS styles ─── */
const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  AVAILABLE: { text: 'موجود', cls: 'bg-green-100 text-green-700 border-green-300' },
  RENTED: { text: 'کرایه شده', cls: 'bg-red-100 text-red-600 border-red-300' },
  MAINTENANCE: { text: 'تعمیر', cls: 'bg-orange-100 text-orange-600 border-orange-300' },
};

/* ═══════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════ */
export default function OrderNewPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  // Car step
  const [cars, setCars] = useState<CarItem[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCarId, setSelectedCarId] = useState('');

  // Customer step
  const [customer, setCustomer] = useState(initCustomer);
  const [customerErrors, setCustomerErrors] = useState<FormErrors>({});

  // Guarantor step
  const [guarantor, setGuarantor] = useState(initGuarantor);
  const [guarantorErrors, setGuarantorErrors] = useState<FormErrors>({});

  const [saving, setSaving] = useState(false);

  // Photo uploads
  const customerPhotoRef = useRef<HTMLInputElement>(null);
  const guarantorPhotoRef = useRef<HTMLInputElement>(null);
  const [customerPhoto, setCustomerPhoto] = useState<File | null>(null);
  const [customerPhotoPreview, setCustomerPhotoPreview] = useState<string | null>(null);
  const [guarantorPhoto, setGuarantorPhoto] = useState<File | null>(null);
  const [guarantorPhotoPreview, setGuarantorPhotoPreview] = useState<string | null>(null);

  useEffect(() => { if (!token) router.push('/'); }, [token]);

  useEffect(() => {
    if (token) {
      carsAPI.getAll()
        .then(r => setCars(r.data.data || []))
        .catch(() => toast.error('خطا در بارگذاری موترها'))
        .finally(() => setCarsLoading(false));
    }
  }, [token]);

  /* ─── Derived values ─── */
  const selectedCar = useMemo(() => cars.find(c => c.id === selectedCarId), [cars, selectedCarId]);

  const rentalDays = useMemo(() => {
    if (!customer.startDate || !customer.endDate) return 0;
    const d = Math.ceil(
      (new Date(customer.endDate).getTime() - new Date(customer.startDate).getTime()) / 86400000
    );
    return d > 0 ? d : 0;
  }, [customer.startDate, customer.endDate]);

  const totalRent = useMemo(
    () => (selectedCar?.dailyRate || 0) * rentalDays,
    [selectedCar, rentalDays]
  );

  const remaining = useMemo(
    () => totalRent - (parseFloat(customer.paymentAmount) || 0),
    [totalRent, customer.paymentAmount]
  );

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

  /* ─── Step navigation with animation ─── */
  const goStep = (next: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 200);
  };

  /* ─── Validation ─── */
  const validateCustomer = (): boolean => {
    const e: FormErrors = {};
    if (!customer.fullName.trim()) e.fullName = 'نام و تخلص الزامی است';
    if (!customer.fatherName.trim()) e.fatherName = 'نام پدر الزامی است';
    if (!customer.phoneNumber.trim()) e.phoneNumber = 'شماره تلفن الزامی است';
    if (!customer.startDate) e.startDate = 'تاریخ شروع الزامی است';
    if (!customer.endDate) e.endDate = 'تاریخ ختم الزامی است';
    if (customer.startDate && customer.endDate && customer.endDate <= customer.startDate)
      e.endDate = 'تاریخ ختم باید بعد از تاریخ شروع باشد';
    setCustomerErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = (): boolean => {
    if (!selectedCarId) { toast.error('لطفاً یک موتر انتخاب کنید'); return false; }
    return true;
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Build customer payload (FormData if photo selected, JSON otherwise)
      let custRes;
      if (customerPhoto) {
        const fd = new FormData();
        fd.append('fullName', customer.fullName);
        fd.append('fatherName', customer.fatherName);
        fd.append('tazkiraNumber', customer.tazkiraNumber);
        fd.append('phoneNumber', customer.phoneNumber);
        fd.append('province', customer.province);
        fd.append('district', customer.district);
        fd.append('village', customer.village);
        fd.append('currentAddress', customer.currentAddress);
        fd.append('occupation', customer.occupation);
        fd.append('notes', customer.notes);
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

      // Create guarantor (optional)
      let guarantorId: string | undefined;
      if (guarantor.fullName.trim()) {
        if (guarantorPhoto) {
          const fd = new FormData();
          fd.append('fullName', guarantor.fullName);
          fd.append('fatherName', guarantor.fatherName);
          fd.append('tazkiraNumber', guarantor.tazkiraNumber);
          fd.append('phoneNumber', guarantor.phoneNumber);
          fd.append('province', guarantor.province);
          fd.append('district', guarantor.district);
          fd.append('currentAddress', guarantor.currentAddress);
          fd.append('relationship', guarantor.relationship);
          fd.append('notes', guarantor.notes);
          fd.append('photo', guarantorPhoto);
          const guarRes = await guarantorsAPI.create(fd);
          guarantorId = guarRes.data.data.id;
        } else {
          const guarRes = await guarantorsAPI.create({
            fullName: guarantor.fullName, fatherName: guarantor.fatherName,
            tazkiraNumber: guarantor.tazkiraNumber, phoneNumber: guarantor.phoneNumber,
            province: guarantor.province, district: guarantor.district,
            currentAddress: guarantor.currentAddress, relationship: guarantor.relationship,
            notes: guarantor.notes,
          });
          guarantorId = guarRes.data.data.id;
        }
      }

      // Create contract
      const advance = parseFloat(customer.paymentAmount) || 0;
      const startTime = customer.startTime || '00:00';
      const endTime   = customer.endTime   || '00:00';
      const contractRes = await contractsAPI.create({
        carId: selectedCarId,
        customerId,
        guarantorId,
        startDate: new Date(customer.startDate).toISOString(),
        startTime,
        endDate: new Date(customer.endDate).toISOString(),
        endTime,
        rentPrice: selectedCar?.dailyRate || 0,
        totalRent,
        advancePayment: advance,
        remainingAmount: Math.max(0, remaining),
        carStatus: 'خوب',
        agreementConfirmed: true,
        notes: customer.notes,
      });

      const contract = contractRes.data.data;

      // Prepare bill data and store in localStorage
      const billData = {
        contractNumber: contract.contractNumber,
        carName: selectedCar?.carName || '',
        model: selectedCar?.model || '',
        color: selectedCar?.color || '',
        plateNumber: selectedCar?.plateNumber || '',
        dailyRate: selectedCar?.dailyRate || 0,
        totalRent,
        advancePayment: advance,
        remainingAmount: Math.max(0, remaining),
        startDate: customer.startDate,
        startTime: customer.startTime || '00:00',
        endDate: customer.endDate,
        endTime: customer.endTime || '00:00',
        customerFullName: customer.fullName,
        customerFatherName: customer.fatherName,
        customerDistrict: customer.district,
        customerVillage: customer.village,
        customerProvince: customer.province,
        customerCurrentAddress: customer.currentAddress,
        customerTazkira: customer.tazkiraNumber,
        customerPhone: customer.phoneNumber,
        guarantorFullName: guarantor.fullName,
        guarantorFatherName: guarantor.fatherName,
        guarantorDistrict: guarantor.district,
        guarantorVillage: guarantor.district,
        guarantorProvince: guarantor.province,
        guarantorCurrentAddress: guarantor.currentAddress,
        guarantorTazkira: guarantor.tazkiraNumber,
        guarantorPhone: guarantor.phoneNumber,
        notes: customer.notes,
      };

      localStorage.setItem('lastOrderBill', JSON.stringify(billData));
      toast.success(t.orderSaved as string || 'سفارش ثبت شد!');
      router.push('/orders/print');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Step definitions ─── */
  const steps = [
    { label: lang === 'dari' ? 'انتخاب موتر' : 'موتر غوره کول', icon: Car },
    { label: lang === 'dari' ? 'معلومات مشتری' : 'د مشتري معلومات', icon: User },
    { label: lang === 'dari' ? 'معلومات ضامن' : 'د ضامن معلومات', icon: Shield },
  ];

  /* ═══ RENDER ═══ */
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-amber-900">
              {lang === 'dari' ? 'سفارش موتر جدید' : 'نوی د موتر امر'}
            </h2>
            <p className="text-sm text-amber-600 mt-0.5">
              {lang === 'dari' ? 'تمام مراحل را تکمیل کنید' : 'ټول مرحلې بشپړ کړئ'}
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-secondary px-4 py-2 rounded-xl text-sm"
          >
            {t.back}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center flex-1">
                <button
                  onClick={() => done && goStep(i)}
                  disabled={!done}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full justify-center
                    ${done ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700 shadow-md'
                      : active ? 'text-white shadow-lg cursor-default'
                      : 'bg-amber-100 text-amber-400 cursor-default'}`}
                  style={active ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)' } : {}}
                >
                  {done
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <s.icon className="w-4 h-4 shrink-0" />}
                  <span className="hidden sm:block">{s.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-1 rounded-full transition-all ${i < step ? 'bg-green-400' : 'bg-amber-100'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div
          className={`card-golden rounded-2xl p-6 transition-all duration-200 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
          style={{ transform: animating ? 'translateY(8px)' : 'translateY(0)' }}
        >

          {/* ═══ STEP 1: Car Selection ═══ */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                  <Car className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-amber-900">
                  {lang === 'dari' ? 'موتر مورد نظر را انتخاب کنید' : 'خپل موتر وټاکئ'}
                </h3>
              </div>

              {/* Search + filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={lang === 'dari' ? 'جستجوی موتر...' : 'موتر لټول...'}
                    className={`${inp} pr-9`}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {[
                    { key: 'ALL', label: lang === 'dari' ? 'همه' : 'ټول' },
                    { key: 'AVAILABLE', label: lang === 'dari' ? 'موجود' : 'موجود' },
                    { key: 'RENTED', label: lang === 'dari' ? 'کرایه شده' : 'کرایه' },
                    { key: 'MAINTENANCE', label: lang === 'dari' ? 'تعمیر' : 'ترمیم' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        statusFilter === f.key
                          ? 'bg-amber-500 text-white border-amber-500 shadow'
                          : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Car grid */}
              {carsLoading ? (
                <div className="text-center py-12 text-amber-500">
                  <div className="animate-spin w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full mx-auto mb-3" />
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
                    const statusInfo = STATUS_LABEL[car.status] || { text: car.status, cls: 'bg-gray-100 text-gray-600 border-gray-300' };
                    return (
                      <button
                        key={car.id}
                        onClick={() => setSelectedCarId(car.id)}
                        className={`relative text-right rounded-xl border-2 p-4 transition-all duration-200 shadow-sm hover:shadow-md
                          ${sel
                            ? 'border-amber-500 bg-amber-50 shadow-amber-200 shadow-md'
                            : 'border-amber-100 bg-white hover:border-amber-300'
                          }`}
                      >
                        {/* Selection check */}
                        {sel && (
                          <span className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow"
                            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}

                        {/* Car icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto transition-all
                          ${sel ? 'bg-amber-100' : 'bg-amber-50'}`}>
                          <span className="text-2xl">🚗</span>
                        </div>

                        {/* Car name */}
                        <h4 className="font-bold text-amber-900 text-sm mb-1 truncate">{car.carName}</h4>

                        {/* Info pills */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{car.model}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{car.color}</span>
                        </div>

                        {/* Plate */}
                        <div className="text-xs text-amber-600 font-mono mb-2 bg-amber-50 px-2 py-1 rounded text-center">
                          {car.plateNumber}
                        </div>

                        {/* Rate + status */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-amber-800">
                            {Number(car.dailyRate).toLocaleString()}
                            <span className="text-xs font-normal text-amber-500 mr-1">افغانی/روز</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusInfo.cls}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected car summary */}
              {selectedCar && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 border-2 border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-green-800">
                      {lang === 'dari' ? 'موتر انتخاب شد:' : 'موتر وټاکل شو:'} {selectedCar.carName}
                    </p>
                    <p className="text-sm text-green-600">
                      {selectedCar.model} — {selectedCar.plateNumber} — {Number(selectedCar.dailyRate).toLocaleString()} افغانی/روز
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2: Customer Info ═══ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-amber-900">
                  {lang === 'dari' ? 'معلومات مشتری' : 'د مشتري معلومات'}
                </h3>
              </div>

              {/* Customer photo */}
              <div className="flex items-center gap-4 p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="relative shrink-0">
                  {customerPhotoPreview ? (
                    <img src={customerPhotoPreview} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-amber-300 shadow" />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-amber-300 bg-white">
                      <Camera className="w-6 h-6 text-amber-400" />
                    </div>
                  )}
                  {customerPhotoPreview && (
                    <button onClick={() => { setCustomerPhoto(null); setCustomerPhotoPreview(null); if (customerPhotoRef.current) customerPhotoRef.current.value = ''; }}
                      className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1">{lang === 'dari' ? 'عکس مشتری (اختیاری)' : 'د مشتري انځور (اختیاري)'}</p>
                  <input ref={customerPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) { setCustomerPhoto(f); setCustomerPhotoPreview(URL.createObjectURL(f)); } }} className="hidden" />
                  <button onClick={() => customerPhotoRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-xs hover:bg-amber-100 transition-colors">
                    <Camera className="w-3.5 h-3.5" />{customerPhotoPreview ? (lang === 'dari' ? 'تغییر عکس' : 'انځور بدل کړئ') : (lang === 'dari' ? 'آپلود عکس' : 'انځور پورته کړئ')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label={t.fullName} required error={customerErrors.fullName}>
                  <input
                    value={customer.fullName}
                    onChange={e => setCustomer(p => ({ ...p, fullName: e.target.value }))}
                    className={customerErrors.fullName ? errInp : inp}
                  />
                </Field>
                <Field label={t.fatherName} required error={customerErrors.fatherName}>
                  <input
                    value={customer.fatherName}
                    onChange={e => setCustomer(p => ({ ...p, fatherName: e.target.value }))}
                    className={customerErrors.fatherName ? errInp : inp}
                  />
                </Field>
                <Field label={t.tazkiraNumber}>
                  <input
                    value={customer.tazkiraNumber}
                    onChange={e => setCustomer(p => ({ ...p, tazkiraNumber: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.phone} required error={customerErrors.phoneNumber}>
                  <input
                    value={customer.phoneNumber}
                    onChange={e => setCustomer(p => ({ ...p, phoneNumber: e.target.value }))}
                    className={customerErrors.phoneNumber ? errInp : inp}
                    dir="ltr"
                  />
                </Field>
                <Field label={lang === 'dari' ? 'شماره تلفن دوم' : 'دویم تلیفون'}>
                  <input
                    value={customer.altPhone}
                    onChange={e => setCustomer(p => ({ ...p, altPhone: e.target.value }))}
                    className={inp}
                    dir="ltr"
                  />
                </Field>
                <Field label={t.occupation}>
                  <input
                    value={customer.occupation}
                    onChange={e => setCustomer(p => ({ ...p, occupation: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.province}>
                  <input
                    value={customer.province}
                    onChange={e => setCustomer(p => ({ ...p, province: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.district}>
                  <input
                    value={customer.district}
                    onChange={e => setCustomer(p => ({ ...p, district: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.village}>
                  <input
                    value={customer.village}
                    onChange={e => setCustomer(p => ({ ...p, village: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label={t.currentAddress}>
                    <input
                      value={customer.currentAddress}
                      onChange={e => setCustomer(p => ({ ...p, currentAddress: e.target.value }))}
                      className={inp}
                    />
                  </Field>
                </div>
              </div>

              {/* Dates + payment */}
              <div className="border-t border-amber-200 pt-4">
                <h4 className="text-sm font-bold text-amber-800 mb-3">
                  {lang === 'dari' ? 'جزئیات کرایه' : 'د کرایې جزئیات'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Field label={t.startDate} required error={customerErrors.startDate}>
                    <input type="date" value={customer.startDate} onChange={e => setCustomer(p => ({ ...p, startDate: e.target.value }))} className={customerErrors.startDate ? errInp : inp} />
                    <input type="time" value={customer.startTime} onChange={e => setCustomer(p => ({ ...p, startTime: e.target.value }))} className={`${inp} mt-1.5`} placeholder="00:00" />
                  </Field>
                  <Field label={t.endDate} required error={customerErrors.endDate}>
                    <input type="date" value={customer.endDate} onChange={e => setCustomer(p => ({ ...p, endDate: e.target.value }))} className={customerErrors.endDate ? errInp : inp} />
                    <input type="time" value={customer.endTime} onChange={e => setCustomer(p => ({ ...p, endTime: e.target.value }))} className={`${inp} mt-1.5`} placeholder="00:00" />
                  </Field>
                  <Field label={lang === 'dari' ? 'مبلغ پرداختی (افغانی)' : 'د تادیي مبلغ'}>
                    <input
                      type="number"
                      value={customer.paymentAmount}
                      onChange={e => setCustomer(p => ({ ...p, paymentAmount: e.target.value }))}
                      className={inp}
                      placeholder="0"
                    />
                  </Field>
                  <div>
                    <label className={lbl}>{lang === 'dari' ? 'خلاصه مالی' : 'مالي لنډیز'}</label>
                    <div className="p-2.5 rounded-lg bg-amber-50 border-2 border-amber-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-amber-600">{t.rentPrice}:</span>
                        <span className="font-bold text-amber-800">{Number(selectedCar?.dailyRate || 0).toLocaleString()} ×{rentalDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-600">{t.totalRent}:</span>
                        <span className="font-bold text-green-700">{totalRent.toLocaleString()} افغانی</span>
                      </div>
                      <div className="flex justify-between border-t border-amber-200 pt-1">
                        <span className="text-amber-600">{t.remainingAmount}:</span>
                        <span className="font-bold text-red-700">{Math.max(0, remaining).toLocaleString()} افغانی</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Field label={t.notes}>
                <textarea
                  value={customer.notes}
                  onChange={e => setCustomer(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className={`${inp} resize-none`}
                />
              </Field>
            </div>
          )}

          {/* ═══ STEP 3: Guarantor + Review ═══ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow"
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-amber-900">
                  {lang === 'dari' ? 'معلومات ضامن (اختیاری)' : 'د ضامن معلومات (اختیاري)'}
                </h3>
              </div>

              {/* Guarantor photo */}
              <div className="flex items-center gap-4 p-3 rounded-xl border border-purple-200 bg-purple-50/50">
                <div className="relative shrink-0">
                  {guarantorPhotoPreview ? (
                    <img src={guarantorPhotoPreview} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-purple-300 shadow" />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-purple-300 bg-white">
                      <Camera className="w-6 h-6 text-purple-400" />
                    </div>
                  )}
                  {guarantorPhotoPreview && (
                    <button onClick={() => { setGuarantorPhoto(null); setGuarantorPhotoPreview(null); if (guarantorPhotoRef.current) guarantorPhotoRef.current.value = ''; }}
                      className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-800 mb-1">{lang === 'dari' ? 'عکس ضامن (اختیاری)' : 'د ضامن انځور (اختیاري)'}</p>
                  <input ref={guarantorPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) { setGuarantorPhoto(f); setGuarantorPhotoPreview(URL.createObjectURL(f)); } }} className="hidden" />
                  <button onClick={() => guarantorPhotoRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 text-xs hover:bg-purple-100 transition-colors">
                    <Camera className="w-3.5 h-3.5" />{guarantorPhotoPreview ? (lang === 'dari' ? 'تغییر عکس' : 'انځور بدل کړئ') : (lang === 'dari' ? 'آپلود عکس' : 'انځور پورته کړئ')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label={t.fullName}>
                  <input
                    value={guarantor.fullName}
                    onChange={e => setGuarantor(p => ({ ...p, fullName: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.fatherName}>
                  <input
                    value={guarantor.fatherName}
                    onChange={e => setGuarantor(p => ({ ...p, fatherName: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.tazkiraNumber}>
                  <input
                    value={guarantor.tazkiraNumber}
                    onChange={e => setGuarantor(p => ({ ...p, tazkiraNumber: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.phone}>
                  <input
                    value={guarantor.phoneNumber}
                    onChange={e => setGuarantor(p => ({ ...p, phoneNumber: e.target.value }))}
                    className={inp}
                    dir="ltr"
                  />
                </Field>
                <Field label={t.province}>
                  <input
                    value={guarantor.province}
                    onChange={e => setGuarantor(p => ({ ...p, province: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.district}>
                  <input
                    value={guarantor.district}
                    onChange={e => setGuarantor(p => ({ ...p, district: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <Field label={t.relationship}>
                  <input
                    value={guarantor.relationship}
                    onChange={e => setGuarantor(p => ({ ...p, relationship: e.target.value }))}
                    className={inp}
                    placeholder={lang === 'dari' ? 'مثلاً: برادر، پدر...' : 'مثلاً: وروڼه، پلار...'}
                  />
                </Field>
                <Field label={t.currentAddress}>
                  <input
                    value={guarantor.currentAddress}
                    onChange={e => setGuarantor(p => ({ ...p, currentAddress: e.target.value }))}
                    className={inp}
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field label={t.notes}>
                    <textarea
                      value={guarantor.notes}
                      onChange={e => setGuarantor(p => ({ ...p, notes: e.target.value }))}
                      rows={2}
                      className={`${inp} resize-none`}
                    />
                  </Field>
                </div>
              </div>

              {/* ─── Order Review ─── */}
              <div className="border-t-2 border-amber-200 pt-4">
                <h4 className="text-base font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  {lang === 'dari' ? 'بررسی نهایی سفارش' : 'د امر وروستۍ بیاکتنه'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Car */}
                  <div className="p-4 rounded-xl border-2 border-amber-100 bg-amber-50 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-4 h-4 text-amber-600" />
                      <span className="font-bold text-amber-800 text-sm">
                        {lang === 'dari' ? 'موتر انتخابی' : 'غوره شوی موتر'}
                      </span>
                    </div>
                    {selectedCar ? (
                      <>
                        <p className="font-bold text-amber-900">{selectedCar.carName}</p>
                        <p className="text-xs text-amber-600">{selectedCar.model} — {selectedCar.color}</p>
                        <p className="text-xs font-mono text-amber-700">{selectedCar.plateNumber}</p>
                        <p className="text-sm font-bold text-green-700">{totalRent.toLocaleString()} افغانی</p>
                        <p className="text-xs text-amber-600">({rentalDays} {lang === 'dari' ? 'روز' : 'ورځ'})</p>
                      </>
                    ) : <p className="text-amber-400 text-sm">—</p>}
                  </div>

                  {/* Customer */}
                  <div className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-blue-800 text-sm">{t.customerInfo}</span>
                    </div>
                    <p className="font-bold text-blue-900">{customer.fullName || '—'}</p>
                    <p className="text-xs text-blue-600">{customer.phoneNumber}</p>
                    <p className="text-xs text-blue-600">{customer.startDate} → {customer.endDate}</p>
                    <p className="text-xs text-blue-600">
                      {lang === 'dari' ? 'پرداخت:' : 'تادیه:'} {Number(customer.paymentAmount || 0).toLocaleString()} افغانی
                    </p>
                  </div>

                  {/* Guarantor */}
                  <div className="p-4 rounded-xl border-2 border-purple-100 bg-purple-50 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-purple-800 text-sm">{t.guarantorInfo}</span>
                    </div>
                    {guarantor.fullName ? (
                      <>
                        <p className="font-bold text-purple-900">{guarantor.fullName}</p>
                        <p className="text-xs text-purple-600">{guarantor.phoneNumber}</p>
                        <p className="text-xs text-purple-600">{guarantor.relationship}</p>
                      </>
                    ) : (
                      <p className="text-purple-400 text-sm">
                        {lang === 'dari' ? 'ضامن ثبت نشده' : 'ضامن نشته'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── Navigation buttons ─── */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t-2 border-amber-100 gap-3">
            {step > 0 ? (
              <button
                onClick={() => goStep(step - 1)}
                className="flex items-center gap-2 px-5 py-2.5 btn-secondary rounded-xl text-sm font-semibold"
              >
                <ChevronRight className="w-4 h-4" />
                {t.previous}
              </button>
            ) : <div />}

            {step < 2 ? (
              <button
                onClick={() => {
                  if (step === 0 && !validateStep1()) return;
                  if (step === 1 && !validateCustomer()) return;
                  goStep(step + 1);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
              >
                {t.next}
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: saving ? '#9ca3af' : 'linear-gradient(135deg,#059669,#047857)' }}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t.loading}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {lang === 'dari' ? 'ثبت و چاپ بل' : 'ثبت او چاپ بل'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
