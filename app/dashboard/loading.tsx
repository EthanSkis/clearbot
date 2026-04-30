export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-bgalt">
      <aside className="hidden w-[240px] shrink-0 border-r border-hairline bg-white md:block">
        <div className="flex h-16 items-center gap-2 border-b border-hairline px-5">
          <div className="h-5 w-5 rounded-full bg-bgalt" />
          <div className="h-3 w-20 rounded bg-bgalt" />
        </div>
        <div className="border-b border-hairline px-3 py-3">
          <div className="h-12 rounded-md border border-hairline bg-bgalt" />
        </div>
        <div className="px-3 py-3">
          <ul className="space-y-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2.5 rounded-md px-3 py-2">
                <div className="h-4 w-4 rounded bg-bgalt" />
                <div className="h-3 w-24 rounded bg-bgalt" />
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-hairline bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <div className="hidden h-9 w-full max-w-[440px] flex-1 rounded-md border border-hairline bg-bgalt md:block" />
            <div className="ml-auto flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-bgalt" />
              <div className="h-8 w-8 rounded-full bg-bgalt" />
              <div className="hidden h-8 w-32 rounded-full bg-bgalt md:block" />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-7 w-56 rounded bg-white" />
            <div className="h-4 w-80 rounded bg-white" />
            <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-md border border-hairline bg-white" />
              ))}
            </div>
            <div className="h-64 rounded-md border border-hairline bg-white" />
          </div>
        </main>
      </div>
    </div>
  );
}
