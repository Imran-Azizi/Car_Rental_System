'use client';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="card-golden rounded-2xl p-5 fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-amber-700 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-amber-900">{value}</p>
          {subtitle && <p className="text-xs text-amber-600 mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{background: color}}>
          <Icon className="w-6 h-6 text-white"/>
        </div>
      </div>
    </div>
  );
}
