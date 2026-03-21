"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/lib/navigation";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navigation.map((section) => (
        <div key={section.slug} className="pt-5 first:pt-0">
          {/* Section label */}
          <p className="mb-0.5 px-2.5 text-sm font-semibold tracking-normal text-stone-800">
            {section.title}
          </p>

          {/* Items */}
          <ul className="flex flex-col">
            {section.items.map((item) => {
              const href = `/docs/${section.slug}/${item.slug}`;
              const isActive = pathname === href;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={`block py-[5px] text-[0.8125rem] leading-snug transition-colors duration-100 ${
                      isActive
                        ? "border-l-2 border-stone-800 bg-stone-200/60 pl-[9px] pr-2.5 font-medium text-stone-900"
                        : "rounded-sm px-2.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
