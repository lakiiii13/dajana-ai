// ===========================================
// DAJANA AI Admin - Upload slike (galerija / fajl)
// Prima multipart form sa poljem "file", otprema u Supabase Storage, vraća public URL
// ===========================================

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth";

const BUCKET = "outfit-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

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

    const supabase = createAdminClient();
    const ext = type.replace("image/", "") || "jpg";
    const name = `outfit_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(name, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      if (error.message?.includes("Bucket not found")) {
        await supabase.storage.createBucket(BUCKET, {
          public: true,
          fileSizeLimit: MAX_SIZE,
        });
        const retry = await supabase.storage
          .from(BUCKET)
          .upload(name, await file.arrayBuffer(), {
            contentType: file.type,
            upsert: true,
          });
        if (retry.error) {
          return NextResponse.json(
            { error: "Greška pri otpremanju: " + retry.error.message },
            { status: 500 }
          );
        }
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(retry.data.path);
        return NextResponse.json({ url: urlData.publicUrl });
      }
      return NextResponse.json(
        { error: "Greška pri otpremanju: " + error.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Greška na serveru" },
      { status: 500 }
    );
  }
}
