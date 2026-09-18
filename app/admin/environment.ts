"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, isAdmin } from "@/lib/auth";

/**
 * Switches which CloudKit database the panel is working against.
 *
 * Kept in a cookie rather than an environment variable so that one deployment
 * can manage both, and so switching does not need a redeploy. It is a real
 * switch between two separate sets of records, not a display preference.
 */
export async function setEnvironmentAction(form: FormData) {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) throw new Error("Not permitted");

  const chosen = String(form.get("environment") ?? "development");
  const environment = chosen === "production" ? "production" : "development";

  (await cookies()).set("cloudkit-env", environment, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/admin", "layout");
}
