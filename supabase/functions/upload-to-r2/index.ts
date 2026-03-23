// ===========================================
// DAJANA AI - Edge Function: Upload/Delete to Cloudflare R2
// S3-compatible API; credentials in Supabase Secrets.
// ===========================================

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "npm:@aws-sdk/client-s3@3.700.0";
import { verifyAuth, checkRateLimit } from "../_shared/guards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt",
};

const BUCKET = Deno.env.get("R2_BUCKET_NAME") ?? "dajana-media";
const PUBLIC_URL = (Deno.env.get("R2_PUBLIC_URL") ?? "").replace(/\/$/, "");
const ENDPOINT = Deno.env.get("R2_S3_ENDPOINT") ?? "https://4df8db7a24ea348b7c55ba8d768855b4.r2.cloudflarestorage.com";

function getClient(): S3Client {
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set in Supabase Secrets.");
  }
  return new S3Client({
    region: "auto",
    endpoint: ENDPOINT,
    credentials: { accessKeyId, secretAccessKey },
  });
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

  const rlErr = checkRateLimit(auth.userId, "upload-r2", 30, corsHeaders);
  if (rlErr) return rlErr;

  if (!PUBLIC_URL) {
    return new Response(
      JSON.stringify({ error: "R2_PUBLIC_URL must be set in Supabase Secrets (e.g. https://pub-xxx.r2.dev)." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: { action: "upload" | "delete"; key: string; bodyBase64?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body. Need action, key; for upload also bodyBase64 and contentType." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { action, key } = body;
  if (!key || typeof key !== "string" || !key.trim()) {
    return new Response(JSON.stringify({ error: "Missing or invalid key." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const k = key.trim();
  const uid = auth.userId;
  const allowed =
    k.startsWith(`try-on/${uid}/`) ||
    k.startsWith(`videos/${uid}/`) ||
    k.startsWith("videos/anon/") ||
    k.startsWith("sources/");
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Key must be scoped to your user (try-on/{userId}/, videos/{userId}/, or sources/)." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const client = getClient();

  if (action === "delete") {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: "R2 delete failed: " + msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (action === "upload") {
    const { bodyBase64, contentType } = body;
    if (!bodyBase64 || typeof bodyBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Upload requires bodyBase64." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const buf = Uint8Array.from(atob(bodyBase64), (c) => c.charCodeAt(0));
    const ct = (contentType && typeof contentType === "string") ? contentType : "application/octet-stream";
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: k,
          Body: buf,
          ContentType: ct,
        })
      );
      const url = `${PUBLIC_URL}/${k}`;
      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return new Response(JSON.stringify({ error: "R2 upload failed: " + msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ error: "action must be upload or delete." }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
