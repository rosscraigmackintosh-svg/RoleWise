"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Sticky mobile header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/95 px-5 py-4 backdrop-blur-sm lg:hidden">
        <div>
          <span className="text-[0.9375rem] font-semibold tracking-tight text-stone-800">
            Rolewise
          </span>
          <span className="ml-2 text-[0.6875rem] font-medium uppercase tracking-widest text-stone-400">
            Docs
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
          aria-label="Open navigation"
        >
          <svg
            className="h-[1.125rem] w-[1.125rem]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[17rem] overflow-y-auto border-r border-stone-200 bg-white transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full shadow-none"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <span className="text-[0.9375rem] font-semibold tracking-tight text-stone-800">
              Rolewise
            </span>
            <span className="ml-2 text-[0.6875rem] font-medium uppercase tracking-widest text-stone-400">
              Docs
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close navigation"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav content */}
        <div className="px-4 py-7">
          <Sidebar onNavigate={() => setIsOpen(false)} />
        </div>
      </div>
    </>
  );
}
