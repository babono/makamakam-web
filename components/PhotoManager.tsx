import Image from "next/image";
import type { Photo } from "@/lib/types";
import { deletePhotoAction, uploadPhotoAction } from "@/app/admin/actions";
import { SubmitButton } from "./Forms";

/**
 * Photographs, with the same rule the app keeps: an empty set is normal. Many
 * families have no picture of the person, and some would not want one shown.
 */
export function PhotoManager({
  photos,
  graveId,
  cemeteryId,
  kinds,
}: {
  photos: Photo[];
  graveId?: string;
  cemeteryId: string;
  kinds: Array<{ value: string; label: string }>;
}) {
  return (
    <section className="plaque p-5">
      <p className="eyebrow">Foto</p>

      {photos.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          Belum ada foto. Kolom ini boleh tetap kosong.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="space-y-2">
              <div className="relative aspect-[3/4] overflow-hidden rounded border border-hairline">
                <Image
                  src={photo.url ?? `/uploads/${photo.source}`}
                  alt={photo.caption ?? photo.kind}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-ink-soft">{photo.caption ?? photo.kind}</p>
              <form action={deletePhotoAction}>
                <input type="hidden" name="photoId" value={photo.id} />
                <input type="hidden" name="graveId" value={graveId ?? ""} />
                <input type="hidden" name="cemeteryId" value={cemeteryId} />
                <button type="submit" className="text-xs text-engraved">
                  Hapus foto
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={uploadPhotoAction} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <input type="hidden" name="graveId" value={graveId ?? ""} />
        <input type="hidden" name="cemeteryId" value={cemeteryId} />
        <label className="block">
          <span className="text-sm">Tambah foto</span>
          <input type="file" name="file" accept="image/*" required className="mt-1" />
        </label>
        <label className="block">
          <span className="text-sm">Jenis</span>
          <select name="kind" className="mt-1">
            {kinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>
        <SubmitButton>Unggah</SubmitButton>
      </form>
    </section>
  );
}
