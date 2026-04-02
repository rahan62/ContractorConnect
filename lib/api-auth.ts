import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Stable machine-readable code for clients (e.g. redirect to sign-in). */
export const UNAUTHENTICATED_ERROR = "UNAUTHENTICATED" as const;

export const DEFAULT_UNAUTHORIZED_MESSAGE =
  "You must be signed in to access this resource.";

export function jsonUnauthorized(message: string = DEFAULT_UNAUTHORIZED_MESSAGE) {
  return NextResponse.json(
    { error: UNAUTHENTICATED_ERROR, message },
    { status: 401 }
  );
}

export type RequireSessionResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/**
 * Use on API route handlers that must only run for signed-in users.
 * Example:
 *   const auth = await requireSession();
 *   if (!auth.ok) return auth.response;
 *   const email = auth.session.user!.email!;
 */
export async function requireSession(): Promise<RequireSessionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { ok: false, response: jsonUnauthorized() };
  }
  return { ok: true, session };
}
