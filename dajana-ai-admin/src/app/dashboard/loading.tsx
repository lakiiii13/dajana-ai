export default function DashboardLoading() {
  return (
    <div>
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-full max-w-md bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
