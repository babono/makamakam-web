import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Cemetery, Grave, Photo } from "./types";
import {
  cloudKitConfigured,
  queryRecords,
  saveRecord,
  deleteRecord,
  uploadAsset,
  type CKRecord,
} from "./ckws";

/**
 * One interface, two backings.
 *
 * CloudKit when it is configured; otherwise JSON files under `.data`, so the
 * admin can be built, demonstrated and handed to a caretaker before anybody has
 * generated an Apple key. The local store is also what makes this testable — a
 * CloudKit container cannot be spun up in a test.
 */

const DIR = path.join(process.cwd(), ".data");
const CEMETERIES = path.join(DIR, "cemeteries.json");
const GRAVES = path.join(DIR, "graves.json");

export const usingCloudKit = cloudKitConfigured;

// ---------- local JSON store ----------

async function readLocal<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T[];
  } catch {
    return [];
  }
}

async function writeLocal<T>(file: string, rows: T[]): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(rows, null, 2), "utf8");
}

// ---------- CloudKit mapping ----------

const fieldValue = (record: CKRecord, key: string) => record.fields?.[key]?.value;

// CloudKit has no nested arrays, so corner offsets travel flat: [x1, y1, x2, y2…]
const unflatten = (flat?: number[]): number[][] | null =>
  flat && flat.length >= 6
    ? Array.from({ length: Math.floor(flat.length / 2) }, (_, i) => [flat[i * 2], flat[i * 2 + 1]])
    : null;

const flatten = (pairs?: number[][] | null): number[] | undefined =>
  pairs && pairs.length >= 3 ? pairs.flat() : undefined;

function toCemetery(record: CKRecord): Cemetery {
  return {
    id: record.recordName,
    name: String(fieldValue(record, "name") ?? ""),
    address: String(fieldValue(record, "address") ?? ""),
    latitude: Number(fieldValue(record, "latitude") ?? 0),
    longitude: Number(fieldValue(record, "longitude") ?? 0),
    radiusMeters: Number(fieldValue(record, "radiusMeters") ?? 120),
    surveyedSection: String(fieldValue(record, "surveyedSection") ?? "A"),
    rows: Number(fieldValue(record, "rows") ?? 1),
    plotsPerRow: Number(fieldValue(record, "plotsPerRow") ?? 1),
    // Filled in from Photo records by the caller: an asset belongs to a field,
    // so photographs cannot live inside the record they belong to.
    photos: [],
    updatedAt: record.modified ? new Date(record.modified.timestamp).toISOString() : undefined,
  };
}

function toGrave(record: CKRecord): Grave {
  return {
    id: record.recordName,
    cemeteryId: String(fieldValue(record, "cemeteryId") ?? ""),
    name: String(fieldValue(record, "name") ?? ""),
    fatherName: (fieldValue(record, "fatherName") as string) ?? null,
    gender: (fieldValue(record, "gender") as Grave["gender"]) ?? null,
    birthYear: (fieldValue(record, "birthYear") as number) ?? null,
    deathDate: (fieldValue(record, "deathDate") as string) ?? null,
    section: String(fieldValue(record, "section") ?? "A"),
    row: Number(fieldValue(record, "row") ?? 1),
    plot: Number(fieldValue(record, "plot") ?? 1),
    latitude: Number(fieldValue(record, "latitude") ?? 0),
    longitude: Number(fieldValue(record, "longitude") ?? 0),
    x: (fieldValue(record, "x") as number) ?? null,
    y: (fieldValue(record, "y") as number) ?? null,
    religion: (fieldValue(record, "religion") as Grave["religion"]) ?? null,
    landmark: String(fieldValue(record, "landmark") ?? ""),
    verified: Boolean(Number(fieldValue(record, "verified") ?? 0)),
    stewardName: (fieldValue(record, "stewardName") as string) ?? null,
    photos: [],
    updatedAt: record.modified ? new Date(record.modified.timestamp).toISOString() : undefined,
  };
}

const wrap = (fields: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, { value: typeof value === "boolean" ? (value ? 1 : 0) : value }]),
  );

/**
 * Photographs.
 *
 * In CloudKit each one is its own `Photo` record with a `image` asset field:
 * assets belong to a field, so a record cannot hold an arbitrary list of them.
 * The record also carries who it belongs to, which keeps a grave's record small
 * and lets a photograph be deleted without rewriting the grave.
 *
 * In local mode the array simply lives inside the grave's JSON, which is all a
 * laptop needs.
 */
function toPhoto(record: CKRecord): Photo {
  const asset = record.fields?.image?.value as { downloadURL?: string } | undefined;
  return {
    id: record.recordName,
    kind: (fieldValue(record, "kind") as Photo["kind"]) ?? "headstone",
    source: String(fieldValue(record, "source") ?? `${record.recordName}.jpg`),
    caption: (fieldValue(record, "caption") as string) ?? null,
    // CloudKit hands back a signed URL; it is for the admin's own eyes, and is
    // never written into the app's JSON.
    url: asset?.downloadURL?.replace("${f}", "") ?? undefined,
  };
}

async function photosFor(ownerIds: string[]): Promise<Map<string, Photo[]>> {
  const grouped = new Map<string, Photo[]>();
  if (!usingCloudKit() || ownerIds.length === 0) return grouped;

  const records = await queryRecords("Photo");
  for (const record of records) {
    const owner = String(fieldValue(record, "ownerId") ?? "");
    if (!ownerIds.includes(owner)) continue;
    const list = grouped.get(owner) ?? [];
    list.push(toPhoto(record));
    grouped.set(owner, list);
  }
  return grouped;
}

// ---------- the repository ----------

export async function listCemeteries(): Promise<Cemetery[]> {
  if (usingCloudKit()) {
    const rows = (await queryRecords("Cemetery")).map(toCemetery);
    const photos = await photosFor(rows.map((row) => row.id));
    return rows.map((row) => ({ ...row, photos: photos.get(row.id) ?? [] }));
  }
  return readLocal<Cemetery>(CEMETERIES);
}

export async function getCemetery(id: string): Promise<Cemetery | undefined> {
  return (await listCemeteries()).find((row) => row.id === id);
}

export async function saveCemetery(input: Omit<Cemetery, "id"> & { id?: string }): Promise<Cemetery> {
  const id = input.id?.trim() || randomUUID();
  const row: Cemetery = { ...input, id, updatedAt: new Date().toISOString() };

  if (usingCloudKit()) {
    await saveRecord({
      recordName: id,
      recordType: "Cemetery",
      fields: wrap({
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        radiusMeters: row.radiusMeters,
        surveyedSection: row.surveyedSection,
        rows: row.rows,
        plotsPerRow: row.plotsPerRow,
        graveBearing: row.graveBearing,
        boundaryOffsets: flatten(row.boundary),
      }),
    });
    return row;
  }

  const rows = await readLocal<Cemetery>(CEMETERIES);
  const index = rows.findIndex((existing) => existing.id === id);
  if (index >= 0) rows[index] = row;
  else rows.push(row);
  await writeLocal(CEMETERIES, rows);
  return row;
}

export async function removeCemetery(id: string): Promise<void> {
  if (usingCloudKit()) {
    for (const grave of await listGraves(id)) await removeGrave(grave.id);
    await deleteRecord(id);
    return;
  }
  await writeLocal(CEMETERIES, (await readLocal<Cemetery>(CEMETERIES)).filter((row) => row.id !== id));
  await writeLocal(GRAVES, (await readLocal<Grave>(GRAVES)).filter((row) => row.cemeteryId !== id));
}

export async function listGraves(cemeteryId?: string): Promise<Grave[]> {
  let rows: Grave[];

  if (usingCloudKit()) {
    rows = (
      await queryRecords(
        "Grave",
        cemeteryId
          ? [{ fieldName: "cemeteryId", comparator: "EQUALS", fieldValue: { value: cemeteryId } }]
          : undefined,
      )
    ).map(toGrave);
    const photos = await photosFor(rows.map((row) => row.id));
    rows = rows.map((row) => ({ ...row, photos: photos.get(row.id) ?? [] }));
  } else {
    rows = await readLocal<Grave>(GRAVES);
  }

  const filtered = cemeteryId ? rows.filter((row) => row.cemeteryId === cemeteryId) : rows;
  return filtered.sort((a, b) => a.row - b.row || a.plot - b.plot);
}

export async function getGrave(id: string): Promise<Grave | undefined> {
  return (await listGraves()).find((row) => row.id === id);
}

export async function saveGrave(input: Omit<Grave, "id"> & { id?: string }): Promise<Grave> {
  const id = input.id?.trim() || `${input.section}-${input.row}-${String(input.plot).padStart(2, "0")}`;
  const row: Grave = { ...input, id, updatedAt: new Date().toISOString() };

  if (usingCloudKit()) {
    await saveRecord({
      recordName: id,
      recordType: "Grave",
      fields: wrap({
        cemeteryId: row.cemeteryId,
        name: row.name,
        fatherName: row.fatherName,
        gender: row.gender,
        birthYear: row.birthYear,
        deathDate: row.deathDate,
        section: row.section,
        row: row.row,
        plot: row.plot,
        latitude: row.latitude,
        longitude: row.longitude,
        x: row.x,
        y: row.y,
        religion: row.religion,
        landmark: row.landmark,
        verified: row.verified,
        stewardName: row.stewardName,
      }),
    });
    return row;
  }

  const rows = await readLocal<Grave>(GRAVES);
  const index = rows.findIndex((existing) => existing.id === id);
  if (index >= 0) rows[index] = row;
  else rows.push(row);
  await writeLocal(GRAVES, rows);
  return row;
}

export async function removeGrave(id: string): Promise<void> {
  if (usingCloudKit()) {
    await deleteRecord(id);
    return;
  }
  await writeLocal(GRAVES, (await readLocal<Grave>(GRAVES)).filter((row) => row.id !== id));
}

/**
 * A photograph, stored as a CloudKit asset where CloudKit is on, and on local
 * disk where it is not.
 *
 * The local path is for development only: a serverless deploy has no disk worth
 * writing to, and anything put there is gone by the next request.
 */
export async function storePhoto(
  file: File,
  owner: { id: string; type: "grave" | "cemetery"; kind: Photo["kind"]; caption: string | null },
): Promise<Photo> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const recordName = randomUUID();
  const source = `${recordName}.${extension}`;

  if (usingCloudKit()) {
    const receipt = await uploadAsset("Photo", "image", bytes);
    await saveRecord({
      recordName,
      recordType: "Photo",
      fields: {
        ownerId: { value: owner.id },
        ownerType: { value: owner.type },
        kind: { value: owner.kind },
        caption: { value: owner.caption ?? "" },
        // The file name the iOS app caches the downloaded asset under.
        source: { value: source },
        image: { value: receipt },
      },
    });
    return { id: recordName, kind: owner.kind, source, caption: owner.caption };
  }

  const directory = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, source), bytes);
  return { id: recordName, kind: owner.kind, source, caption: owner.caption, url: `/uploads/${source}` };
}

/**
 * CloudKit's query index is eventually consistent: a record written a moment ago
 * is fetchable by name immediately, but does not appear in a query for a second
 * or two. The admin re-renders straight after a write, so without this wait a
 * freshly uploaded photograph is simply missing until you reload — which reads
 * as a failed upload rather than as a cache.
 */
export async function waitForPhoto(ownerId: string, photoId: string): Promise<void> {
  if (!usingCloudKit()) return;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const grouped = await photosFor([ownerId]);
    if ((grouped.get(ownerId) ?? []).some((photo) => photo.id === photoId)) return;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}

/** The same wait, for the seed: the list page renders immediately after it. */
export async function waitForCemeteries(): Promise<void> {
  if (!usingCloudKit()) return;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if ((await listCemeteries()).length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
}

export async function removePhoto(photoId: string): Promise<void> {
  if (usingCloudKit()) {
    await deleteRecord(photoId);
  }
}
