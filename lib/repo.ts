import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Cemetery, Grave, Photo } from "./types";
import { cloudKitConfigured, queryRecords, saveRecord, deleteRecord, type CKRecord } from "./ckws";

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
    photos: JSON.parse(String(fieldValue(record, "photosJSON") ?? "[]")) as Photo[],
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
    religion: (fieldValue(record, "religion") as Grave["religion"]) ?? null,
    landmark: String(fieldValue(record, "landmark") ?? ""),
    verified: Boolean(Number(fieldValue(record, "verified") ?? 0)),
    stewardName: (fieldValue(record, "stewardName") as string) ?? null,
    photos: JSON.parse(String(fieldValue(record, "photosJSON") ?? "[]")) as Photo[],
    updatedAt: record.modified ? new Date(record.modified.timestamp).toISOString() : undefined,
  };
}

const wrap = (fields: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, { value: typeof value === "boolean" ? (value ? 1 : 0) : value }]),
  );

// ---------- the repository ----------

export async function listCemeteries(): Promise<Cemetery[]> {
  if (usingCloudKit()) {
    return (await queryRecords("Cemetery")).map(toCemetery);
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
        photosJSON: JSON.stringify(row.photos ?? []),
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
  const rows = usingCloudKit()
    ? (
        await queryRecords(
          "Grave",
          cemeteryId
            ? [{ fieldName: "cemeteryId", comparator: "EQUALS", fieldValue: { value: cemeteryId } }]
            : undefined,
        )
      ).map(toGrave)
    : await readLocal<Grave>(GRAVES);

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
        religion: row.religion,
        landmark: row.landmark,
        verified: row.verified,
        stewardName: row.stewardName,
        photosJSON: JSON.stringify(row.photos ?? []),
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

/** Photographs land in `public/uploads` locally, and in CloudKit assets later. */
export async function storePhoto(file: File): Promise<Photo> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const source = `${randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, source), bytes);
  return { id: source, kind: "headstone", source, caption: null, url: `/uploads/${source}` };
}
