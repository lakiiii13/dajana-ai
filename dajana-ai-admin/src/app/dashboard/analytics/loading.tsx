export default function AnalyticsLoading() {
  return (
    <div>
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 h-64">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-6 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + j * 10}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
