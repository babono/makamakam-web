import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
      <Link href="/" className="font-[family-name:var(--font-serif)] text-xl text-ink">
        Makamakam
      </Link>
      <nav className="flex items-center gap-5 text-sm text-ink-soft">
        <Link href="/privacy" className="hover:text-ink">
          Privasi
        </Link>
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-5 py-12 text-sm text-ink-soft">
      <div className="h-px w-full bg-hairline" />
      <p className="pt-6">
        Makamakam · Pemakaman Islam II, Lingkungan Desa Adat Kuta — Tuban, Badung, Bali
      </p>
      <p className="pt-1">
        Dibuat untuk Apple Developer Academy. Tidak ada iklan, tidak ada pelacakan, tidak ada
        pembelian.
      </p>
    </footer>
  );
}

export function Plaque({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`plaque p-5 ${className}`}>{children}</div>;
}
