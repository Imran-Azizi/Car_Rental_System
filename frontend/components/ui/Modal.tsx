'use client';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className={`relative w-full ${sizeClass} rounded-2xl shadow-2xl fade-in overflow-hidden`} style={{background:'linear-gradient(135deg,#fffdf0,#fef9c3)',border:'2px solid #f59e0b'}}>
        <div className="flex items-center justify-between p-5 border-b border-amber-200" style={{background:'linear-gradient(135deg,#92400e,#b45309)'}}>
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-amber-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5"/>
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
}
