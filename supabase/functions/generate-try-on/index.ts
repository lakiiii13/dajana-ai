// ===========================================
// DAJANA AI - Edge Function: Generate Try-On Image
// Koristi GEMINI_API_KEY iz Supabase Secrets
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// gemini-3-pro-image-preview = Nano Banana Pro (bolji kvalitet); gemini-2.5-flash-image = brži, slabiji
const GEMINI_MODEL = "gemini-3-pro-image-preview";

interface OutfitItem {
  title: string | null;
}

interface OutfitImage {
  base64: string;
  mimeType: string;
}

interface RequestBody {
  faceImageBase64: string;
  outfitImages: OutfitImage[];
  items: OutfitItem[];
}

interface GeminiCandidatePart {
  inlineData?: { data?: string; mimeType?: string };
  text?: string;
}

function buildTryOnPrompt(items: OutfitItem[]): string {
  const isSingle = items.length === 1;
  if (isSingle) {
    const outfitDesc = items[0].title ? ` "${items[0].title}"` : "";
    return `You are a professional fashion virtual try-on assistant. 

I'm sending you two images:
1. FIRST IMAGE: A photo of a person (face/body photo)
2. SECOND IMAGE: A fashion outfit${outfitDesc}

Your task: Generate a new, high-quality, photorealistic image of the SAME person from the first photo wearing the outfit from the second photo. 

Requirements:
- Keep the person's face, hair, and body proportions exactly the same
- The outfit should fit naturally on the person's body
- Maintain natural lighting and realistic shadows
- The background should be clean and elegant (soft neutral/fashion studio style)
- The generated image should look like a professional fashion photo
- Full body shot showing the complete outfit

Generate the image now.`;
  }
  const itemDescriptions = items
    .map((item, idx) => {
      const name = item.title ? `"${item.title}"` : `Clothing item ${idx + 1}`;
      return `  ${idx + 2}. IMAGE ${idx + 2}: ${name}`;
    })
    .join("\n");
  return `You are a professional fashion virtual try-on assistant.

I'm sending you ${items.length + 1} images:
1. FIRST IMAGE: A photo of a person (face/body photo)
${itemDescriptions}

Your task: Generate a new, high-quality, photorealistic image of the SAME person from the first photo wearing ALL the clothing items from the other images COMBINED as a single outfit.

Requirements:
- Keep the person's face, hair, and body proportions exactly the same
- Combine all the clothing items into one cohesive outfit on the person
- Each clothing piece should fit naturally on the appropriate body part
- Maintain natural lighting and realistic shadows
- The background should be clean and elegant (soft neutral/fashion studio style)
- The generated image should look like a professional fashion photo
- Full body shot showing the complete combined outfit

Generate the image now.`;
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

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey?.trim()) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured in Supabase" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { faceImageBase64, outfitImages, items } = body;
  if (!faceImageBase64 || !outfitImages?.length || !items?.length) {
    return new Response(
      JSON.stringify({ error: "Missing faceImageBase64, outfitImages, or items" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const prompt = buildTryOnPrompt(items);
  const imageParts: unknown[] = [
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: faceImageBase64 } },
  ];
  for (const img of outfitImages) {
    imageParts.push({
      inlineData: { mimeType: img.mimeType || "image/jpeg", data: img.base64 },
    });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const geminiBody = {
    contents: [{ parts: imageParts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 1.0,
      imageConfig: { aspectRatio: "3:4", imageSize: "2K" },
    },
  };

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 1500;
  function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
  function tryOnError(status: number, raw: string): string {
    if (status === 403) return "Gemini API ključ nije ispravan ili je kvota iscrpljena. Proverite GEMINI_API_KEY u Supabase.";
    if (status === 429) return "Previše zahteva. Sačekajte malo i pokušajte ponovo.";
    if (status >= 500) return "Servis za try-on je privremeno prebukiran. Pokušajte ponovo za nekoliko trenutaka.";
    try {
      const p = JSON.parse(raw);
      if (p?.error?.message && p.error.message.length < 200) return p.error.message;
    } catch {
      if (raw?.length > 0 && raw.length < 200) return raw;
    }
    return "Greška pri generisanju slike. Pokušajte ponovo.";
  }

  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      });
      const rawBody = await res.text();

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          return new Response(JSON.stringify({ error: tryOnError(res.status, rawBody) }), {
            status: res.status === 429 ? 429 : 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (attempt < MAX_ATTEMPTS && res.status >= 500) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        return new Response(JSON.stringify({ error: tryOnError(res.status, rawBody) }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let data: { candidates?: Array<{ content?: { parts?: GeminiCandidatePart[] } }> };
      try {
        data = JSON.parse(rawBody);
      } catch {
        return new Response(JSON.stringify({ error: "Neispravan odgovor servisa. Pokušajte ponovo." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const candidates = data.candidates;
      if (!candidates?.length) {
        return new Response(
          JSON.stringify({ error: "AI nije vratio sliku. Pokušajte ponovo." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const parts = candidates[0].content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return new Response(
            JSON.stringify({
              imageBase64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || "image/png",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      return new Response(
        JSON.stringify({ error: "AI nije generisao sliku. Pokušajte ponovo." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e: unknown) {
      lastErr = e;
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  return new Response(
    JSON.stringify({ error: "Veza sa try-on servisom nije uspela. Proverite internet i pokušajte ponovo. (" + (errMsg?.slice(0, 60) ?? "") + ")" }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
