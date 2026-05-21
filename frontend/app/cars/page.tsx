'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useApp } from '@/lib/context';
import { carsAPI, carOwnersAPI } from '@/lib/api';
import { Plus, Search, Edit, Trash2, UserCheck, Camera, X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import toast from 'react-hot-toast';
import { toEnglishNums, parseNum } from '@/lib/utils';

const Select = dynamic(() => import('react-select'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const CAR_STATUS = ['AVAILABLE','RENTED','MAINTENANCE','INACTIVE'] as const;

const statusMap: any = {
  AVAILABLE:   { dari:'آزاد',      pashto:'موجود',    variant:'available'   },
  RENTED:      { dari:'کرایه',     pashto:'کرایه',    variant:'rented'      },
  MAINTENANCE: { dari:'تعمیر',     pashto:'ترمیم',    variant:'maintenance' },
  INACTIVE:    { dari:'غیرفعال',   pashto:'غیرفعال',  variant:'cancelled'   },
};

const emptyForm = {
  ownerId: '', carType: '', carName: '', model: '', color: '',
  plateNumber: '', engineNumber: '', dailyRate: '', status: 'AVAILABLE', notes: '',
};

const selectStyles = {
  control: (b: any, s: any) => ({
    ...b, background: '#fffbeb', borderColor: s.isFocused ? '#f59e0b' : '#fde68a',
    borderRadius: '0.5rem', minHeight: '38px',
    boxShadow: s.isFocused ? '0 0 0 2px rgba(245,158,11,0.2)' : 'none',
    '&:hover': { borderColor: '#f59e0b' }, direction: 'rtl',
  }),
  menu: (b: any) => ({ ...b, zIndex: 9999, borderRadius: '0.5rem', border: '1px solid #fde68a' }),
  option: (b: any, s: any) => ({
    ...b, background: s.isSelected ? '#f59e0b' : s.isFocused ? '#fef3c7' : 'white',
    color: s.isSelected ? 'white' : '#92400e', fontSize: '0.875rem',
    direction: 'rtl', textAlign: 'right' as const,
  }),
  singleValue: (b: any) => ({ ...b, color: '#92400e', fontSize: '0.875rem' }),
  placeholder: (b: any) => ({ ...b, color: '#d97706', fontSize: '0.875rem' }),
  input: (b: any) => ({ ...b, color: '#92400e', fontSize: '0.875rem' }),
  noOptionsMessage: (b: any) => ({ ...b, fontSize: '0.875rem', color: '#d97706' }),
  clearIndicator: (b: any) => ({ ...b, color: '#d97706', '&:hover': { color: '#b45309' } }),
  dropdownIndicator: (b: any) => ({ ...b, color: '#d97706', '&:hover': { color: '#b45309' } }),
};

/* ── small image carousel for table thumbnail ── */
function CarThumbnail({ images }: { images: any[] }) {
  if (!images?.length) return <div className="w-14 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-400 text-lg">🚗</div>;
  return (
    <img
      src={`${API_URL}${images[0].url}`}
      alt="car"
      className="w-14 h-10 rounded-lg object-cover border border-amber-200"
    />
  );
}

/* ── full image gallery in modal ── */
function ImageGallery({ carId, images, onChanged }: { carId: string; images: any[]; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) { toast.error('حجم هر تصویر نباید از ۵ مگابایت بیشتر باشد'); continue; }
        const fd = new FormData();
        fd.append('image', file);
        await carsAPI.addImage(carId, fd);
      }
      toast.success('تصاویر اضافه شدند');
      onChanged();
      setActiveIdx(0);
    } catch { toast.error('خطا در آپلود تصویر'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDelete = async (imgId: string) => {
    try {
      await carsAPI.deleteImage(carId, imgId);
      toast.success('تصویر حذف شد');
      setActiveIdx(0);
      onChanged();
    } catch { toast.error('خطا در حذف تصویر'); }
  };

  return (
    <div className="space-y-3">
      {/* Main display */}
      {images.length > 0 ? (
        <div className="relative rounded-xl overflow-hidden bg-amber-50 border border-amber-200" style={{ height: '220px' }}>
          <img
            src={`${API_URL}${images[activeIdx]?.url}`}
            alt="car"
            className="w-full h-full object-contain"
          />
          {/* Delete current */}
          <button
            onClick={() => handleDelete(images[activeIdx].id)}
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {/* Prev/Next */}
          {images.length > 1 && (
            <>
              <button onClick={() => setActiveIdx(i => (i - 1 + images.length) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveIdx(i => (i + 1) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Counter */}
          <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
            {activeIdx + 1} / {images.length}
          </div>
        </div>
      ) : (
        <div className="h-32 rounded-xl bg-amber-50 border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-400 text-sm">
          هیچ تصویری ندارد
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={img.id} onClick={() => setActiveIdx(i)}
              className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === activeIdx ? 'border-amber-500' : 'border-transparent'}`}>
              <img src={`${API_URL}${img.url}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleUpload} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 text-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
      >
        <Camera className="w-4 h-4" />
        {uploading ? 'در حال آپلود...' : 'افزودن تصاویر'}
      </button>
    </div>
  );
}

export default function CarsPage() {
  const { t, token, lang } = useApp();
  const router = useRouter();
  const [cars, setCars]       = useState<any[]>([]);
  const [owners, setOwners]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCar, setEditCar] = useState<any>(null);
  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);
  const [imageCarId, setImageCarId] = useState<string|null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Single combined effect — no double-fetch on mount
  useEffect(() => {
    if (!token) { router.push('/'); return; }
    fetchCars();
    if (owners.length === 0) fetchOwners();
  }, [token, debouncedSearch, statusFilter]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await carsAPI.getAll({ search: debouncedSearch, status: statusFilter });
      setCars(res.data.data);
    } catch { toast.error(t.error); } finally { setLoading(false); }
  };

  const fetchOwners = async () => {
    try { const res = await carOwnersAPI.getAll(); setOwners(res.data.data); }
    catch { /* silent */ }
  };

  const ownerOptions = [
    { value: '', label: lang === 'dari' ? '— بدون صاحب —' : '— پرته له خاوند —' },
    ...owners.map(o => ({ value: o.id, label: o.fullName })),
  ];

  const openAdd  = () => { setEditCar(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (car: any) => {
    setEditCar(car);
    setForm({
      ownerId: car.ownerId || '', carType: car.carType || '', carName: car.carName,
      model: car.model || '', color: car.color || '', plateNumber: car.plateNumber,
      engineNumber: car.engineNumber || '', dailyRate: String(car.dailyRate ?? ''),
      status: car.status, notes: car.notes || '',
    });
    setModalOpen(true);
  };

  const handleDailyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishNums(e.target.value).replace(/[^0-9.]/g, '');
    setForm(f => ({ ...f, dailyRate: cleaned }));
  };

  const handleSave = async () => {
    if (!form.carName.trim()) return toast.error('نام موتر الزامی است');
    if (!form.plateNumber.trim()) return toast.error('نمبر پلیت الزامی است');
    if (!form.dailyRate) return toast.error('کرایه روزانه الزامی است');
    setSaving(true);
    try {
      const payload = {
        carType: form.carType, carName: form.carName, model: form.model,
        color: form.color, plateNumber: form.plateNumber, engineNumber: form.engineNumber,
        dailyRate: parseNum(form.dailyRate), status: form.status,
        ownerId: form.ownerId || null, notes: form.notes,
      };
      if (editCar) await carsAPI.update(editCar.id, payload);
      else await carsAPI.create(payload);
      toast.success(t.carSaved);
      setModalOpen(false); fetchCars();
    } catch (err: any) { toast.error(err.response?.data?.message || t.error); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await carsAPI.delete(id); toast.success('موتر حذف شد'); fetchCars(); }
    catch { toast.error(t.error); }
  };

  const ic = "w-full px-3 py-2 rounded-lg input-golden text-sm";
  const lc = "block text-sm font-medium text-amber-800 mb-1";
  const formOwnerOpt = ownerOptions.find(o => o.value === form.ownerId) || ownerOptions[0];
  const imageCar = cars.find(c => c.id === imageCarId);

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-amber-900">{t.cars}</h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4"/>{t.addCar}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchPlaceholder} className="w-full pr-10 py-2 px-3 rounded-lg input-golden text-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg input-golden text-sm min-w-[140px]">
            <option value="">{t.all}</option>
            {CAR_STATUS.map(s => <option key={s} value={s}>{statusMap[s]?.[lang]}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card-golden rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-golden min-w-[760px]">
              <thead><tr>
                <th className="px-4 py-3 text-right text-sm">#</th>
                <th className="px-4 py-3 text-right text-sm">{lang === 'dari' ? 'تصویر' : 'انځور'}</th>
                <th className="px-4 py-3 text-right text-sm">{t.carName}</th>
                <th className="px-4 py-3 text-right text-sm">{t.model}</th>
                <th className="px-4 py-3 text-right text-sm">{t.color}</th>
                <th className="px-4 py-3 text-right text-sm">{t.plateNumber}</th>
                <th className="px-4 py-3 text-right text-sm">{t.dailyRate}</th>
                <th className="px-4 py-3 text-right text-sm">{t.carOwners}</th>
                <th className="px-4 py-3 text-right text-sm">{t.status}</th>
                <th className="px-4 py-3 text-right text-sm">{t.actions}</th>
              </tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-amber-500">{t.loading}</td></tr>
                ) : cars.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-amber-500">{t.noData}</td></tr>
                ) : cars.map((car, i) => (
                  <tr key={car.id} className="border-b border-amber-100 hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-amber-600">{i + 1}</td>
                    <td className="px-4 py-3"><CarThumbnail images={car.images || []} /></td>
                    <td className="px-4 py-3 text-sm font-medium text-amber-900">{car.carName}</td>
                    <td className="px-4 py-3 text-sm">{car.model || '—'}</td>
                    <td className="px-4 py-3 text-sm">{car.color || '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono">{car.plateNumber}</td>
                    <td className="px-4 py-3 text-sm">{car.dailyRate?.toLocaleString()} {t.currency}</td>
                    <td className="px-4 py-3 text-sm">
                      {car.owner ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                          <UserCheck className="w-3 h-3"/>{car.owner.fullName}
                        </span>
                      ) : <span className="text-amber-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusMap[car.status]?.variant} label={statusMap[car.status]?.[lang]}/>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(car)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors" title={t.edit}><Edit className="w-4 h-4"/></button>
                        <button onClick={() => setImageCarId(car.id)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title={lang === 'dari' ? 'تصاویر' : 'انځورونه'}>
                          <Images className="w-4 h-4"/>
                        </button>
                        <button onClick={() => setDeleteId(car.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title={t.delete}><Trash2 className="w-4 h-4"/></button>
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
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCar ? t.editCar : t.addCar} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={lc}>{t.carOwners}</label>
            <Select
              options={ownerOptions}
              value={formOwnerOpt}
              onChange={(opt: any) => setForm(f => ({ ...f, ownerId: opt?.value || '' }))}
              placeholder={t.selectOwner}
              styles={selectStyles}
              isSearchable isClearable
              noOptionsMessage={() => t.noData}
            />
          </div>
          <div><label className={lc}>{t.carName} *</label><input value={form.carName} onChange={e => setForm(f => ({...f, carName: e.target.value}))} className={ic}/></div>
          <div><label className={lc}>{t.carType}</label><input value={form.carType} onChange={e => setForm(f => ({...f, carType: e.target.value}))} className={ic}/></div>
          <div><label className={lc}>{t.model}</label><input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} className={ic}/></div>
          <div><label className={lc}>{t.color}</label><input value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} className={ic}/></div>
          <div><label className={lc}>{t.plateNumber} *</label><input value={form.plateNumber} onChange={e => setForm(f => ({...f, plateNumber: e.target.value}))} className={ic}/></div>
          <div>
            <label className={lc}>{t.dailyRate} *</label>
            <input value={form.dailyRate} onChange={handleDailyRateChange} inputMode="numeric" className={ic} placeholder="0"/>
          </div>
          <div><label className={lc}>{t.engineNumber}</label><input value={form.engineNumber} onChange={e => setForm(f => ({...f, engineNumber: e.target.value}))} className={ic}/></div>
          <div><label className={lc}>{t.status}</label>
            <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={ic}>
              {CAR_STATUS.map(s => <option key={s} value={s}>{statusMap[s]?.[lang]}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lc}>{t.notes}</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className={`${ic} resize-none`}/>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setModalOpen(false)} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">{t.cancel}</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">{saving ? t.loading : t.save}</button>
        </div>
      </Modal>

      {/* Images Modal */}
      <Modal
        open={!!imageCarId}
        onClose={() => { setImageCarId(null); fetchCars(); }}
        title={`${lang === 'dari' ? 'تصاویر موتر' : 'د موتر انځورونه'} — ${imageCar?.carName || ''}`}
        size="md"
      >
        {imageCar && (
          <ImageGallery
            carId={imageCar.id}
            images={imageCar.images || []}
            onChanged={fetchCars}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => handleDelete(deleteId!)}
        message="آیا از حذف این موتر مطمئن هستید؟"
      />
    </MainLayout>
  );
}
