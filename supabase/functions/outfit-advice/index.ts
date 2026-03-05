// ===========================================
// DAJANA AI - Edge Function: Outfit Advice (Gemini Vision)
// Analiza outfita iz slike — koristi Gemini umesto OpenAI da ne bi dobijali "I can't assist" na slikama sa ljudima.
// GEMINI_API_KEY u Supabase Secrets (isti kao za generate-try-on).
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Vision + text odgovor (nije generisanje slike). Koristi model koji podržava generateContent na v1beta.
const GEMINI_MODEL = "gemini-2.0-flash";

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

  try {
    const res = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });
    const rawBody = await res.text();

    if (!res.ok) {
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
      return new Response(JSON.stringify({ error: "Neispravan odgovor servisa." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const textPart = data.candidates?.[0]?.content?.parts?.find((p) => p.text);
    const content = textPart?.text?.trim();
    if (!content) {
      return new Response(JSON.stringify({ error: "AI nije vratio odgovor. Pokušajte ponovo." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: "Veza sa servisom nije uspela. (" + (errMsg?.slice(0, 80) ?? "") + ")" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
