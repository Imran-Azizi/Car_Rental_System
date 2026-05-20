'use client';
export type BadgeVariant = 'active' | 'completed' | 'cancelled' | 'overdue' | 'available' | 'rented' | 'maintenance';

const variantClass: Record<BadgeVariant, string> = {
  active: 'badge-active',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  overdue: 'badge-overdue',
  available: 'badge-active',
  rented: 'badge-overdue',
  maintenance: 'bg-orange-100 text-orange-700 border border-orange-300',
};

export default function Badge({ variant, label }: { variant: BadgeVariant; label: string }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClass[variant]}`}>{label}</span>;
}
