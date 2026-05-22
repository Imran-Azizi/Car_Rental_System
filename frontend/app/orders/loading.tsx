export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-amber-100 rounded-xl w-44" />
        <div className="h-10 bg-amber-100 rounded-xl w-32" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-amber-50 rounded-xl border border-amber-100" />
        <div className="h-10 w-28 bg-amber-50 rounded-xl border border-amber-100" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-amber-50 rounded-2xl border border-amber-100" />
        ))}
      </div>
    </div>
  );
}
