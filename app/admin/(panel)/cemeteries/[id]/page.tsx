import Link from "next/link";
import { notFound } from "next/navigation";
import { getCemetery, listGraves } from "@/lib/repo";
import { CemeteryFields, DangerButton, SubmitButton } from "@/components/Forms";
import { PhotoManager } from "@/components/PhotoManager";
import { deleteCemeteryAction, saveCemeteryAction } from "@/app/admin/actions";

export default async function CemeteryEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cemetery = await getCemetery(id);
  if (!cemetery) notFound();

  const graves = await listGraves(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-ink-soft">
            ← Semua pemakaman
          </Link>
          <h1 className="mt-1 font-[family-name:var(--font-serif)] text-3xl">{cemetery.name}</h1>
        </div>
        <a
          href={`/api/export/${cemetery.id}`}
          className="rounded border border-grass px-4 py-2 text-sm text-grass-deep"
        >
          Unduh graves.json
        </a>
      </div>

      <section className="plaque p-5">
        <p className="eyebrow">Catatan pemakaman</p>
        <form action={saveCemeteryAction} className="mt-4 space-y-4">
          <CemeteryFields cemetery={cemetery} />
          <SubmitButton>Simpan perubahan</SubmitButton>
        </form>
      </section>

      <PhotoManager
        photos={cemetery.photos}
        cemeteryId={cemetery.id}
        kinds={[{ value: "cemetery", label: "Pemakaman (gerbang, jalan masuk)" }]}
      />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-serif)] text-2xl">
            Makam ({graves.length})
          </h2>
          <Link
            href={`/admin/cemeteries/${cemetery.id}/graves/new`}
            className="rounded bg-grass px-4 py-2 text-sm text-plaque"
          >
            Tambah makam
          </Link>
        </div>

        {graves.length === 0 ? (
          <p className="plaque mt-3 p-5 text-sm text-ink-soft">Belum ada makam yang direkam.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {graves.map((grave) => (
              <li key={grave.id}>
                <Link href={`/admin/graves/${grave.id}`} className="plaque block p-4">
                  <p className="font-[family-name:var(--font-serif)] text-lg">{grave.name}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {grave.section}-{grave.row}-{grave.plot}
                    {grave.deathDate ? ` · wafat ${grave.deathDate}` : ""}
                    {grave.verified ? " · sudah dicek" : " · belum dicek"}
                    {grave.photos.length > 0 ? ` · ${grave.photos.length} foto` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="plaque p-5">
        <p className="eyebrow">Hapus</p>
        <p className="mt-2 text-sm text-ink-soft">
          Menghapus pemakaman ikut menghapus seluruh makam di dalamnya. Tidak bisa dibatalkan.
        </p>
        <form action={deleteCemeteryAction} className="mt-3">
          <input type="hidden" name="id" value={cemetery.id} />
          <DangerButton>Hapus pemakaman ini</DangerButton>
        </form>
      </section>
    </div>
  );
}
