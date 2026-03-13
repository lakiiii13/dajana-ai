// ===========================================
// DAJANA AI Admin - Chat proxy (OpenAI)
// Bezbednost: API ključ ostaje na serveru, app ne šalje ključ
// ===========================================

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY nije podešen na serveru." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { model = "gpt-4o", messages, max_tokens = 1200, temperature = 0.7 } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages je obavezan i mora biti niz." },
        { status: 400 }
      );
    }

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      }),
    });

    const rawBody = await res.text();
    if (!res.ok) {
      console.error("[api/chat] OpenAI error:", res.status, rawBody.slice(0, 300));
      if (res.status === 429) {
        return NextResponse.json(
          { error: "Previše zahteva. Sačekajte malo i pokušajte ponovo." },
          { status: 429 }
        );
      }
      if (res.status === 401) {
        return NextResponse.json(
          { error: "OpenAI ključ nije validan. Proveri OPENAI_API_KEY na serveru." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "AI savetnik nije dostupan." },
        { status: res.status }
      );
    }

    let data: { choices?: Array<{ message?: { content?: string } }> };
    try {
      data = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Neispravan odgovor od AI." },
        { status: 502 }
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (content == null) {
      return NextResponse.json(
        { error: "AI nije vratio odgovor." },
        { status: 502 }
      );
    }

    return NextResponse.json({ content });
  } catch (e) {
    console.error("[api/chat] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Greška pri pozivu AI." },
      { status: 500 }
    );
  }
}
