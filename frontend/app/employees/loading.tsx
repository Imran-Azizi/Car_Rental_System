export default function EmployeesLoading() {
  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <div className="skeleton h-7 w-40 rounded-lg" />
            <div className="skeleton h-4 w-28 rounded" />
          </div>
        </div>
        <div className="skeleton h-9 w-40 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-golden rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="skeleton h-4 w-24 rounded" />
            </div>
            <div className="skeleton h-7 w-32 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card-golden rounded-2xl p-4">
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>

      {/* Table */}
      <div className="card-golden rounded-2xl overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton w-8 h-8 rounded-full shrink-0" />
              <div className="skeleton h-4 flex-1 rounded" />
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-7 w-28 rounded-lg" />
              <div className="skeleton h-7 w-28 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
