export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-200 rounded mt-2" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-200 rounded-lg" />
          <div className="h-10 w-36 bg-slate-200 rounded-lg" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="h-4 w-28 bg-slate-200 rounded" />
                <div className="h-9 w-16 bg-slate-200 rounded-lg mt-3" />
                <div className="h-3 w-36 bg-slate-200 rounded mt-2" />
              </div>
              <div className="h-11 w-11 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {/* Tables Skeleton */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2 border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="card border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between">
            <div className="h-5 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-12 bg-slate-200 rounded" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
