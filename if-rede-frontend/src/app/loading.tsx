export default function Loading() {
  return (
    <main className="min-h-screen bg-if-bg p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 h-12 w-full animate-pulse rounded-full bg-if-card/70" />
        <div className="mb-6 h-28 w-full animate-pulse rounded-main bg-if-card/70" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-main bg-if-card/70" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-main bg-if-card/70" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
