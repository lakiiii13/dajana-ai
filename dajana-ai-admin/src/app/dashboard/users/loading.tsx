export default function UsersLoading() {
  return (
    <div>
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
