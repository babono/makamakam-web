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
    signIn: ({ user }) => {
      if (devLoginEnabled) return true;
      const email = user.email?.toLowerCase();
      return Boolean(email && allowlist.includes(email));
    },
  },
  trustHost: true,
});

export function isAdmin(email?: string | null): boolean {
  // A session is required either way: the development bypass loosens *who* may
  // sign in, never whether signing in is needed at all.
  if (!email) return false;
  if (devLoginEnabled) return true;
  return allowlist.includes(email.toLowerCase());
}
