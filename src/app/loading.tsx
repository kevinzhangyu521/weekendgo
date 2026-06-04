export default function AppLoading() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-9 w-56 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="h-44 animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
