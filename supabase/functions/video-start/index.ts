// ===========================================
// DAJANA AI - Edge Function: Video Start (TheNewBlack)
// VIDEO_API_KEY u Supabase Secrets. Retry + jasne poruke grešaka.
// ===========================================

import { verifyAuth, checkRateLimit, checkCredits } from "../_shared/guards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
};

const BASE = "https://thenewblack.ai/api/1.1/wf";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function videoStartError(status: number, raw: string): string {
  if (status === 401 || status === 403) return "Video API ključ nije ispravan ili nema pristupa. Proverite VIDEO_API_KEY u Supabase Secrets.";
  if (status === 429) return "Previše zahteva. Sačekajte malo i pokušajte ponovo.";
  if (status >= 500) return "Servis za video je privremeno prebukiran. Pokušajte ponovo za nekoliko trenutaka.";
  if (raw?.length > 0 && raw.length < 300) return raw;
  return "Greška pri pokretanju videa. Pokušajte ponovo.";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await verifyAuth(req, corsHeaders);
  if (auth.error) return auth.error;

  const rlErr = checkRateLimit(auth.userId, "video-start", 10, corsHeaders);
  if (rlErr) return rlErr;

  const creditErr = await checkCredits(auth.userId, "video", corsHeaders);
  if (creditErr) return creditErr;

  const apiKey = Deno.env.get("VIDEO_API_KEY")?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "VIDEO_API_KEY nije podešen u Supabase Edge Function secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { image: string; prompt: string; time: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Neispravan zahtev." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { image, prompt, time } = body;
  if (!image || !prompt || !time) {
    return new Response(JSON.stringify({ error: "Potrebni su image, prompt i time." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const formData = new FormData();
  formData.append("image", image);
  formData.append("prompt", prompt);
  formData.append("time", time);

  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${BASE}/ai-video?api_key=${apiKey}`, {
        method: "POST",
        body: formData,
      });
      const responseText = await res.text();

      if (res.ok) {
        const jobId = responseText.trim();
        return new Response(JSON.stringify({ jobId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (res.status === 401 || res.status === 403 || res.status === 429) {
        const errMsg = videoStartError(res.status, responseText);
        return new Response(JSON.stringify({ error: errMsg }), {
          status: res.status === 429 ? 429 : 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
      else {
        const errMsg = videoStartError(res.status, responseText);
        console.error("[video-start] API error:", res.status, responseText?.slice(0, 200));
        return new Response(JSON.stringify({ error: errMsg }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (e: unknown) {
      lastErr = e;
      console.error("[video-start] fetch failed:", e instanceof Error ? e.message : String(e));
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  console.error("[video-start] all retries failed:", errMsg);
  return new Response(
    JSON.stringify({ error: "Veza sa video servisom nije uspela. Proverite internet i pokušajte ponovo. (" + (errMsg?.slice(0, 80) ?? "") + ")" }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
