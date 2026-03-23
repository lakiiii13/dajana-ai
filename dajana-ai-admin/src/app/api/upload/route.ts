// ===========================================
// DAJANA AI Admin - Upload slike (galerija / fajl)
// Otprema u Cloudflare R2 ako je podešen, inače u Supabase Storage. Vraća public URL.
// ===========================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const SUPABASE_BUCKET = "outfit-images";
const R2_KEY_PREFIX = "outfit-images/";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function getR2Client(): S3Client | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_S3_ENDPOINT ?? "https://4df8db7a24ea348b7c55ba8d768855b4.r2.cloudflarestorage.com";
  if (!accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Nijedan fajl nije poslat. Koristite polje 'file'." },
        { status: 400 }
      );
    }

    const type = file.type?.toLowerCase() || "";
    if (!type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Dozvoljeni su samo slikovni fajlovi (jpg, png, webp, itd.)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Slika može biti najviše 5 MB." },
        { status: 400 }
      );
    }

    const ext = type.replace("image/", "") || "jpg";
    const name = `outfit_${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const r2 = getR2Client();
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

    if (r2 && publicUrl) {
      const bucket = process.env.R2_BUCKET_NAME ?? "dajana-media";
      const key = `${R2_KEY_PREFIX}${name}`;
      await r2.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );
      const url = `${publicUrl}/${key}`;
      return NextResponse.json({ url });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(name, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      if (error.message?.includes("Bucket not found")) {
        await supabase.storage.createBucket(SUPABASE_BUCKET, {
          public: true,
          fileSizeLimit: MAX_SIZE,
        });
        const retry = await supabase.storage
          .from(SUPABASE_BUCKET)
          .upload(name, buffer, {
            contentType: file.type,
            upsert: true,
          });
        if (retry.error) {
          return NextResponse.json(
            { error: "Greška pri otpremanju: " + retry.error.message },
            { status: 500 }
          );
        }
        const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(retry.data.path);
        return NextResponse.json({ url: urlData.publicUrl });
      }
      return NextResponse.json(
        { error: "Greška pri otpremanju: " + error.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Greška na serveru";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
