import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-stone-400">404</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-800">Page not found</h1>
        <p className="mt-3 text-sm text-stone-500">
          This page does not exist yet, or has been moved.
        </p>
        <Link
          href="/docs/overview/what-is-rolewise"
          className="mt-6 inline-block rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Back to docs
        </Link>
      </div>
    </div>
  );
}
