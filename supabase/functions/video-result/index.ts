// ===========================================
// DAJANA AI - Edge Function: Video Result (TheNewBlack)
// VIDEO_API_KEY u Supabase Secrets. Retry za 5xx / mrežu.
// ===========================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://thenewblack.ai/api/1.1/wf";
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
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

  const apiKey = Deno.env.get("VIDEO_API_KEY")?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "VIDEO_API_KEY nije podešen u Supabase Edge Function secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { jobId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Neispravan zahtev." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const jobId = body.jobId ?? (body as { id?: string }).id;
  if (!jobId || typeof jobId !== "string") {
    return new Response(JSON.stringify({ error: "jobId je obavezan." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const formData = new FormData();
  formData.append("id", jobId);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${BASE}/results_video?api_key=${apiKey}`, {
        method: "POST",
        body: formData,
      });
      const text = (await res.text()).trim();

      if (!res.ok) {
        if (res.status === 404 || text.toLowerCase().includes("not ready")) {
          return new Response(JSON.stringify({ videoUrl: null }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (attempt < MAX_ATTEMPTS && res.status >= 500) {
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
        const errMsg = res.status >= 500
          ? "Servis za video je privremeno prebukiran. Pokušajte ponovo za nekoliko trenutaka."
          : (text?.slice(0, 200) || "Greška pri proveri videa.");
        return new Response(JSON.stringify({ error: errMsg }), {
          status: res.status >= 500 ? 502 : res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const notReady =
        !text ||
        text.length < 20 ||
        !text.startsWith("http") ||
        /error|not ready|processing|pending|generating|queue/i.test(text);

      if (notReady) {
        return new Response(JSON.stringify({ videoUrl: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ videoUrl: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      const errMsg = e instanceof Error ? e.message : String(e);
      return new Response(
        JSON.stringify({ error: "Veza sa video servisom nije uspela. Pokušajte ponovo. (" + (errMsg?.slice(0, 60) ?? "") + ")" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Video još nije spreman. Pokušajte ponovo za minut." }),
    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
