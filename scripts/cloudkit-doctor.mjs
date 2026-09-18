/**
 * Checks a CloudKit container the way the admin will use it, and says exactly
 * what is missing.
 *
 *   npm run cloudkit:doctor
 *
 * Reads CLOUDKIT_* from .env.local. It only reads — nothing is written, so this
 * is safe to run against production.
 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

const container = process.env.CLOUDKIT_CONTAINER;
const keyID = process.env.CLOUDKIT_KEY_ID;
const environment = process.env.CLOUDKIT_ENV ?? "development";
const rawKey = process.env.CLOUDKIT_PRIVATE_KEY;

if (!container || !keyID || !rawKey) {
  console.error("Missing CLOUDKIT_CONTAINER, CLOUDKIT_KEY_ID or CLOUDKIT_PRIVATE_KEY.");
  process.exit(1);
}

const key = crypto.createPrivateKey(rawKey.replace(/\\n/g, "\n"));

async function call(operation, body) {
  const path = `/database/1/${container}/${environment}/public/${operation}`;
  const payload = JSON.stringify(body);
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const hashed = crypto.createHash("sha256").update(payload, "utf8").digest("base64");
  const signature = crypto
    .sign("sha256", Buffer.from(`${date}:${hashed}:${path}`, "utf8"), { key, dsaEncoding: "der" })
    .toString("base64");

  const response = await fetch(`https://api.apple-cloudkit.com${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Apple-CloudKit-Request-KeyID": keyID,
      "X-Apple-CloudKit-Request-ISO8601Date": date,
      "X-Apple-CloudKit-Request-SignatureV1": signature,
    },
    body: payload,
  });

  return { status: response.status, body: await response.text() };
}

console.log(`Container ${container} (${environment})\n`);

for (const recordType of ["Cemetery", "Grave", "Photo"]) {
  const { status, body } = await call("records/query", {
    query: { recordType },
    resultsLimit: 1,
  });

  if (status === 200) {
    const count = (JSON.parse(body).records ?? []).length;
    console.log(`  ${recordType}: reachable, ${count > 0 ? "has records" : "empty"}`);
    continue;
  }

  const reason = (() => {
    try {
      return JSON.parse(body).reason ?? body;
    } catch {
      return body;
    }
  })();

  if (/Unknown type|did not find record type/i.test(reason)) {
    console.log(`  ${recordType}: not created yet — seed once in development and it appears`);
  } else if (/not marked queryable|recordName/i.test(reason)) {
    console.log(`  ${recordType}: exists, but needs the recordName QUERYABLE index`);
  } else if (status === 401) {
    console.log(`  ${recordType}: rejected the key — check CLOUDKIT_KEY_ID and the .pem`);
  } else {
    console.log(`  ${recordType}: ${status} ${reason}`);
  }
}

console.log("\nQueryable indexes needed: recordName on all three, plus cemeteryId (Grave) and ownerId (Photo).");
