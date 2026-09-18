# makamakam-web

The public site for [Makamakam](https://makamakam.com), its privacy policy, and
the admin panel the *pengurus* use to keep the burial records — so nobody has to
open the CloudKit dashboard to correct a name.

Next.js 16 (App Router), TypeScript, Tailwind v4, Auth.js v5.

```
npm install
cp .env.example .env.local     # AUTH_SECRET at minimum
npm run seed                   # fills the local store from the iOS app's survey
npm run dev
```

`ADMIN_DEV_LOGIN=1` lets you sign in without Apple keys while developing. It is
ignored in production builds.

## The three parts

| Route | What it is |
|---|---|
| `/` | The app: the three pillars, the rule that governs it, and what it refuses to do. |
| `/privacy` | Written against what the app actually does — every claim is checkable in the iOS source. |
| `/admin` | Sign in with Apple, then add and edit cemeteries, graves and photographs. |

## Storage: CloudKit, and the honest answer

**Yes, you can edit CloudKit from a web app, and there are two ways — only one of
them is right for a back office.**

- **CloudKit JS** signs a *person* in with their Apple ID and acts as them. That
  is what you want inside a user-facing web app, where each visitor reads and
  writes their own private database.
- **CloudKit Web Services with a server-to-server key** acts as the
  *application* against the public database. No Apple ID is attached to the
  write, which is exactly right for an admin panel: the records belong to the
  cemetery, not to whoever happened to be signed in. That is what `lib/ckws.ts`
  implements — ECDSA-P256 request signing, record query/modify, and the
  three-step asset upload.

Sign in with Apple still guards the panel; it decides *who may use the tool*,
while the server-to-server key decides *what the tool may write*. Two different
questions, two different mechanisms.

**With no CloudKit keys set, the admin writes JSON files under `.data/`
instead.** That is not a stub — it is how this is meant to be built and
demonstrated before a container exists, and it is what makes the whole thing
testable on a laptop. `lib/repo.ts` is the seam; both backings satisfy it.

### Turning CloudKit on

**1. Make the container exist.** In Xcode, on the iOS target: Signing &
Capabilities → **+ Capability → iCloud** → tick **CloudKit** → add a container
(`iCloud.me.babono.makamakam`). The iOS entitlements file is currently empty, so
this step is what creates the container at all.

**2. The key pair already exists.** `cloudkit-key.pem` was generated in this
directory and is gitignored; `CLOUDKIT_PRIVATE_KEY` in `.env.local` already
points at it. Print the public half again with:

```
openssl ec -in cloudkit-key.pem -pubout
```

CloudKit server-to-server keys are not downloaded from Apple like a `.p8` — you
make the key and give Apple the public half.

**3. Register it.** CloudKit Console → your container → **Tokens & Keys** →
*Server-to-Server Keys* → **Add**, paste the public key from the second command.
Apple returns a **Key ID**.

**4. Import the schema.** CloudKit Console → your container → **Schema →
Import Schema**, and choose `schema/makamakam.ckdb`.

This step cannot be skipped. Auto-created schema is a feature of the *native*
CloudKit framework in the development environment — **Web Services does not
create record types**, and a write to a type that does not exist comes back as
HTTP 200 with the failure buried inside the record it hands you. The schema file
also carries the queryable indexes, which is the other thing that cannot be
inferred from a write.

What the file defines:

| Record type | Fields |
|---|---|
| `Cemetery` | `name`, `address` (String) · `latitude`, `longitude`, `radiusMeters`, `rows`, `plotsPerRow` (Double/Int64) · `surveyedSection` (String) · `photosJSON` (String) |
| `Grave` | `cemeteryId`, `name`, `fatherName`, `gender`, `deathDate`, `section`, `religion`, `landmark`, `stewardName` (String) · `birthYear`, `row`, `plot`, `verified` (Int64) · `latitude`, `longitude` (Double) |
| `Photo` | `ownerId`, `ownerType`, `kind`, `caption`, `source` (String) · `image` (**Asset**) |

The import sets the queryable indexes too — `recordName` on all three types,
plus `cemeteryId` on Grave and `ownerId` on Photo. Without them queries come back
**empty rather than failing**, which reads exactly like "the seed did not work".
If you ever build the schema by hand instead, those five indexes are the part
that gets forgotten.

Run `npm run cloudkit:doctor` after importing: it reads only, and names whatever
is still missing.

**5. Set the environment variables** — `CLOUDKIT_CONTAINER`, `CLOUDKIT_KEY_ID`,
`CLOUDKIT_ENV=development`, and `CLOUDKIT_PRIVATE_KEY` as the *whole*
`cloudkit-key.pem` with newlines written as `\n`:

```
CLOUDKIT_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\nMHcC...\n-----END EC PRIVATE KEY-----\n"
```

**6. Fill it.** Sign in to `/admin` and press **Isi dari survei** — it writes the
27 surveyed graves into whichever backing is live. The header says which that
is, and the button reports what it wrote.

**7. Promote.** Console → Schema → **Deploy Schema Changes**, then switch
`CLOUDKIT_ENV=production`. A development schema does not exist in production
until you do this, and a production schema cannot be edited afterwards — only
added to.

### Who does what

| | |
|---|---|
| Already done | Key pair generated, `.env.local` wired, record shapes settled, `Photo` assets implemented on both sides, doctor script |
| **You, in the Console** | Register the public key → get the Key ID · flip the queryable indexes the doctor names · Deploy Schema Changes to production |
| **You, in Vercel** | The four `CLOUDKIT_*` variables, plus the Auth.js ones |
| Either of us, once the Key ID is in `.env.local` | Run the seed, verify with the doctor |

The header in the admin tells you which backing is live — "CloudKit" or
"Penyimpanan lokal" — so this is never a guess.

**A caveat worth stating plainly:** the iOS app does not read CloudKit today. It
ships a bundled `graves.json` and works with the radio off, which is deliberate
(rural reception is unreliable, and PRD §13 makes the offline bundle the
requirement and CloudKit the stretch). So the bridge is the **Unduh graves.json**
button on each cemetery: it emits exactly the file
`makamakam/Resources/graves.json` expects. Edit here, export, drop it into the
app. When the app does adopt CloudKit, the same records are already in place.

## Sign in with Apple

1. Create a **Service ID** (e.g. `com.makamakam.web`) and enable Sign in with
   Apple on it, with `https://makamakam.com/api/auth/callback/apple` as the
   return URL.
2. Create a **Sign in with Apple key** and download the `.p8`.
3. Mint the client secret — Apple's expires within six months:

   ```
   npm run apple-secret -- --team ABCDE12345 --key-id XYZ9876543 \
     --service-id com.makamakam.web --p8 ./AuthKey_XYZ9876543.p8
   ```

4. Set `AUTH_APPLE_ID` (the Service ID), `AUTH_APPLE_SECRET` (the minted JWT),
   and `ADMIN_EMAILS`.

### Two doors, two keys

CloudKit never checks who is signed in. The **server-to-server key acts as the
application**, so anything reaching `lib/ckws.ts` is already trusted — which
means Sign in with Apple is not protecting CloudKit, it is protecting *the
panel*. Apple proves the person owns an Apple ID; `ADMIN_EMAILS` decides whether
that particular Apple ID may use the tool. An address outside the list is turned
away at the door and never reaches CloudKit at all.

That also means the allowlist is the *only* thing standing between a stranger
with an Apple ID and the burial records, so treat it as such.

`ADMIN_EMAILS` empty means **nobody** gets in. This panel edits the record of
where people are buried; the safe failure is a closed door. Apple's private-relay
addresses are stable per app, so paste whatever address the first sign-in
reports rather than guessing.

## A CloudKit habit worth knowing

Two things about this API cost an afternoon each, and both are now handled in
code rather than in anyone's memory:

- **`records/modify` answers HTTP 200 and puts per-record failures inside the
  response.** A write that never happened looks exactly like one that did.
  `saveRecord` inspects what comes back.
- **The query index is eventually consistent.** A record written a moment ago is
  fetchable by name at once, but takes a second or two to appear in a *query* —
  so a page that re-renders straight after a write shows nothing, which reads as
  a failed save. `waitForPhoto` and `waitForCemeteries` wait it out.

## Photographs

With CloudKit on, every photograph is its own `Photo` record with an **asset**
field. Assets belong to a field rather than to a record, so a list of them cannot
live inside a grave — and putting each one in its own record means a photograph
can be deleted without rewriting the grave, and that a grave's record stays
small.

The record carries `source`, the file name the iOS app caches the downloaded
asset under, so a photograph that has been fetched once is available offline
afterwards.

Without CloudKit they are written to `public/uploads` and listed inside the
owner's JSON. That path is **for development only** — a serverless deploy has no
durable disk, so anything uploaded there is gone by the next request.

An empty set is normal and is left empty: many families have no photograph of the
person, and some would not want one shown.

## Deploying

Vercel, with `makamakam.com` pointed at it. Set every variable from
`.env.example` except `ADMIN_DEV_LOGIN`, and set `AUTH_URL=https://makamakam.com`.

`.data/` and `public/uploads` are local-disk storage and do **not** survive a
serverless deploy — turn CloudKit on before relying on the admin in production,
or point the two write paths at object storage.
