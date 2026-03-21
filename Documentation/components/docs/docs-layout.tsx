import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { TopBar } from "./top-bar";

// Top bar height: h-11 = 2.75rem = 44px
// Sidebar sticks below the top bar on desktop

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f6f3]">

      {/* Top bar — desktop only, sticky */}
      <TopBar />

      {/* Mobile nav — mobile only, sticky header + slide-over drawer */}
      <MobileNav />

      <div className="flex">
        {/* Desktop sidebar — white, flush left, sticky below top bar */}
        <aside className="hidden w-60 shrink-0 border-r border-stone-200 bg-white lg:block">
          <div className="sticky top-11 h-[calc(100vh-2.75rem)] overflow-y-auto px-3 py-5">
            <Sidebar />
          </div>
        </aside>

        {/* Main reading area */}
        <main className="min-w-0 flex-1 px-8 py-12 lg:px-16">
          <div className="mx-auto max-w-[720px]">{children}</div>
        </main>
      </div>

    </div>
  );
}
