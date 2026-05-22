export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-amber-100 rounded-xl w-32" />
        <div className="h-10 bg-amber-100 rounded-xl w-36" />
      </div>
      <div className="h-10 bg-amber-50 rounded-xl border border-amber-100" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-52 bg-amber-50 rounded-2xl border border-amber-100" />
        ))}
      </div>
    </div>
  );
}
