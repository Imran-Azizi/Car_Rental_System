'use client';
import Modal from './Modal';
import { useApp } from '@/lib/context';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, message }: { open: boolean; onClose: () => void; onConfirm: () => void; message: string }) {
  const { t } = useApp();
  return (
    <Modal open={open} onClose={onClose} title={t.confirm} size="sm">
      <div className="text-center space-y-4">
        <div className="flex justify-center"><AlertTriangle className="w-12 h-12 text-amber-500"/></div>
        <p className="text-amber-800">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2 rounded-lg btn-secondary text-sm">{t.cancel}</button>
          <button onClick={()=>{onConfirm();onClose();}} className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm transition-colors">{t.confirm}</button>
        </div>
      </div>
    </Modal>
  );
}
