// ===========================================
// DAJANA AI - Edge Function: Chat (OpenAI)
// OPENAI_API_KEY u Supabase Secrets. Retry + jasne poruke grešaka.
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1200;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function chatError(status: number, raw: string): string {
  if (status === 401) return "OpenAI API ključ nije ispravan. Proverite OPENAI_API_KEY u Supabase Secrets.";
  if (status === 429) return "Previše zahteva. Sačekajte malo i pokušajte ponovo.";
  if (status === 503 || status >= 500) return "Chat servis je privremeno prebukiran. Pokušajte ponovo za nekoliko trenutaka.";
  try {
    const p = JSON.parse(raw);
    if (p?.error?.message && p.error.message.length < 250) return p.error.message;
  } catch {
    if (raw?.length > 0 && raw.length < 250) return raw;
  }
  return "Greška pri odgovoru. Pokušajte ponovo.";
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

  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY nije podešen u Supabase Edge Function secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { model?: string; messages?: unknown[]; max_tokens?: number; temperature?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Neispravan zahtev." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { model = "gpt-4o", messages, max_tokens = 1200, temperature = 0.7 } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "Poruke su obavezne." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages, max_tokens, temperature }),
      });
      const rawBody = await res.text();

      if (res.ok) {
        let data: { choices?: Array<{ message?: { content?: string } }> };
        try {
          data = JSON.parse(rawBody);
        } catch {
          return new Response(JSON.stringify({ error: "Neispravan odgovor servisa." }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const content = data.choices?.[0]?.message?.content;
        if (content == null) {
          return new Response(JSON.stringify({ error: "AI nije vratio odgovor. Pokušajte ponovo." }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ content }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (res.status === 401 || res.status === 429) {
        return new Response(JSON.stringify({ error: chatError(res.status, rawBody) }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (attempt < MAX_ATTEMPTS && res.status >= 500) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      return new Response(JSON.stringify({ error: chatError(res.status, rawBody) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      lastErr = e;
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  return new Response(
    JSON.stringify({ error: "Veza sa chat servisom nije uspela. Proverite internet i pokušajte ponovo. (" + (errMsg?.slice(0, 60) ?? "") + ")" }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
