import Link from "next/link";
import { notFound } from "next/navigation";
import { getCemetery } from "@/lib/repo";
import { GraveFields, SubmitButton } from "@/components/Forms";
import { saveGraveAction } from "@/app/admin/actions";

export default async function NewGrave({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cemetery = await getCemetery(id);
  if (!cemetery) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/admin/cemeteries/${cemetery.id}`} className="text-sm text-ink-soft">
          ← {cemetery.name}
        </Link>
        <h1 className="mt-1 font-[family-name:var(--font-serif)] text-3xl">Tambah makam</h1>
      </div>

      <section className="plaque p-5">
        <form action={saveGraveAction} className="space-y-4">
          <GraveFields cemeteryId={cemetery.id} />
          <SubmitButton>Simpan makam</SubmitButton>
        </form>
      </section>

      <p className="text-sm text-ink-soft">
        Foto ditambahkan setelah makam tersimpan.
      </p>
    </div>
  );
}
