import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-semibold text-slate-900">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
        <svg aria-hidden="true" viewBox="0 0 32 32" className="h-6 w-6">
          <path d="M6 21.5 13.2 12l4.2 5.4 2.6-3.2 6 7.3H6Z" fill="currentColor" opacity="0.95" />
          <path d="M9 23.5c3.5-1.3 7-1.3 10.5 0 2.1.8 4 .8 5.5 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" opacity="0.85" />
          <circle cx="22.5" cy="9" r="2.5" fill="currentColor" opacity="0.9" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold">{"\u6816\u7f8e\u5730"}</span>
        <span className="block text-[10px] font-medium tracking-wide text-slate-500">{"\u4eb2\u5b50\u6237\u5916\u6307\u5357"}</span>
      </span>
    </Link>
  );
}
