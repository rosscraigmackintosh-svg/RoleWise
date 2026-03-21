import type { MDXComponents } from "mdx/types";

export const docsMdxComponents: MDXComponents = {
  h1: ({ children, id }) => (
    <h1
      id={id}
      className="mb-0 mt-0 border-b border-stone-200 pb-6 text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-stone-950"
    >
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2
      id={id}
      className="mb-3 mt-14 text-base font-semibold leading-snug text-stone-900"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3
      id={id}
      className="mb-2 mt-8 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone-500"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-5 leading-[1.8] text-stone-700">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-5 space-y-2 pl-5 text-stone-700 [&>li]:list-disc">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 space-y-2 pl-5 text-stone-700 [&>li]:list-decimal">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-[1.8] text-stone-700">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-stone-800">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-stone-500">{children}</em>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[0.8125em] text-stone-700 ring-1 ring-stone-200/80">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-6 mt-1 overflow-x-auto rounded-lg border border-stone-200 bg-[#f0eeeb] px-5 py-4 font-mono text-[0.8125rem] leading-relaxed text-stone-700">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-7 border-l-[3px] border-stone-400 bg-stone-100/50 py-3 pl-5 pr-4 text-stone-600 [&>p]:mb-0 [&>p]:leading-[1.75]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-10 border-stone-200" />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-[3px] transition-colors hover:text-stone-900 hover:decoration-stone-500"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-7 mt-1 overflow-x-auto rounded-lg border border-stone-200">
      <table className="w-full border-collapse text-sm text-stone-600">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-stone-50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-stone-200 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-stone-100 px-4 py-2.5 last:border-b-0">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="last:border-b-0 hover:bg-stone-50/50">{children}</tr>
  ),
};
