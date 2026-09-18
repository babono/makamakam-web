import crypto from "node:crypto";

/**
 * CloudKit Web Services, signed server-to-server.
 *
 * Yes, this is possible, and it is the right mechanism for an admin panel: a
 * server-to-server key acts as the *application* against the public database,
 * so records can be written without a signed-in Apple ID attached to each one.
 * CloudKit JS is the other half of the story and the wrong half here — it signs
 * a *person* in and acts as them, which is what you want inside a user-facing
 * web app, not in a back office.
 *
 * Every request is signed:
 *   signature = ECDSA-SHA256( "<ISO8601 date>:<base64 sha256 of body>:<path>" )
 *
 * Configure with:
 *   CLOUDKIT_CONTAINER   iCloud.me.babono.makamakam
 *   CLOUDKIT_ENV         development | production
 *   CLOUDKIT_KEY_ID      the key ID from the CloudKit dashboard
 *   CLOUDKIT_PRIVATE_KEY the .p8 contents (newlines as \n)
 *
 * With none of those set the app falls back to a local JSON store, so the admin
 * runs on a laptop with no Apple account attached at all.
 */

const HOST = "https://api.apple-cloudkit.com";

export function cloudKitConfigured(): boolean {
  return Boolean(
    process.env.CLOUDKIT_CONTAINER &&
      process.env.CLOUDKIT_KEY_ID &&
      process.env.CLOUDKIT_PRIVATE_KEY,
  );
}

function privateKey(): crypto.KeyObject {
  const pem = (process.env.CLOUDKIT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  return crypto.createPrivateKey(pem);
}

function sign(date: string, body: string, path: string): string {
  const hashedBody = crypto.createHash("sha256").update(body, "utf8").digest("base64");
  const message = `${date}:${hashedBody}:${path}`;
  return crypto.sign("sha256", Buffer.from(message, "utf8"), {
    key: privateKey(),
    dsaEncoding: "der",
  }).toString("base64");
}

async function call<T>(operation: string, body: unknown): Promise<T> {
  const container = process.env.CLOUDKIT_CONTAINER!;
  const environment = process.env.CLOUDKIT_ENV ?? "development";
  const path = `/database/1/${container}/${environment}/public/${operation}`;
  const payload = JSON.stringify(body);
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const response = await fetch(`${HOST}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Apple-CloudKit-Request-KeyID": process.env.CLOUDKIT_KEY_ID!,
      "X-Apple-CloudKit-Request-ISO8601Date": date,
      "X-Apple-CloudKit-Request-SignatureV1": sign(date, payload, path),
    },
    body: payload,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CloudKit ${operation} failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

export interface CKRecord {
  recordName: string;
  recordType: string;
  recordChangeTag?: string;
  fields: Record<string, { value: unknown; type?: string }>;
  modified?: { timestamp: number };
}

export async function queryRecords(
  recordType: string,
  filterBy?: Array<{ fieldName: string; comparator: string; fieldValue: { value: unknown } }>,
): Promise<CKRecord[]> {
  const out: CKRecord[] = [];
  let continuationMarker: string | undefined;

  do {
    const page = await call<{ records: CKRecord[]; continuationMarker?: string }>("records/query", {
      query: { recordType, filterBy },
      resultsLimit: 200,
      continuationMarker,
    });
    out.push(...(page.records ?? []));
    continuationMarker = page.continuationMarker;
  } while (continuationMarker);

  return out;
}

export async function saveRecord(record: {
  recordName: string;
  recordType: string;
  recordChangeTag?: string;
  fields: Record<string, { value: unknown }>;
}): Promise<CKRecord> {
  const result = await call<{ records: CKRecord[] }>("records/modify", {
    operations: [
      {
        // forceUpdate: the admin is the single writer here, and a stale change
        // tag should not strand an edit somebody has already typed.
        operationType: record.recordChangeTag ? "forceUpdate" : "forceReplace",
        record,
      },
    ],
  });
  return result.records[0];
}

export async function deleteRecord(recordName: string): Promise<void> {
  await call("records/modify", {
    operations: [{ operationType: "forceDelete", record: { recordName } }],
  });
}

/**
 * Assets are a three-step dance: ask for a URL, PUT the bytes there, then write
 * the token the upload returns into the record's field.
 */
export interface CKAssetToken {
  fileChecksum: string;
  size: number;
  receipt: string;
  wrappingKey?: string;
  referenceChecksum?: string;
}

export async function uploadAsset(
  recordType: string,
  fieldName: string,
  bytes: Buffer,
): Promise<CKAssetToken> {
  const tokens = await call<{
    tokens: Array<{ url: string }>;
  }>("assets/upload", { tokens: [{ recordType, fieldName }] });

  const url = tokens.tokens?.[0]?.url;
  if (!url) throw new Error("CloudKit returned no upload URL");

  const response = await fetch(url, { method: "POST", body: new Uint8Array(bytes) });
  if (!response.ok) {
    throw new Error(`Asset upload failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { singleFile?: CKAssetToken };
  if (!body.singleFile) throw new Error("CloudKit returned no asset receipt");
  return body.singleFile;
}
