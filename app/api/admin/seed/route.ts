import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth, isAdmin } from "@/lib/auth";
import {
  listCemeteries,
  listGraves,
  saveCemetery,
  saveGrave,
  usingCloudKit,
  waitForCemeteries,
} from "@/lib/repo";
import type { Cemetery, Grave } from "@/lib/types";

/**
 * Pushes the surveyed data into whichever backing is live — which is how the
 * CloudKit container gets its first records without anyone typing 27 graves
 * into a dashboard.
 *
 * Idempotent: records are written under their own ids, so running it twice
 * overwrites rather than duplicates. It never deletes, so a field correction
 * made in the panel is not undone by a careless second run... unless that
 * correction was to a grave in the seed file, in which case the file wins.
 * `?skipExisting=1` keeps the panel's version instead.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return new NextResponse("Not permitted", { status: 401 });
  }

  const skipExisting = new URL(request.url).searchParams.get("skipExisting") === "1";
  const dataDir = path.join(process.cwd(), "data");

  const cemeteries = JSON.parse(
    await fs.readFile(path.join(dataDir, "seed-cemeteries.json"), "utf8"),
  ) as Cemetery[];
  const graves = JSON.parse(
    await fs.readFile(path.join(dataDir, "seed-graves.json"), "utf8"),
  ) as Grave[];

  const existingCemeteries = new Set((await listCemeteries()).map((row) => row.id));
  const existingGraves = new Set((await listGraves()).map((row) => row.id));

  let written = 0;
  let skipped = 0;

  for (const cemetery of cemeteries) {
    if (skipExisting && existingCemeteries.has(cemetery.id)) {
      skipped += 1;
      continue;
    }
    await saveCemetery(cemetery);
    written += 1;
  }

  for (const grave of graves) {
    if (skipExisting && existingGraves.has(grave.id)) {
      skipped += 1;
      continue;
    }
    await saveGrave(grave);
    written += 1;
  }

  // The list page renders the moment this returns, and CloudKit's query index
  // lags a write by a second or two.
  await waitForCemeteries();

  return NextResponse.json({
    backing: usingCloudKit() ? "cloudkit" : "local",
    written,
    skipped,
  });
}
