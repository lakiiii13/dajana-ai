"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bell, Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function NotificationsPage() {
  const toast = useToast();
  const [title, setTitle] = useState("DAJANA AI");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/send-push")
      .then((r) => r.json())
      .then((data) => setTokenCount(data.count ?? 0))
      .catch(() => setTokenCount(0));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setResult({ type: "error", message: "Unesite tekst poruke." });
      return;
    }
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "DAJANA AI",
          body: trimmedBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Greška pri slanju.";
        setResult({ type: "error", message: msg });
        toast(msg, "error");
        return;
      }
      const msg = data.message || `Poslato na ${data.sent} uređaja.`;
      setResult({ type: "success", message: msg });
      toast(msg, "success");
      setBody("");
      if (data.total != null) setTokenCount(data.total);
    } catch {
      setResult({ type: "error", message: "Greška u mreži." });
      toast("Greška u mreži.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D4326]">
          <Bell className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikacije</h1>
          <p className="text-sm text-gray-500">
            Pošalji push notifikaciju svim korisnicima aplikacije
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-[#0D4326]/20 shadow-sm">
        <div className="border-b border-[#0D4326]/10 bg-[#F8F4EF]/60 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-[#0D4326]">
            <span className="text-lg">Push poruka</span>
            {tokenCount !== null && (
              <span className="text-sm font-normal text-[#CF8F5A]">
                · {tokenCount} uređaja
              </span>
            )}
          </CardTitle>
        </div>
        <CardContent className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700">
                Naslov (opciono)
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="DAJANA AI"
                className="border-[#0D4326]/20 focus-visible:ring-[#0D4326]/30"
                maxLength={64}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body" className="text-gray-700">
                Poruka <span className="text-[#CF8F5A]">*</span>
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Npr. Nova kolekcija je stigla. Pogledaj u Kapsuli! ✨"
                rows={4}
                className="min-h-[100px] resize-y border-[#0D4326]/20 focus-visible:ring-[#0D4326]/30"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">{body.length}/500</p>
            </div>

            {result && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  result.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {result.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0D4326] font-medium text-white hover:bg-[#0a3520] focus-visible:ring-[#CF8F5A]/40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Šaljem…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Pošalji svima
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-gray-500">
        Notifikacije će korisnicima stići u DAJANA AI stilu (zlatni akcent na
        Androidu). Naslov se prikazuje iznad poruke.
      </p>
    </div>
  );
}
