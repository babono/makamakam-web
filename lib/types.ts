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
  /** Never guessed from a name. Null is a real and common state. */
  religion?: Faith | null;
  /** The sentence that bridges the last few metres GPS cannot. */
  landmark: string;
  /** Whether a human physically stood there. */
  verified: boolean;
  stewardName?: string | null;
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
