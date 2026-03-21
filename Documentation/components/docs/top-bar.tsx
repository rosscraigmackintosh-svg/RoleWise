// Desktop-only top bar. Mobile uses MobileNav's sticky header instead.
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 hidden h-11 border-b border-stone-200 bg-white lg:flex">
      <div className="flex h-full w-full items-center">

        {/* Left: identity — matches sidebar width exactly */}
        <div className="flex h-full w-60 shrink-0 items-center gap-2 border-r border-stone-200 px-4">
          <span className="text-sm font-semibold tracking-tight text-stone-900">Rolewise</span>
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-stone-400">
            Docs
          </span>
        </div>

        {/* Right: search */}
        <div className="flex flex-1 items-center px-5">
          <div className="relative w-full max-w-xs">
            {/* Search icon */}
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search docs…"
              className="h-7 w-full rounded-md border border-stone-200 bg-stone-50 pl-8 pr-3 text-xs text-stone-700 placeholder-stone-400 outline-none transition-colors focus:border-stone-300 focus:bg-white"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-stone-200 bg-stone-100 px-1 py-px font-mono text-[0.625rem] text-stone-400">
              ⌘K
            </kbd>
          </div>
        </div>

      </div>
    </header>
  );
}
