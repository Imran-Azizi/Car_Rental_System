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
    <div className="card-golden rounded-2xl p-5 fade-in group hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-amber-600 text-xs font-medium mb-2 leading-tight">{title}</p>
          <p className="stat-value text-amber-900 truncate">{value}</p>
          {subtitle && <p className="text-xs text-amber-500 mt-1.5">{subtitle}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200"
          style={{ background: color }}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
