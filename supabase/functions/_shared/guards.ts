// ===========================================
// DAJANA AI - Shared Security Guards
// JWT verification, per-user rate limiting, server-side credit check.
// Import from "../_shared/guards.ts" in each edge function.
// ===========================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==================== AUTH ====================

interface AuthOk {
  userId: string;
  error?: undefined;
}
interface AuthFail {
  userId?: undefined;
  error: Response;
}

export async function verifyAuth(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<AuthOk | AuthFail> {
  const jwt =
    req.headers.get("x-user-jwt")?.trim() ||
    "";

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!jwt || jwt === anonKey) {
    return {
      error: new Response(
        JSON.stringify({ error: "Morate biti prijavljeni." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      anonKey,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );
    const {
      data: { user },
      error,
    } = await sb.auth.getUser();

    if (error || !user) {
      return {
        error: new Response(
          JSON.stringify({ error: "Sesija je istekla. Prijavite se ponovo." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        ),
      };
    }
    return { userId: user.id };
  } catch {
    return {
      error: new Response(
        JSON.stringify({ error: "Greška pri autentifikaciji." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }
}

// ==================== RATE LIMITING ====================
// In-memory per Deno isolate — survives warm invocations,
// resets on cold start.  Sufficient to stop rapid abuse;
// the credit system provides the hard usage cap.

const _rl = new Map<string, number[]>();
let _lastClean = Date.now();

export function checkRateLimit(
  userId: string,
  fnName: string,
  maxPerMinute: number,
  corsHeaders: Record<string, string>
): Response | null {
  const now = Date.now();

  if (now - _lastClean > 300_000) {
    _lastClean = now;
    for (const [k, v] of _rl) {
      const fresh = v.filter((t) => now - t < 120_000);
      if (fresh.length === 0) _rl.delete(k);
      else _rl.set(k, fresh);
    }
  }

  const key = `${userId}:${fnName}`;
  const window = 60_000;
  const times = (_rl.get(key) ?? []).filter((t) => now - t < window);

  if (times.length >= maxPerMinute) {
    return new Response(
      JSON.stringify({
        error: "Previše zahteva. Sačekajte malo i pokušajte ponovo.",
      }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  times.push(now);
  _rl.set(key, times);
  return null;
}

// ==================== CREDIT CHECK ====================

export type CreditType = "image" | "video" | "analysis";

const LIMITS: Record<CreditType, number> = {
  image: 50,
  video: 2,
  analysis: 2,
};
const CYCLE_DAYS = 31;

export async function checkCredits(
  userId: string,
  creditType: CreditType,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await admin
      .from("user_credits")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[Guard] Credit DB error:", error.message);
      return null;
    }
    if (!data) return null;

    const lastReset = data.last_reset_date
      ? new Date(data.last_reset_date)
      : null;
    if (
      !lastReset ||
      (Date.now() - lastReset.getTime()) / 86_400_000 >= CYCLE_DAYS
    ) {
      await admin
        .from("user_credits")
        .update({
          image_credits_used: 0,
          video_credits_used: 0,
          analysis_credits_used: 0,
          last_reset_date: new Date().toISOString(),
        })
        .eq("user_id", userId);
      return null;
    }

    const used: number = data[`${creditType}_credits_used`] ?? 0;
    const limit: number =
      data[`${creditType}_credits_limit`] ?? LIMITS[creditType];
    const bonus: number = data[`bonus_${creditType}_credits`] ?? 0;
    const remaining = limit - used + bonus;

    if (remaining <= 0) {
      return new Response(
        JSON.stringify({
          error: "Nemate dovoljno kredita za ovu operaciju.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return null;
  } catch (e) {
    console.error("[Guard] Credit check error:", e);
    return null;
  }
}
