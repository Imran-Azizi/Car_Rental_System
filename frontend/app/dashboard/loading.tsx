export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-amber-100 rounded-xl w-40" />
        <div className="h-6 bg-amber-50 rounded-lg w-32" />
      </div>
      {/* Revenue share cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-32 bg-amber-50 rounded-2xl border border-amber-100" />
        <div className="h-32 bg-amber-50 rounded-2xl border border-amber-100" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-amber-50 rounded-2xl border border-amber-100" />
        ))}
      </div>
      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-amber-50 rounded-2xl border border-amber-100" />
        <div className="h-72 bg-amber-50 rounded-2xl border border-amber-100" />
      </div>
    </div>
  );
}
