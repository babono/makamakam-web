/** The shape the iOS app bundles, kept identical so an export drops straight in. */

export type Faith =
  | "islam" | "hindu" | "kristen" | "katolik"
  | "buddha" | "konghucu" | "other";

export type PhotoKind = "headstone" | "person" | "cemetery";

export interface Photo {
  id: string;
  kind: PhotoKind;
  /** File name, as the app expects it. */
  source: string;
  caption?: string | null;
  /** Where the browser can load it from. Never written into the app's JSON. */
  url?: string;
}

export interface Cemetery {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  /** How close someone must be for the place to count as "here". */
  radiusMeters: number;
  surveyedSection: string;
  rows: number;
  plotsPerRow: number;
  /// Which way the graves lie, degrees true.
  graveBearing?: number | null;
  /// The wall, as [x, y] corner offsets in metres from the gate.
  boundary?: number[][] | null;
  photos: Photo[];
  updatedAt?: string;
}

export interface Grave {
  id: string;
  cemeteryId: string;
  name: string;
  /** Without the bin/binti — the app adds that from `gender`. */
  fatherName?: string | null;
  /** "m", "f", or null where the survey could not confirm it. */
  gender?: "m" | "f" | null;
  birthYear?: number | null;
  /** ISO yyyy-MM-dd, as written on the stone. */
  deathDate?: string | null;
  section: string;
  row: number;
  plot: number;
  latitude: number;
  longitude: number;
  /**
   * Metres east and north of the cemetery's origin — the gate.
   *
   * This is what the app draws the plan from. Offsets come from a tape measure,
   * so they are right relative to each other to the centimetre, and the whole
   * plot shares one GPS error instead of every grave carrying its own. Null
   * where a survey only managed a coordinate.
   */
  x?: number | null;
  y?: number | null;
  /** Which way this stone lies, degrees true. Null falls back to the cemetery. */
  bearing?: number | null;
  /** Never guessed from a name. Null is a real and common state. */
  religion?: Faith | null;
  /** The sentence that bridges the last few metres GPS cannot. */
  landmark: string;
  /** Whether a human physically stood there. */
  verified: boolean;
  stewardName?: string | null;
  /**
   * The life of the person, in Markdown, written by the family. The app renders
   * paragraphs, headings and lists; everything else falls back to plain text.
   */
  profileMarkdown?: string | null;
  /** Who may read the wall: "open", "family" or "closed". */
  wallVisibility?: "open" | "family" | "closed" | null;
  photos: Photo[];
  updatedAt?: string;
}

/** Exactly the file `makamakam/Resources/graves.json` expects. */
export interface BundleExport {
  site: Omit<Cemetery, "id" | "updatedAt" | "photos"> & { photos: Omit<Photo, "url">[] };
  graves: Array<Omit<Grave, "cemeteryId" | "updatedAt" | "photos"> & {
    headstonePhoto: string | null;
    photos: Omit<Photo, "url">[];
  }>;
  memories: unknown[];
  visits: unknown[];
}
