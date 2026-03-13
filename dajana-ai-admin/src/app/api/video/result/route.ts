// ===========================================
// DAJANA AI Admin - Video result proxy (TheNewBlack)
// Bezbednost: API ključ ostaje na serveru
// ===========================================

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const BASE = "https://thenewblack.ai/api/1.1/wf";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const key = process.env.VIDEO_API_KEY?.trim();
    if (!key) {
      return NextResponse.json(
        { error: "VIDEO_API_KEY nije podešen na serveru." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const jobId = body?.jobId ?? body?.id;

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { error: "jobId je obavezan." },
        { status: 400 }
      );
    }

    const formData = new FormData();
    formData.append("id", jobId);

    const res = await fetch(`${BASE}/results_video?api_key=${key}`, {
      method: "POST",
      body: formData,
    });

    const text = (await res.text()).trim();
    if (!res.ok) {
      if (res.status === 404 || text.toLowerCase().includes("not ready")) {
        return NextResponse.json({ videoUrl: null });
      }
      console.error("[api/video/result] Error:", res.status, text);
      return NextResponse.json(
        { error: "Greška pri proveri rezultata videa." },
        { status: res.status }
      );
    }

    const notReady =
      !text ||
      text.length < 20 ||
      !text.startsWith("http") ||
      /error|not ready|processing|pending|generating|queue/i.test(text);

    if (notReady) {
      return NextResponse.json({ videoUrl: null });
    }

    return NextResponse.json({ videoUrl: text });
  } catch (e) {
    console.error("[api/video/result] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Greška." },
      { status: 500 }
    );
  }
}
