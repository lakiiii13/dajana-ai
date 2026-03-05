// ===========================================
// DAJANA AI Admin - Video start proxy (TheNewBlack)
// Bezbednost: API ključ ostaje na serveru
// ===========================================

import { NextResponse } from "next/server";

const BASE = "https://thenewblack.ai/api/1.1/wf";

export async function POST(request: Request) {
  try {
    const key = process.env.VIDEO_API_KEY?.trim();
    if (!key) {
      return NextResponse.json(
        { error: "VIDEO_API_KEY nije podešen na serveru." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");
    const prompt = formData.get("prompt");
    const time = formData.get("time");

    if (!image || !prompt || !time) {
      return NextResponse.json(
        { error: "Obavezni parametri: image, prompt, time." },
        { status: 400 }
      );
    }

    const body = new FormData();
    body.append("image", image as string | Blob);
    body.append("prompt", prompt as string);
    body.append("time", time as string);

    const res = await fetch(`${BASE}/ai-video?api_key=${key}`, {
      method: "POST",
      body,
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error("[api/video/start] Error:", res.status, responseText);
      return NextResponse.json(
        { error: "Video servis greška." },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const jobId = responseText.trim();
    return NextResponse.json({ jobId });
  } catch (e) {
    console.error("[api/video/start] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Greška pri pokretanju videa." },
      { status: 500 }
    );
  }
}
