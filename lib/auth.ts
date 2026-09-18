import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";

/**
 * Who may edit the burial records.
 *
 * Sign in with Apple, and then an allowlist: ADMIN_EMAILS is a comma-separated
 * list of the Apple IDs permitted in. An empty allowlist locks everyone out
 * rather than letting everyone in — this panel edits the record of where people
 * are buried, and the safe failure is a closed door.
 *
 * Apple's private-relay addresses are stable per app, so paste whatever address
 * the first sign-in reports rather than guessing at it.
 */

const allowlist = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

const devLoginEnabled =
  process.env.ADMIN_DEV_LOGIN === "1" && process.env.NODE_ENV !== "production";

export const allowedAdminEmails = allowlist;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...(process.env.AUTH_APPLE_ID ? [Apple] : []),
    ...(devLoginEnabled
      ? [
          Credentials({
            id: "dev",
            name: "Local development",
            credentials: { email: { label: "Email" } },
            authorize: async (credentials) => {
              const email = String(credentials?.email ?? "").toLowerCase();
              if (!email) return null;
              return { id: email, email, name: "Local admin" };
            },
          }),
        ]
      : []),
  ],
  pages: { signIn: "/admin/login" },
  callbacks: {
    signIn: ({ user }) => isAdmin(user.email),
  },
  trustHost: true,
});

/**
 * Two separate questions, deliberately answered by two separate systems:
 *
 * - *Who may use this panel?* — this function, over a Sign in with Apple
 *   session. CloudKit has no opinion about it.
 * - *What may the server write?* — the server-to-server key in `lib/ckws.ts`,
 *   which acts as the application. It never sees an Apple ID.
 *
 * So an Apple ID outside the allowlist is turned away here, at the door, and
 * never reaches CloudKit at all.
 */
export function isAdmin(email?: string | null): boolean {
  // A session is required either way: the development bypass loosens *who* may
  // sign in, never whether signing in is needed at all.
  if (!email) return false;
  // With an allowlist set, even the local bypass honours it — otherwise
  // development behaves differently from production in exactly the place where
  // that matters most.
  if (devLoginEnabled && allowlist.length === 0) return true;
  return allowlist.includes(email.toLowerCase());
}
