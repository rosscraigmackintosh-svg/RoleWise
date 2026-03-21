import Link from "next/link";

type PageRef = {
  title: string;
  section: string;
  href: string;
} | null;

export function PrevNextNav({ prev, next }: { prev: PageRef; next: PageRef }) {
  if (!prev && !next) return null;

  return (
    <div className="mt-14 border-t border-stone-200 pt-8">
      <div className="flex items-stretch justify-between gap-4">
        {prev ? (
          <Link
            href={prev.href}
            className="group flex flex-1 flex-col gap-1 border-b border-stone-200 pb-4 transition-colors hover:border-stone-300"
          >
            <span className="text-[0.6875rem] font-medium uppercase tracking-widest text-stone-400 transition-colors group-hover:text-stone-500">
              ← Previous
            </span>
            <span className="text-sm text-stone-600 transition-colors group-hover:text-stone-800">
              {prev.title}
            </span>
            <span className="text-xs text-stone-400">{prev.section}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {next ? (
          <Link
            href={next.href}
            className="group flex flex-1 flex-col items-end gap-1 border-b border-stone-200 pb-4 text-right transition-colors hover:border-stone-300"
          >
            <span className="text-[0.6875rem] font-medium uppercase tracking-widest text-stone-400 transition-colors group-hover:text-stone-500">
              Next →
            </span>
            <span className="text-sm text-stone-600 transition-colors group-hover:text-stone-800">
              {next.title}
            </span>
            <span className="text-xs text-stone-400">{next.section}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
