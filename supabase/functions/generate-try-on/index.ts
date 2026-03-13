// ===========================================
// DAJANA AI - Edge Function: Generate Try-On Image
// Koristi GEMINI_API_KEY iz Supabase Secrets
// ===========================================

import { verifyAuth, checkRateLimit, checkCredits } from "../_shared/guards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
};

const GEMINI_PRIMARY = "gemini-3-pro-image-preview";
const OPENAI_FALLBACK_MODEL = "gpt-image-1";

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

CRITICAL IDENTITY RULES:
- The face must remain exactly the same person as in the source image
- Do not change facial structure, face shape, eyes, eyelids, eyebrows, nose, lips, jawline, cheekbones, forehead, ears, or chin
- Keep the exact same skin tone, undertone, facial proportions, eye spacing, nose width, lip shape, and bone structure
- Preserve the exact same hair color, hairstyle, hairline, and all visible personal details
- Do not beautify, retouch, glamorize, age up, age down, or make the person look like someone else
- Do not change makeup style unless it already exists in the source image
- The result must be unmistakably the same person on first glance

BODY AND STYLING RULES:
- Keep body proportions exactly the same
- The outfit should fit naturally and realistically on the person's body
- Preserve a realistic pose and natural garment drape
- Keep the person fully inside the frame
- Full body shot showing the complete outfit

IMAGE QUALITY RULES:
- Maintain natural lighting and realistic shadows
- Keep the composition clean, elegant, and photorealistic
- Background should stay simple, neutral, and non-distracting
- Do not add extra accessories, props, extra limbs, extra fingers, or distorted anatomy
- Do not crop out the face or any important body part
- The final result should look like a premium professional fashion photo

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

CRITICAL IDENTITY RULES:
- The face must remain exactly the same person as in the source image
- Do not change facial structure, face shape, eyes, eyelids, eyebrows, nose, lips, jawline, cheekbones, forehead, ears, or chin
- Keep the exact same skin tone, undertone, facial proportions, eye spacing, nose width, lip shape, and bone structure
- Preserve the exact same hair color, hairstyle, hairline, and all visible personal details
- Do not beautify, retouch, glamorize, age up, age down, or make the person look like someone else
- Do not change makeup style unless it already exists in the source image
- The result must be unmistakably the same person on first glance

BODY AND STYLING RULES:
- Keep body proportions exactly the same
- Combine all the clothing items into one cohesive outfit on the person
- Each clothing piece should fit naturally on the appropriate body part
- Keep the person fully inside the frame
- Full body shot showing the complete combined outfit

IMAGE QUALITY RULES:
- Maintain natural lighting and realistic shadows
- Keep the composition clean, elegant, and photorealistic
- Background should stay simple, neutral, and non-distracting
- Do not add extra accessories, props, extra limbs, extra fingers, or distorted anatomy
- Do not crop out the face or any important body part
- The final result should look like a premium professional fashion photo

Generate the image now.`;
}

async function callOpenAIFallback(
  openaiKey: string,
  faceBase64: string,
  outfitImages: OutfitImage[],
  items: OutfitItem[]
): Promise<Response | null> {
  const MAX_OPENAI_ATTEMPTS = 2;
  const OPENAI_DELAY = 5000;

  const prompt = buildTryOnPrompt(items);

  const images: { image_url: string }[] = [
    { image_url: `data:image/jpeg;base64,${faceBase64}` },
  ];
  for (const img of outfitImages) {
    const mime = img.mimeType || "image/jpeg";
    images.push({ image_url: `data:${mime};base64,${img.base64}` });
  }

  const body = {
    model: OPENAI_FALLBACK_MODEL,
    prompt,
    images,
    n: 1,
    size: "1024x1536" as const,
    quality: "high" as const,
  };

  for (let attempt = 1; attempt <= MAX_OPENAI_ATTEMPTS; attempt++) {
    try {
      console.log(`[TryOn] OpenAI ${OPENAI_FALLBACK_MODEL} attempt ${attempt}/${MAX_OPENAI_ATTEMPTS}`);

      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        console.error(`[TryOn] OpenAI HTTP ${res.status}:`, errBody.slice(0, 300));
        if (res.status === 429 || res.status >= 500) {
          if (attempt < MAX_OPENAI_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, OPENAI_DELAY * attempt));
            continue;
          }
        }
        return null;
      }

      const data = await res.json();
      const imageData = data?.data?.[0]?.b64_json;
      if (imageData) {
        console.log(`[TryOn] OpenAI returned image on attempt ${attempt}`);
        return new Response(
          JSON.stringify({ imageBase64: imageData, mimeType: "image/png" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[TryOn] OpenAI returned no image data");
      if (attempt < MAX_OPENAI_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, OPENAI_DELAY));
        continue;
      }
    } catch (e: unknown) {
      console.error("[TryOn] OpenAI error:", e instanceof Error ? e.message : e);
      if (attempt < MAX_OPENAI_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, OPENAI_DELAY));
      }
    }
  }
  return null;
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

  const rlErr = checkRateLimit(auth.userId, "generate-try-on", 10, corsHeaders);
  if (rlErr) return rlErr;

  const creditErr = await checkCredits(auth.userId, "image", corsHeaders);
  if (creditErr) return creditErr;

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

  const geminiBodyBase = {
    contents: [{ parts: imageParts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      temperature: 0.4,
      imageConfig: { aspectRatio: "3:4", imageSize: "2K" },
    },
  };

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 4000;
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

  interface GeminiCandidate {
    content?: { parts?: GeminiCandidatePart[] };
    finishReason?: string;
  }

  function extractImageFromCandidates(
    candidates: GeminiCandidate[] | undefined
  ): { imageBase64: string; mimeType: string } | null {
    if (!candidates?.length) return null;
    const parts = candidates[0].content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || "image/png",
        };
      }
    }
    return null;
  }

  function getFilterReason(candidates: GeminiCandidate[] | undefined): string | null {
    if (!candidates?.length) return null;
    const c = candidates[0] as Record<string, unknown>;
    if (c.finishReason === "SAFETY") return "Slika je blokirana zbog sigurnosnog filtera. Pokušajte sa drugom fotografijom.";
    if (typeof c.raiFilteredReason === "string") return `Slika filtrirana: ${(c.raiFilteredReason as string).slice(0, 120)}`;
    return null;
  }

  async function callGemini(model: string): Promise<Response | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        console.log(`[TryOn] ${model} attempt ${attempt}/${MAX_ATTEMPTS}`);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBodyBase),
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
            console.log(`[TryOn] HTTP ${res.status}, retrying in ${RETRY_DELAY_MS * attempt}ms...`);
            await sleep(RETRY_DELAY_MS * attempt);
            continue;
          }
          return new Response(JSON.stringify({ error: tryOnError(res.status, rawBody) }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let data: { candidates?: GeminiCandidate[] };
        try {
          data = JSON.parse(rawBody);
        } catch {
          if (attempt < MAX_ATTEMPTS) { await sleep(RETRY_DELAY_MS * attempt); continue; }
          return null;
        }

        const image = extractImageFromCandidates(data.candidates);
        if (image) {
          console.log(`[TryOn] ${model} returned image on attempt ${attempt}`);
          return new Response(JSON.stringify(image), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const filterReason = getFilterReason(data.candidates);
        if (filterReason) {
          console.log(`[TryOn] ${model} safety filter: ${filterReason}`);
          return null;
        }

        console.log(`[TryOn] ${model} returned 200 but no image, attempt ${attempt}`);
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
      } catch (e: unknown) {
        lastErr = e;
        if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
      }
    }
    return null;
  }

  // 1) Pokušaj primarni model (Gemini 3 Pro) — do 3 pokušaja, delay 4/8/12s
  const primaryResult = await callGemini(GEMINI_PRIMARY);
  if (primaryResult) return primaryResult;

  // 2) Fallback na OpenAI gpt-image-1
  const openaiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (openaiKey) {
    console.log("[TryOn] Gemini failed, trying OpenAI fallback...");
    const openaiResult = await callOpenAIFallback(openaiKey, faceImageBase64, outfitImages, items);
    if (openaiResult) return openaiResult;
  } else {
    console.log("[TryOn] No OPENAI_API_KEY set, skipping fallback.");
  }

  // 3) Svi modeli nisu uspeli
  return new Response(
    JSON.stringify({ error: "AI nije uspeo da generiše sliku ni posle više pokušaja. Pokušajte sa drugom fotografijom ili probajte ponovo za par minuta." }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
