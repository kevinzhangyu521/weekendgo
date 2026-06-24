import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center transition-opacity duration-200 hover:opacity-90" aria-label="栖美地首页">
      <img src="/brand/logo.svg" alt="栖美地" className="h-10 w-auto md:h-12" />
    </Link>
  );
}
