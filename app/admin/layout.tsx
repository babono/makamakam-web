import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth";
import { usingCloudKit } from "@/lib/repo";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!isAdmin(session?.user?.email)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6">
        <div className="flex items-baseline gap-3">
          <Link href="/admin" className="font-[family-name:var(--font-serif)] text-xl">
            Makamakam
          </Link>
          <span className="eyebrow">Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-soft">
          <span className="rounded border border-hairline bg-plaque px-2 py-1">
            {usingCloudKit() ? "CloudKit" : "Penyimpanan lokal"}
          </span>
          <span>{session?.user?.email}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="hover:text-ink">
              Keluar
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16">{children}</main>
    </div>
  );
}
