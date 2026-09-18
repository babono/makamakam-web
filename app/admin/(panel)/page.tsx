import Link from "next/link";
import { listCemeteries, listGraves, usingCloudKit } from "@/lib/repo";
import { SeedButton } from "@/components/SeedButton";
import { CemeteryFields, SubmitButton } from "@/components/Forms";
import { saveCemeteryAction } from "@/app/admin/actions";

export default async function AdminHome() {
  const cemeteries = await listCemeteries();
  const graves = await listGraves();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-[family-name:var(--font-serif)] text-3xl">Pemakaman</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Satu catatan per pemakaman, lalu makam-makam di dalamnya. Apa yang tersimpan di sini
          persis yang dibawa aplikasi.
        </p>
      </section>

      {cemeteries.length === 0 ? (
        <p className="plaque p-5 text-sm text-ink-soft">Belum ada pemakaman.</p>
      ) : (
        <ul className="space-y-3">
          {cemeteries.map((cemetery) => {
            const count = graves.filter((grave) => grave.cemeteryId === cemetery.id).length;
            return (
              <li key={cemetery.id}>
                <Link href={`/admin/cemeteries/${cemetery.id}`} className="plaque block p-5">
                  <p className="font-[family-name:var(--font-serif)] text-xl">{cemetery.name}</p>
                  <p className="mt-1 text-sm text-ink-soft">{cemetery.address}</p>
                  <p className="mt-2 text-xs text-ink-soft">
                    {count} makam · blok {cemetery.surveyedSection} · {cemetery.rows}×
                    {cemetery.plotsPerRow}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <section className="plaque p-5">
        <p className="eyebrow">Isi dari survei lapangan</p>
        <p className="mt-2 mb-4 text-sm leading-relaxed text-ink-soft">
          Menyalin data survei yang dibawa aplikasi iOS ke penyimpanan yang sedang aktif. Inilah
          cara wadah CloudKit terisi pertama kali, tanpa mengetik ulang satu per satu.
        </p>
        <SeedButton backing={usingCloudKit() ? "CloudKit" : "penyimpanan lokal (.data)"} />
      </section>

      <details className="plaque p-5">
        <summary className="cursor-pointer font-[family-name:var(--font-serif)] text-xl">
          Tambah pemakaman
        </summary>
        <form action={saveCemeteryAction} className="mt-5 space-y-4">
          <CemeteryFields />
          <SubmitButton>Simpan pemakaman</SubmitButton>
        </form>
      </details>
    </div>
  );
}
