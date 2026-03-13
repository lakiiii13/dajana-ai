// ===========================================
// DAJANA AI - Edge Function: Outfit Advice (Gemini Vision)
// Analiza outfita iz slike — koristi Gemini umesto OpenAI da ne bi dobijali "I can't assist" na slikama sa ljudima.
// GEMINI_API_KEY u Supabase Secrets (isti kao za generate-try-on).
// ===========================================

import { verifyAuth, checkRateLimit, checkCredits } from "../_shared/guards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
};

const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

interface RequestBody {
  systemPrompt: string;
  userText: string;
  imageBase64: string;
  mimeType?: string;
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

  const rlErr = checkRateLimit(auth.userId, "outfit-advice", 15, corsHeaders);
  if (rlErr) return rlErr;

  const creditErr = await checkCredits(auth.userId, "analysis", corsHeaders);
  if (creditErr) return creditErr;

  const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY nije podešen u Supabase Secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Neispravan zahtev." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { systemPrompt, userText, imageBase64, mimeType = "image/png" } = body;
  if (!systemPrompt || !userText || !imageBase64) {
    return new Response(
      JSON.stringify({ error: "Obavezno: systemPrompt, userText, imageBase64." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const fullPrompt = `${systemPrompt}\n\n---\nKorisnica kaže:\n${userText}`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const geminiBody = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: fullPrompt },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200,
    },
  };

  function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[outfit-advice] attempt ${attempt}/${MAX_ATTEMPTS}`);
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });
      const rawBody = await res.text();

      if (!res.ok) {
        if (res.status === 429) {
          return new Response(
            JSON.stringify({ error: "Previše zahteva. Sačekajte malo i pokušajte ponovo." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (attempt < MAX_ATTEMPTS && res.status >= 500) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        const errMsg = rawBody?.length < 300 ? rawBody : "Greška pri analizi outfita. Pokušajte ponovo.";
        return new Response(JSON.stringify({ error: errMsg }), {
          status: res.status >= 500 ? 502 : res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      try {
        data = JSON.parse(rawBody);
      } catch {
        if (attempt < MAX_ATTEMPTS) { await sleep(RETRY_DELAY_MS * attempt); continue; }
        return new Response(JSON.stringify({ error: "Neispravan odgovor servisa." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const textPart = data.candidates?.[0]?.content?.parts?.find((p) => p.text);
      const content = textPart?.text?.trim();
      if (!content) {
        if (attempt < MAX_ATTEMPTS) { await sleep(RETRY_DELAY_MS * attempt); continue; }
        return new Response(JSON.stringify({ error: "AI nije vratio odgovor. Pokušajte ponovo." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      if (attempt < MAX_ATTEMPTS) { await sleep(RETRY_DELAY_MS * attempt); continue; }
      const errMsg = e instanceof Error ? e.message : String(e);
      return new Response(
        JSON.stringify({ error: "Veza sa servisom nije uspela. (" + (errMsg?.slice(0, 80) ?? "") + ")" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Analiza outfita nije uspela. Pokušajte ponovo." }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
