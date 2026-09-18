import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth";
import { usingCloudKit } from "@/lib/repo";
import { currentEnvironment } from "@/lib/ckws";
import { setEnvironmentAction } from "@/app/admin/environment";
import { signOut } from "@/lib/auth";

/**
 * The guard lives in this route group rather than on `/admin` itself, because a
 * layout that redirects unauthenticated visitors to a login page *inside* its
 * own subtree redirects the login page too — and the browser walks that loop
 * until it gives up. `/admin/login` sits outside `(panel)` for exactly that
 * reason.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!isAdmin(session?.user?.email)) {
    redirect("/admin/login");
  }

  const environment = usingCloudKit() ? await currentEnvironment() : null;

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
          {environment ? (
            <form action={setEnvironmentAction} className="flex items-center gap-2">
              <span className="rounded border border-hairline bg-plaque px-2 py-1">CloudKit</span>
              <select
                name="environment"
                defaultValue={environment}
                className="w-auto py-1"
              >
                <option value="development">Development</option>
                <option value="production">Production</option>
              </select>
              <button
                type="submit"
                className={`rounded px-2 py-1 ${
                  environment === "production"
                    ? "bg-engraved text-plaque"
                    : "border border-hairline bg-plaque"
                }`}
              >
                {environment === "production" ? "Produksi" : "Ganti"}
              </button>
            </form>
          ) : (
            <span className="rounded border border-hairline bg-plaque px-2 py-1">
              Penyimpanan lokal
            </span>
          )}
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
