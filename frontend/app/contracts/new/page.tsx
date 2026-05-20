'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { useApp } from '@/lib/context';
import { carsAPI, customersAPI, guarantorsAPI, contractsAPI } from '@/lib/api';
import { Check, ChevronLeft, ChevronRight, Car, User, Shield, FileText, ClipboardCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ContractBill from '@/components/ContractBill';
import { toEnglishNums, parseNum } from '@/lib/utils';

const steps = [
  { key: 'carInfo', icon: Car },
  { key: 'customerInfo', icon: User },
  { key: 'guarantorInfo', icon: Shield },
  { key: 'conditions', icon: FileText },
  { key: 'review', icon: ClipboardCheck },
];

const inputCls = "w-full px-3 py-2 rounded-lg input-golden text-sm";
const labelCls = "block text-sm font-medium text-amber-800 mb-1";

const initialData = {
  // Step 1
  carId:'', startDate:'', startTime:'', endDate:'', endTime:'', rentPrice:0, totalRent:0, advancePayment:0, remainingAmount:0, carStatus:'خوب', notes:'',
  // Step 2
  customerId:'', newCustomer:false,
  customerFullName:'', customerFatherName:'', customerGrandfatherName:'', customerTazkira:'', customerProvince:'', customerDistrict:'', customerVillage:'', customerCurrentAddress:'', customerPermanentAddress:'', customerPhone:'', customerOccupation:'', customerNotes:'',
  // Step 3
  guarantorId:'', newGuarantor:false,
  guarantorFullName:'', guarantorFatherName:'', guarantorGrandfatherName:'', guarantorTazkira:'', guarantorProvince:'', guarantorDistrict:'', guarantorVillage:'', guarantorCurrentAddress:'', guarantorPermanentAddress:'', guarantorPhone:'', guarantorRelationship:'', guarantorNotes:'',
  // Step 4
  conditions:'', agreementConfirmed:false, customerSignature:'', guarantorSignature:'', managerSignature:'',
};

export default function NewContractPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [cars, setCars] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [guarantors, setGuarantors] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => { if (!token) router.push('/'); }, [token]);
  useEffect(() => {
    if (token) {
      carsAPI.getAll({ status: 'AVAILABLE' }).then(r => setCars(r.data.data)).catch(console.error);
      customersAPI.getAll().then(r => setCustomers(r.data.data)).catch(console.error);
      guarantorsAPI.getAll().then(r => setGuarantors(r.data.data)).catch(console.error);
    }
  }, [token]);

  const set = (k: keyof typeof data) => (e: any) => {
    let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    // Convert Persian/Dari digits to English for numeric fields
    if (['rentPrice','advancePayment'].includes(k as string) && typeof val === 'string') {
      val = toEnglishNums(val).replace(/[^0-9.]/g, '');
    }
    setData(prev => {
      const next = { ...prev, [k]: val };
      // Auto-calculate total and remaining
      if (['rentPrice','startDate','endDate','advancePayment'].includes(k as string)) {
        const price = parseNum(k === 'rentPrice' ? val : prev.rentPrice);
        const start = new Date(k === 'startDate' ? val : prev.startDate);
        const end   = new Date(k === 'endDate'   ? val : prev.endDate);
        if (start && end && end > start) {
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          next.totalRent = price * days;
          const adv = parseNum(k === 'advancePayment' ? val : prev.advancePayment);
          next.remainingAmount = next.totalRent - adv;
        }
      }
      if (k === 'advancePayment') {
        next.remainingAmount = (next.totalRent as number) - (parseNum(val) || 0);
      }
      return next;
    });
  };

  const defaultConditions = `۱. ${t.condition1}\n۲. ${t.condition2}\n۳. ${t.condition3}\n۴. ${t.condition4}\n۵. ${t.condition5}\n۶. ${t.condition6}`;

  const handleSubmit = async () => {
    if (!data.agreementConfirmed) return toast.error('لطفاً شرایط قرارداد را تأیید کنید');
    setSaving(true);
    try {
      let customerId = data.customerId;
      let guarantorId = data.guarantorId || undefined;

      if (data.newCustomer || !customerId) {
        const cr = await customersAPI.create({ fullName:data.customerFullName, fatherName:data.customerFatherName, grandfatherName:data.customerGrandfatherName, tazkiraNumber:data.customerTazkira, province:data.customerProvince, district:data.customerDistrict, village:data.customerVillage, currentAddress:data.customerCurrentAddress, permanentAddress:data.customerPermanentAddress, phoneNumber:data.customerPhone, occupation:data.customerOccupation, notes:data.customerNotes });
        customerId = cr.data.data.id;
      }

      if (data.newGuarantor || (data.guarantorFullName && !guarantorId)) {
        const gr = await guarantorsAPI.create({ fullName:data.guarantorFullName, fatherName:data.guarantorFatherName, grandfatherName:data.guarantorGrandfatherName, tazkiraNumber:data.guarantorTazkira, province:data.guarantorProvince, district:data.guarantorDistrict, village:data.guarantorVillage, currentAddress:data.guarantorCurrentAddress, permanentAddress:data.guarantorPermanentAddress, phoneNumber:data.guarantorPhone, relationship:data.guarantorRelationship, notes:data.guarantorNotes });
        guarantorId = gr.data.data.id;
      }

      const contractData = {
        carId: data.carId, customerId, guarantorId,
        startDate: new Date(data.startDate).toISOString(),
        startTime: data.startTime, endDate: new Date(data.endDate).toISOString(), endTime: data.endTime,
        rentPrice: parseNum(data.rentPrice), totalRent: parseNum(data.totalRent),
        advancePayment: parseNum(data.advancePayment) || 0,
        remainingAmount: parseNum(data.remainingAmount),
        carStatus: data.carStatus, conditions: data.conditions || defaultConditions,
        agreementConfirmed: data.agreementConfirmed, customerSignature: data.customerSignature,
        guarantorSignature: data.guarantorSignature, managerSignature: data.managerSignature, notes: data.notes,
      };

      const res = await contractsAPI.create(contractData);
      setSuccess(res.data.data);
      toast.success(t.contractSaved);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t.error);
    } finally { setSaving(false); }
  };

  if (success) {
    const billData = {
      contractNumber: success.contractNumber,
      // Car info from the saved contract
      carName: success.car?.carName || data.carId,
      model: success.car?.model || '',
      color: success.car?.color || '',
      plateNumber: success.car?.plateNumber || '',
      dailyRate: success.car?.dailyRate ?? data.rentPrice,
      totalRent: data.totalRent,
      advancePayment: data.advancePayment,
      remainingAmount: data.remainingAmount,
      startDate: data.startDate,
      startTime: data.startTime,
      endDate: data.endDate,
      endTime: data.endTime,
      carStatus: data.carStatus,
      // Customer
      customerFullName: success.customer?.fullName || data.customerFullName,
      customerFatherName: success.customer?.fatherName || data.customerFatherName,
      customerDistrict: success.customer?.district || data.customerDistrict,
      customerVillage: success.customer?.village || data.customerVillage,
      customerProvince: success.customer?.province || data.customerProvince,
      customerCurrentAddress: success.customer?.currentAddress || data.customerCurrentAddress,
      customerTazkira: success.customer?.tazkiraNumber || data.customerTazkira,
      customerPhone: success.customer?.phoneNumber || data.customerPhone,
      // Guarantor
      guarantorFullName: success.guarantor?.fullName || data.guarantorFullName,
      guarantorFatherName: success.guarantor?.fatherName || data.guarantorFatherName,
      guarantorDistrict: success.guarantor?.district || data.guarantorDistrict,
      guarantorVillage: success.guarantor?.village || data.guarantorVillage,
      guarantorProvince: success.guarantor?.province || data.guarantorProvince,
      guarantorCurrentAddress: success.guarantor?.currentAddress || data.guarantorCurrentAddress,
      guarantorTazkira: success.guarantor?.tazkiraNumber || data.guarantorTazkira,
      guarantorPhone: success.guarantor?.phoneNumber || data.guarantorPhone,
      // Signatures
      customerSignature: data.customerSignature,
      guarantorSignature: data.guarantorSignature,
      managerSignature: data.managerSignature,
      notes: data.notes,
    };

    return (
      <MainLayout>
        {/* Success banner */}
        <div className="max-w-4xl mx-auto mb-4 print:hidden">
          <div className="card-golden rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{background:'linear-gradient(135deg,#059669,#047857)'}}>
                <Check className="w-5 h-5 text-white"/>
              </div>
              <div>
                <p className="font-bold text-amber-900">{t.contractSaved}</p>
                <p className="text-sm text-amber-700">{t.contractNumber}: <span className="font-mono font-bold">{success.contractNumber}</span></p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>router.push('/contracts')} className="btn-secondary px-4 py-2 rounded-xl text-sm">{t.contracts}</button>
              <button onClick={()=>{setSuccess(null);setStep(0);setData(initialData);}} className="btn-primary px-4 py-2 rounded-xl text-sm">{t.newContract}</button>
            </div>
          </div>
        </div>
        <ContractBill data={billData} />
      </MainLayout>
    );
  }

  const selectedCar = cars.find(c => c.id === data.carId);
  const selectedCustomer = customers.find(c => c.id === data.customerId);
  const selectedGuarantor = guarantors.find(g => g.id === data.guarantorId);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-amber-900">{t.newContract}</h2>
          <button onClick={()=>router.push('/contracts')} className="btn-secondary px-4 py-2 rounded-xl text-sm">{t.back}</button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {steps.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <div key={s.key} className="flex items-center shrink-0">
                <button onClick={()=>i<step&&setStep(i)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${done?'step-completed cursor-pointer':active?'step-active':' step-inactive cursor-default'}`}>
                  {done ? <Check className="w-3.5 h-3.5"/> : <s.icon className="w-3.5 h-3.5"/>}
                  <span className="hidden sm:block">{t[s.key as keyof typeof t] as string}</span>
                </button>
                {i < steps.length-1 && <div className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-green-500' : 'bg-amber-200'}`}/>}
              </div>
            );
          })}
        </div>

        <div className="card-golden rounded-2xl p-6 fade-in">
          {/* Step 1: Car Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-900 mb-4">{t.carInfo}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>{t.car} *</label>
                  <select value={data.carId} onChange={set('carId')} className={inputCls}>
                    <option value="">{t.selectStatus}</option>
                    {cars.map(c => <option key={c.id} value={c.id}>{c.carName} - {c.plateNumber} ({c.color})</option>)}
                  </select>
                  {selectedCar && <div className="mt-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700 grid grid-cols-2 gap-1">
                    <span>{t.model}: {selectedCar.model}</span>
                    <span>{t.dailyRate}: {selectedCar.dailyRate?.toLocaleString()} {t.currency}</span>
                  </div>}
                </div>
                <div><label className={labelCls}>{t.startDate} *</label><input type="date" value={data.startDate} onChange={set('startDate')} className={inputCls}/></div>
                <div><label className={labelCls}>{t.startTime}</label><input type="time" value={data.startTime} onChange={set('startTime')} className={inputCls}/></div>
                <div><label className={labelCls}>{t.endDate} *</label><input type="date" value={data.endDate} onChange={set('endDate')} className={inputCls}/></div>
                <div><label className={labelCls}>{t.endTime}</label><input type="time" value={data.endTime} onChange={set('endTime')} className={inputCls}/></div>
                <div><label className={labelCls}>{t.rentPrice} *</label><input inputMode="numeric" value={data.rentPrice||''} onChange={set('rentPrice')} className={inputCls} placeholder="0" dir="ltr"/></div>
                <div><label className={labelCls}>{t.totalRent}</label><input value={data.totalRent||''} readOnly className={`${inputCls} bg-amber-50 cursor-not-allowed`} dir="ltr"/></div>
                <div><label className={labelCls}>{t.advancePayment}</label><input inputMode="numeric" value={data.advancePayment||''} onChange={set('advancePayment')} className={inputCls} placeholder="0" dir="ltr"/></div>
                <div><label className={labelCls}>{t.remainingAmount}</label><input value={data.remainingAmount||''} readOnly className={`${inputCls} bg-amber-50 cursor-not-allowed`} dir="ltr"/></div>
                <div><label className={labelCls}>{t.status}</label><input value={data.carStatus} onChange={set('carStatus')} className={inputCls} placeholder="خوب"/></div>
                <div><label className={labelCls}>{t.notes}</label><input value={data.notes} onChange={set('notes')} className={inputCls}/></div>
              </div>
            </div>
          )}

          {/* Step 2: Customer Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-900 mb-4">{t.customerInfo}</h3>
              <div>
                <label className={labelCls}>{lang === 'dari' ? 'مشتری موجود را انتخاب کنید یا جدید ثبت کنید' : 'د موجود مشتري غوره کول یا نوی ثبتول'}</label>
                <select value={data.customerId} onChange={e=>setData({...data,customerId:e.target.value,newCustomer:!e.target.value})} className={inputCls}>
                  <option value="">{lang==='dari'?'مشتری جدید':'نوی مشتری'}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.phoneNumber}</option>)}
                </select>
              </div>
              {!data.customerId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  <div><label className={labelCls}>{t.fullName} *</label><input value={data.customerFullName} onChange={set('customerFullName')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.fatherName}</label><input value={data.customerFatherName} onChange={set('customerFatherName')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.grandfatherName}</label><input value={data.customerGrandfatherName} onChange={set('customerGrandfatherName')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.tazkiraNumber}</label><input value={data.customerTazkira} onChange={set('customerTazkira')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.province}</label><input value={data.customerProvince} onChange={set('customerProvince')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.district}</label><input value={data.customerDistrict} onChange={set('customerDistrict')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.village}</label><input value={data.customerVillage} onChange={set('customerVillage')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.phone} *</label><input value={data.customerPhone} onChange={set('customerPhone')} className={inputCls} dir="ltr"/></div>
                  <div><label className={labelCls}>{t.occupation}</label><input value={data.customerOccupation} onChange={set('customerOccupation')} className={inputCls}/></div>
                  <div className="sm:col-span-2"><label className={labelCls}>{t.currentAddress}</label><input value={data.customerCurrentAddress} onChange={set('customerCurrentAddress')} className={inputCls}/></div>
                  <div className="sm:col-span-2 lg:col-span-3"><label className={labelCls}>{t.permanentAddress}</label><input value={data.customerPermanentAddress} onChange={set('customerPermanentAddress')} className={inputCls}/></div>
                  <div className="sm:col-span-2 lg:col-span-3"><label className={labelCls}>{t.notes}</label><textarea value={data.customerNotes} onChange={set('customerNotes')} rows={2} className={`${inputCls} resize-none`}/></div>
                </div>
              )}
              {data.customerId && selectedCustomer && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="font-bold text-green-800">{selectedCustomer.fullName}</p>
                  <p className="text-sm text-green-700">{selectedCustomer.phoneNumber} | {selectedCustomer.province}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Guarantor Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-900 mb-4">{t.guarantorInfo}</h3>
              <div>
                <label className={labelCls}>{lang==='dari'?'ضامن موجود یا جدید':'موجود یا نوی ضامن'}</label>
                <select value={data.guarantorId} onChange={e=>setData({...data,guarantorId:e.target.value})} className={inputCls}>
                  <option value="">{lang==='dari'?'ضامن جدید':'نوی ضامن'}</option>
                  {guarantors.map(g => <option key={g.id} value={g.id}>{g.fullName} - {g.phoneNumber}</option>)}
                </select>
              </div>
              {!data.guarantorId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  <div><label className={labelCls}>{t.fullName}</label><input value={data.guarantorFullName} onChange={set('guarantorFullName')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.fatherName}</label><input value={data.guarantorFatherName} onChange={set('guarantorFatherName')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.grandfatherName}</label><input value={data.guarantorGrandfatherName} onChange={set('guarantorGrandfatherName')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.tazkiraNumber}</label><input value={data.guarantorTazkira} onChange={set('guarantorTazkira')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.province}</label><input value={data.guarantorProvince} onChange={set('guarantorProvince')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.district}</label><input value={data.guarantorDistrict} onChange={set('guarantorDistrict')} className={inputCls}/></div>
                  <div><label className={labelCls}>{t.phone}</label><input value={data.guarantorPhone} onChange={set('guarantorPhone')} className={inputCls} dir="ltr"/></div>
                  <div><label className={labelCls}>{t.relationship}</label><input value={data.guarantorRelationship} onChange={set('guarantorRelationship')} className={inputCls}/></div>
                  <div className="sm:col-span-2"><label className={labelCls}>{t.currentAddress}</label><input value={data.guarantorCurrentAddress} onChange={set('guarantorCurrentAddress')} className={inputCls}/></div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Conditions */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-900 mb-4">{t.conditions}</h3>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-sm text-amber-800">
                {[t.condition1,t.condition2,t.condition3,t.condition4,t.condition5,t.condition6].map((c,i) => (
                  <p key={i} className="flex gap-2"><span className="font-bold shrink-0">{i+1}.</span>{c}</p>
                ))}
              </div>
              <div>
                <label className={labelCls}>{lang==='dari'?'شرایط اضافی':'اضافي شرطونه'}</label>
                <textarea value={data.conditions} onChange={set('conditions')} rows={4} placeholder={defaultConditions} className={`${inputCls} resize-none`}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className={labelCls}>{t.customerSignature}</label><input value={data.customerSignature} onChange={set('customerSignature')} className={inputCls}/></div>
                <div><label className={labelCls}>{t.guarantorSignature}</label><input value={data.guarantorSignature} onChange={set('guarantorSignature')} className={inputCls}/></div>
                <div><label className={labelCls}>{t.managerSignature}</label><input value={data.managerSignature} onChange={set('managerSignature')} className={inputCls}/></div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={data.agreementConfirmed} onChange={set('agreementConfirmed')} className="mt-0.5 w-4 h-4 accent-amber-500"/>
                <span className="text-sm text-amber-800 font-medium">{t.agreementConfirm}</span>
              </label>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-amber-900 mb-4">{t.review}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><Car className="w-4 h-4"/>{t.carInfo}</h4>
                  <dl className="space-y-1.5 text-sm">
                    {selectedCar && <><dt className="text-amber-600">{t.carName}:</dt><dd className="text-amber-900 font-medium">{selectedCar.carName} ({selectedCar.plateNumber})</dd></>}
                    <dt className="text-amber-600">{t.startDate}:</dt><dd className="text-amber-900">{data.startDate} {data.startTime}</dd>
                    <dt className="text-amber-600">{t.endDate}:</dt><dd className="text-amber-900">{data.endDate} {data.endTime}</dd>
                    <dt className="text-amber-600">{t.totalRent}:</dt><dd className="text-amber-900 font-bold">{Number(data.totalRent).toLocaleString()} {t.currency}</dd>
                    <dt className="text-amber-600">{t.advancePayment}:</dt><dd className="text-green-700 font-medium">{Number(data.advancePayment).toLocaleString()} {t.currency}</dd>
                    <dt className="text-amber-600">{t.remainingAmount}:</dt><dd className="text-red-700 font-medium">{Number(data.remainingAmount).toLocaleString()} {t.currency}</dd>
                  </dl>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><User className="w-4 h-4"/>{t.customerInfo}</h4>
                  <dl className="space-y-1.5 text-sm">
                    {selectedCustomer ? (
                      <><dt className="text-amber-600">{t.fullName}:</dt><dd className="text-amber-900 font-medium">{selectedCustomer.fullName}</dd>
                      <dt className="text-amber-600">{t.phone}:</dt><dd className="text-amber-900">{selectedCustomer.phoneNumber}</dd></>
                    ) : (
                      <><dt className="text-amber-600">{t.fullName}:</dt><dd className="text-amber-900 font-medium">{data.customerFullName}</dd>
                      <dt className="text-amber-600">{t.phone}:</dt><dd className="text-amber-900">{data.customerPhone}</dd></>
                    )}
                  </dl>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><Shield className="w-4 h-4"/>{t.guarantorInfo}</h4>
                  <dl className="space-y-1.5 text-sm">
                    {selectedGuarantor ? (
                      <><dt className="text-amber-600">{t.fullName}:</dt><dd className="text-amber-900 font-medium">{selectedGuarantor.fullName}</dd>
                      <dt className="text-amber-600">{t.phone}:</dt><dd className="text-amber-900">{selectedGuarantor.phoneNumber}</dd></>
                    ) : data.guarantorFullName ? (
                      <><dt className="text-amber-600">{t.fullName}:</dt><dd className="text-amber-900 font-medium">{data.guarantorFullName}</dd>
                      <dt className="text-amber-600">{t.phone}:</dt><dd className="text-amber-900">{data.guarantorPhone}</dd></>
                    ) : <dd className="text-amber-500 text-xs">{lang==='dari'?'ضامن ثبت نشده':'ضامن ثبت نه دی'}</dd>}
                  </dl>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/>{t.conditions}</h4>
                  <div className="space-y-1 text-xs text-amber-700">
                    <p>✅ {lang==='dari'?'شرایط تأیید شده':'شرطونه تایید شوي'}</p>
                    {data.customerSignature && <p>{t.customerSignature}: {data.customerSignature}</p>}
                    {data.managerSignature && <p>{t.managerSignature}: {data.managerSignature}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6 pt-5 border-t border-amber-200">
            {step > 0 && (
              <button onClick={()=>setStep(s=>s-1)} className="flex items-center gap-2 px-5 py-2.5 btn-secondary rounded-xl text-sm">
                <ChevronRight className="w-4 h-4"/>{t.previous}
              </button>
            )}
            {step < steps.length-1 ? (
              <button onClick={()=>setStep(s=>s+1)} className="mr-auto flex items-center gap-2 px-5 py-2.5 btn-primary rounded-xl text-sm">
                {t.next}<ChevronLeft className="w-4 h-4"/>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={saving} className="mr-auto flex items-center gap-2 px-6 py-2.5 btn-primary rounded-xl text-sm disabled:opacity-50">
                <Check className="w-4 h-4"/>{saving?t.loading:t.submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
