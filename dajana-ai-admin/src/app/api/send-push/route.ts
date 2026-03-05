// ===========================================
// DAJANA AI Admin - Send Push Notifications
// Server-side send via Expo Push API
// ===========================================

import { NextResponse } from "next/server";
import Expo from "expo-server-sdk";
import { createAdminClient } from "@/lib/supabase/server";

const DEFAULT_TITLE = "DAJANA AI";
const ANDROID_CHANNEL = "dajana-announcements";

/** GET: return count of registered push tokens (for admin UI). */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("push_tokens")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }
    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = (body.title as string)?.trim() || DEFAULT_TITLE;
    const messageBody = (body.body as string)?.trim();

    if (!messageBody) {
      return NextResponse.json(
        { error: "Body poruke je obavezan." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from("push_tokens")
      .select("user_id, token");

    if (error) {
      console.error("[send-push] Supabase error:", error);
      return NextResponse.json(
        { error: "Greška pri učitavanju tokena." },
        { status: 500 }
      );
    }

    const validRows = (rows || []).filter(
      (r) => r.token && Expo.isExpoPushToken(r.token)
    );
    const validTokens = validRows.map((r) => r.token as string);

    // Inbox: jedan red po korisniku (ne po tokenu) da se prikaže u app Notifikacije
    const seenUserIds = new Set<string>();
    for (const row of validRows) {
      if (row.user_id && !seenUserIds.has(row.user_id)) {
        seenUserIds.add(row.user_id);
        const { error: inboxError } = await supabase.from("user_notifications").insert({
          user_id: row.user_id,
          type: "system",
          title,
          body: messageBody,
        });
        if (inboxError) {
          console.error("[send-push] Inbox insert error (user_notifications tabela?):", inboxError.message, inboxError.code);
        }
      }
    }

    if (validTokens.length === 0) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        total: 0,
        message: "Nema registrovanih uređaja za push.",
      });
    }

    const expo = new Expo();

    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default" as const,
      title,
      body: messageBody,
      channelId: ANDROID_CHANNEL,
      priority: "high" as const,
      data: { type: "admin-broadcast", ts: Date.now() },
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: Expo.ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    const okCount = tickets.filter(
      (t) => t.status === "ok"
    ).length;
    const errCount = tickets.filter(
      (t) => t.status === "error"
    ).length;

    return NextResponse.json({
      ok: true,
      sent: okCount,
      errors: errCount,
      total: validTokens.length,
      message: `Poslato: ${okCount}${errCount > 0 ? `, greške: ${errCount}` : ""}.`,
    });
  } catch (e) {
    console.error("[send-push] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Greška pri slanju." },
      { status: 500 }
    );
  }
}
