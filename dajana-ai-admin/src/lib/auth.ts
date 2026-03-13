import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

export interface AdminSession {
  id: string;
  email: string;
  role: string;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET mora biti podešen (.env.local) i imati najmanje 32 karaktera."
    );
  }
  return secret;
}

export function signSessionToken(payload: AdminSession): string {
  const json = JSON.stringify(payload);
  const payloadB64 = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): AdminSession | null {
  const dotIdx = token.indexOf(".");
  if (dotIdx < 1) return null;

  const payloadB64 = token.slice(0, dotIdx);
  const signature = token.slice(dotIdx + 1);

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  if (signature.length !== expectedSig.length) return null;

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const session = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as AdminSession;

    if (session.exp < Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");

  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Verifies token signature AND checks admin_users table to confirm
 * the account is still active. Use for destructive/sensitive operations
 * (push notifications, data deletion, etc.).
 */
export async function getValidatedAdminSession(): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("is_active")
      .eq("id", session.id)
      .single();

    if (error || !data || !data.is_active) return null;

    return session;
  } catch {
    return null;
  }
}
