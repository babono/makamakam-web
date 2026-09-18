import { NextResponse } from "next/server";
import { auth, isAdmin } from "@/lib/auth";
import { getCemetery, listGraves } from "@/lib/repo";

/**
 * The bundle the iOS app carries, in exactly the shape
 * `makamakam/Resources/graves.json` expects — so an edit here ends as a file
 * that drops straight into the app and keeps working with the radio off.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cemetery: string }> },
) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return new NextResponse("Not permitted", { status: 401 });
  }

  const { cemetery: id } = await params;
  const cemetery = await getCemetery(id);
  if (!cemetery) return new NextResponse("Not found", { status: 404 });

  const graves = await listGraves(id);
  const strip = (photos: { url?: string }[]) =>
    photos.map(({ url: _url, ...rest }) => rest);

  const bundle = {
    site: {
      name: cemetery.name,
      address: cemetery.address,
      latitude: cemetery.latitude,
      longitude: cemetery.longitude,
      radiusMeters: cemetery.radiusMeters,
      surveyedSection: cemetery.surveyedSection,
      rows: cemetery.rows,
      plotsPerRow: cemetery.plotsPerRow,
      photos: strip(cemetery.photos),
    },
    graves: graves.map((grave) => ({
      id: grave.id,
      name: grave.name,
      birthYear: grave.birthYear ?? null,
      deathDate: grave.deathDate ?? null,
      section: grave.section ?? null,
      row: grave.row ?? null,
      plot: grave.plot ?? null,
      latitude: grave.latitude,
      longitude: grave.longitude,
      headstonePhoto: null,
      landmark: grave.landmark,
      religion: grave.religion ?? null,
      fatherName: grave.fatherName ?? null,
      gender: grave.gender ?? null,
      photos: strip(grave.photos),
      verified: grave.verified,
      stewardName: grave.stewardName ?? null,
      profileMarkdown: grave.profileMarkdown ?? null,
      wallVisibility: grave.wallVisibility ?? "open",
    })),
    // Seeded memories and visits stay with the app for now; the admin does not
    // author what other people wrote.
    memories: [],
    visits: [],
  };

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="graves.json"',
    },
  });
}
