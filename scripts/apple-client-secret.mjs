/**
 * Apple does not hand out a client secret; you mint one, and it expires within
 * six months. Run this again whenever it does:
 *
 *   node scripts/apple-client-secret.mjs \
 *     --team ABCDE12345 --key-id XYZ9876543 \
 *     --service-id com.makamakam.web --p8 ./AuthKey_XYZ9876543.p8
 *
 * Put the result in AUTH_APPLE_SECRET.
 */
import { readFileSync } from "node:fs";
import crypto from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, all) => {
    if (value.startsWith("--")) pairs.push([value.slice(2), all[index + 1]]);
    return pairs;
  }, []),
);

for (const required of ["team", "key-id", "service-id", "p8"]) {
  if (!args[required]) {
    console.error(`Missing --${required}`);
    process.exit(1);
  }
}

const base64url = (input) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const now = Math.floor(Date.now() / 1000);
const header = base64url(JSON.stringify({ alg: "ES256", kid: args["key-id"] }));
const payload = base64url(
  JSON.stringify({
    iss: args.team,
    iat: now,
    exp: now + 60 * 60 * 24 * 180,
    aud: "https://appleid.apple.com",
    sub: args["service-id"],
  }),
);

const signature = crypto
  .sign("sha256", Buffer.from(`${header}.${payload}`), {
    key: readFileSync(args.p8, "utf8"),
    dsaEncoding: "ieee-p1363",
  })
  .toString("base64")
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

console.log(`${header}.${payload}.${signature}`);
