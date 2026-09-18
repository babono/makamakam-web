import { redirect } from "next/navigation";
import { allowedAdminEmails, auth, isAdmin, signIn } from "@/lib/auth";
import { SiteHeader, Plaque } from "@/components/Shell";

const devLogin = process.env.ADMIN_DEV_LOGIN === "1" && process.env.NODE_ENV !== "production";

export default async function Login() {
  const session = await auth();
  if (isAdmin(session?.user?.email)) redirect("/admin");

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-10">
        <Plaque className="sm:p-8">
          <h1 className="font-[family-name:var(--font-serif)] text-3xl">Masuk</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Halaman ini memutakhirkan catatan tentang di mana orang dimakamkan. Hanya Apple ID yang
            sudah didaftarkan yang bisa masuk.
          </p>

          {process.env.AUTH_APPLE_ID ? (
            <form
              className="mt-6"
              action={async () => {
                "use server";
                await signIn("apple", { redirectTo: "/admin" });
              }}
            >
              <button
                type="submit"
                className="w-full rounded bg-ink px-4 py-3 text-plaque"
              >
                Masuk dengan Apple
              </button>
            </form>
          ) : (
            <p className="mt-6 rounded border border-hairline p-3 text-sm text-ink-soft">
              Sign in with Apple belum dikonfigurasi. Isi AUTH_APPLE_ID dan AUTH_APPLE_SECRET,
              lalu muat ulang halaman ini.
            </p>
          )}

          {devLogin && (
            <form
              className="mt-4 space-y-3 border-t border-hairline pt-4"
              action={async (formData: FormData) => {
                "use server";
                await signIn("dev", {
                  email: String(formData.get("email") ?? ""),
                  redirectTo: "/admin",
                });
              }}
            >
              <p className="eyebrow">Hanya untuk pengembangan lokal</p>
              <p className="text-xs leading-relaxed text-ink-soft">
                {allowedAdminEmails.length > 0
                  ? `Masukkan salah satu alamat yang terdaftar: ${allowedAdminEmails.join(", ")}.`
                  : "Alamat apa pun bisa dipakai — ADMIN_EMAILS masih kosong, jadi daftar izin belum berlaku."}
              </p>
              <input
                name="email"
                type="email"
                placeholder="anda@contoh.com"
                defaultValue={allowedAdminEmails[0] ?? ""}
                required
              />
              <button
                type="submit"
                className="w-full rounded border border-grass px-4 py-2 text-sm text-grass-deep"
              >
                Masuk tanpa Apple
              </button>
            </form>
          )}
        </Plaque>
      </main>
    </div>
  );
}
