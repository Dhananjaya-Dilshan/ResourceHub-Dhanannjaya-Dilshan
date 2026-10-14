export default function ReservationsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading reservations">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="h-8 w-44 bg-slate-200 rounded-lg" />
          <div className="h-4 w-52 bg-slate-200 rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-slate-200 rounded-lg" />
      </div>

      {/* Filter Card Skeleton */}
      <div className="card p-4 border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="h-10 flex-1 bg-slate-100 rounded-lg" />
          <div className="h-10 sm:w-44 bg-slate-100 rounded-lg" />
          <div className="h-10 sm:w-76 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="card border border-slate-200 overflow-hidden">
        <div className="h-12 bg-slate-100 border-b border-slate-200" />
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-slate-50 rounded-lg border border-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
