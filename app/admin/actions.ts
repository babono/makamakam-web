"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth";
import {
  removeCemetery,
  removeGrave,
  saveCemetery,
  saveGrave,
  getCemetery,
  getGrave,
  storePhoto,
  removePhoto,
  waitForPhoto,
  usingCloudKit,
} from "@/lib/repo";
import type { Faith, Grave, Photo, PhotoKind } from "@/lib/types";

/**
 * Every action re-checks the session. The layout already guards the pages, but a
 * server action is its own endpoint — anybody can post to one.
 */
async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    throw new Error("Not permitted");
  }
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const number = (form: FormData, key: string, fallback = 0) => {
  const value = Number(form.get(key));
  return Number.isFinite(value) ? value : fallback;
};
const optionalText = (form: FormData, key: string) => text(form, key) || null;

/** One "x, y" pair per line, as somebody would type them off a tape measure. */
function parseBoundary(raw: string): number[][] | null {
  const pairs = raw
    .split("\n")
    .map((line) => line.split(/[,\s]+/).filter(Boolean).map(Number))
    .filter((pair) => pair.length === 2 && pair.every(Number.isFinite));
  return pairs.length >= 3 ? pairs : null;
}

export async function saveCemeteryAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const existing = id ? await getCemetery(id) : undefined;

  const cemetery = await saveCemetery({
    id: id || undefined,
    name: text(form, "name"),
    address: text(form, "address"),
    latitude: number(form, "latitude"),
    longitude: number(form, "longitude"),
    radiusMeters: number(form, "radiusMeters", 120),
    surveyedSection: text(form, "surveyedSection") || "A",
    rows: number(form, "rows", 1),
    plotsPerRow: number(form, "plotsPerRow", 1),
    graveBearing: form.get("graveBearing") ? number(form, "graveBearing") : null,
    boundary: parseBoundary(text(form, "boundary")),
    photos: existing?.photos ?? [],
  });

  revalidatePath("/admin");
  redirect(`/admin/cemeteries/${cemetery.id}`);
}

export async function deleteCemeteryAction(form: FormData) {
  await requireAdmin();
  await removeCemetery(text(form, "id"));
  revalidatePath("/admin");
  redirect("/admin");
}

export async function saveGraveAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const existing = id ? await getGrave(id) : undefined;
  const cemeteryId = text(form, "cemeteryId");

  const grave: Omit<Grave, "id"> & { id?: string } = {
    id: id || undefined,
    cemeteryId,
    name: text(form, "name"),
    fatherName: optionalText(form, "fatherName"),
    gender: (optionalText(form, "gender") as Grave["gender"]) ?? null,
    birthYear: form.get("birthYear") ? number(form, "birthYear") : null,
    deathDate: optionalText(form, "deathDate"),
    section: text(form, "section") || "A",
    row: number(form, "row", 1),
    plot: number(form, "plot", 1),
    latitude: number(form, "latitude"),
    longitude: number(form, "longitude"),
    x: form.get("x") ? number(form, "x") : null,
    y: form.get("y") ? number(form, "y") : null,
    bearing: form.get("bearing") ? number(form, "bearing") : null,
    religion: (optionalText(form, "religion") as Faith | null) ?? null,
    landmark: text(form, "landmark"),
    verified: form.get("verified") === "on",
    stewardName: optionalText(form, "stewardName"),
    profileMarkdown: optionalText(form, "profileMarkdown"),
    wallVisibility: (optionalText(form, "wallVisibility") as Grave["wallVisibility"]) ?? "open",
    photos: existing?.photos ?? [],
  };

  const saved = await saveGrave(grave);
  revalidatePath(`/admin/cemeteries/${cemeteryId}`);
  redirect(`/admin/graves/${saved.id}`);
}

export async function deleteGraveAction(form: FormData) {
  await requireAdmin();
  const cemeteryId = text(form, "cemeteryId");
  await removeGrave(text(form, "id"));
  revalidatePath(`/admin/cemeteries/${cemeteryId}`);
  redirect(`/admin/cemeteries/${cemeteryId}`);
}

export async function uploadPhotoAction(form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const kind = (text(form, "kind") || "headstone") as PhotoKind;
  const caption = optionalText(form, "caption");
  const graveId = text(form, "graveId");
  const cemeteryId = text(form, "cemeteryId");

  const owner = graveId
    ? ({ id: graveId, type: "grave" as const, kind, caption })
    : ({ id: cemeteryId, type: "cemetery" as const, kind: "cemetery" as PhotoKind, caption });

  const photo: Photo = await storePhoto(file, owner);

  // On CloudKit a photograph is its own record and already points at its owner;
  // locally the list lives inside the owner's JSON, so it has to be written in.
  if (!usingCloudKit()) {
    if (graveId) {
      const grave = await getGrave(graveId);
      if (grave) await saveGrave({ ...grave, photos: [...grave.photos, photo] });
    } else {
      const cemetery = await getCemetery(cemeteryId);
      if (cemetery) await saveCemetery({ ...cemetery, photos: [...cemetery.photos, photo] });
    }
  }

  await waitForPhoto(owner.id, photo.id);
  revalidatePath(graveId ? `/admin/graves/${graveId}` : `/admin/cemeteries/${cemeteryId}`);
}

export async function deletePhotoAction(form: FormData) {
  await requireAdmin();
  const photoId = text(form, "photoId");
  const graveId = text(form, "graveId");
  const cemeteryId = text(form, "cemeteryId");

  await removePhoto(photoId);

  if (!usingCloudKit()) {
    if (graveId) {
      const grave = await getGrave(graveId);
      if (grave) {
        await saveGrave({ ...grave, photos: grave.photos.filter((photo) => photo.id !== photoId) });
      }
    } else {
      const cemetery = await getCemetery(cemeteryId);
      if (cemetery) {
        await saveCemetery({
          ...cemetery,
          photos: cemetery.photos.filter((photo) => photo.id !== photoId),
        });
      }
    }
  }

  revalidatePath(graveId ? `/admin/graves/${graveId}` : `/admin/cemeteries/${cemeteryId}`);
}
