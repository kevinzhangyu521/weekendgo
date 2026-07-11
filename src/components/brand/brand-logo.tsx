import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center transition-opacity duration-200 hover:opacity-90" aria-label="Qimeide home">
      <img src="/brand/qimeide-logo-horizontal.svg" alt="Qimeide" className="h-10 w-auto md:h-12" />
    </Link>
  );
}
