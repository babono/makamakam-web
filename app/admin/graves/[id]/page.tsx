import Link from "next/link";
import { notFound } from "next/navigation";
import { getCemetery, getGrave } from "@/lib/repo";
import { DangerButton, GraveFields, SubmitButton } from "@/components/Forms";
import { PhotoManager } from "@/components/PhotoManager";
import { deleteGraveAction, saveGraveAction } from "../../actions";

export default async function GraveEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grave = await getGrave(id);
  if (!grave) notFound();

  const cemetery = await getCemetery(grave.cemeteryId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/cemeteries/${grave.cemeteryId}`} className="text-sm text-ink-soft">
          ← {cemetery?.name ?? "Pemakaman"}
        </Link>
        <h1 className="mt-1 font-[family-name:var(--font-serif)] text-3xl">{grave.name}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {grave.section}-{grave.row}-{grave.plot}
        </p>
      </div>

      <section className="plaque p-5">
        <p className="eyebrow">Catatan makam</p>
        <form action={saveGraveAction} className="mt-4 space-y-4">
          <GraveFields grave={grave} cemeteryId={grave.cemeteryId} />
          <SubmitButton>Simpan perubahan</SubmitButton>
        </form>
      </section>

      <PhotoManager
        photos={grave.photos}
        graveId={grave.id}
        cemeteryId={grave.cemeteryId}
        kinds={[
          { value: "headstone", label: "Nisan" },
          { value: "person", label: "Almarhum (bila keluarga mengizinkan)" },
        ]}
      />

      <section className="plaque p-5">
        <p className="eyebrow">Hapus</p>
        <form action={deleteGraveAction} className="mt-3">
          <input type="hidden" name="id" value={grave.id} />
          <input type="hidden" name="cemeteryId" value={grave.cemeteryId} />
          <DangerButton>Hapus makam ini</DangerButton>
        </form>
      </section>
    </div>
  );
}
