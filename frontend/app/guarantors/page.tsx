'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useApp } from '@/lib/context';
import { guarantorsAPI } from '@/lib/api';
import { Plus, Search, Edit, Trash2, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { fullName:'', fatherName:'', grandfatherName:'', tazkiraNumber:'', province:'', district:'', village:'', currentAddress:'', permanentAddress:'', phoneNumber:'', whatsappNumber:'', relationship:'', notes:'' };
const inputCls = "w-full px-3 py-2 rounded-lg input-golden text-sm";
const labelCls = "block text-sm font-medium text-amber-800 mb-1";

export default function GuarantorsPage() {
  const { t, token } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string|null>(null);

  useEffect(() => { if (!token) router.push('/'); else fetchData(); }, [token]);
  useEffect(() => { if (token) fetchData(); }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await guarantorsAPI.getAll({ search }); setItems(res.data.data); }
    catch { toast.error(t.error); } finally { setLoading(false); }
  };

  const f = (k: keyof typeof form) => (e: any) => setForm({...form,[k]:e.target.value});
  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); setForm({...emptyForm,...item}); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.fullName || !form.phoneNumber) return toast.error('نام و شماره تلفن الزامی است');
    setSaving(true);
    try {
      if (editItem) await guarantorsAPI.update(editItem.id, form);
      else await guarantorsAPI.create(form);
      toast.success('ضامن موفقانه ذخیره شد');
      setModalOpen(false); fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || t.error); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await guarantorsAPI.delete(id); toast.success('ضامن حذف شد'); fetchData(); }
    catch { toast.error(t.error); }
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-amber-900">{t.guarantors}</h2>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4"/>{t.addGuarantor}
          </button>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.searchPlaceholder} className="w-full pr-10 py-2 px-3 rounded-lg input-golden text-sm max-w-sm"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? <p className="text-amber-500 col-span-3 text-center py-8">{t.loading}</p>
          : items.length === 0 ? <p className="text-amber-500 col-span-3 text-center py-8">{t.noData}</p>
          : items.map(c => (
            <div key={c.id} className="card-golden rounded-2xl p-5 fade-in">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
                    <Shield className="w-5 h-5"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900 text-sm">{c.fullName}</h3>
                    <p className="text-xs text-amber-600">{c.fatherName}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(c)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"><Edit className="w-3.5 h-3.5"/></button>
                  <button onClick={()=>setDeleteId(c.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {c.phoneNumber && <div className="flex items-center gap-2 text-amber-700"><Phone className="w-3 h-3"/>{c.phoneNumber}</div>}
                {c.province && <div className="text-amber-600">{c.province} - {c.district}</div>}
                {c.relationship && <div className="text-amber-600">{t.relationship}: {c.relationship}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={editItem?t.editGuarantor:t.addGuarantor} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className={labelCls}>{t.fullName} *</label><input value={form.fullName} onChange={f('fullName')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.fatherName}</label><input value={form.fatherName} onChange={f('fatherName')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.grandfatherName}</label><input value={form.grandfatherName} onChange={f('grandfatherName')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.tazkiraNumber}</label><input value={form.tazkiraNumber} onChange={f('tazkiraNumber')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.province}</label><input value={form.province} onChange={f('province')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.district}</label><input value={form.district} onChange={f('district')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.village}</label><input value={form.village} onChange={f('village')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.phone} *</label><input value={form.phoneNumber} onChange={f('phoneNumber')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.whatsapp}</label><input value={form.whatsappNumber} onChange={f('whatsappNumber')} className={inputCls}/></div>
          <div><label className={labelCls}>{t.relationship}</label><input value={form.relationship} onChange={f('relationship')} className={inputCls}/></div>
          <div className="sm:col-span-2"><label className={labelCls}>{t.currentAddress}</label><input value={form.currentAddress} onChange={f('currentAddress')} className={inputCls}/></div>
          <div className="sm:col-span-2 lg:col-span-3"><label className={labelCls}>{t.notes}</label><textarea value={form.notes} onChange={f('notes')} rows={2} className={`${inputCls} resize-none`}/></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={()=>setModalOpen(false)} className="flex-1 btn-secondary py-2.5 rounded-xl text-sm">{t.cancel}</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50">{saving?t.loading:t.save}</button>
        </div>
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={()=>handleDelete(deleteId!)} message="آیا از حذف این ضامن مطمئن هستید؟"/>
    </MainLayout>
  );
}
