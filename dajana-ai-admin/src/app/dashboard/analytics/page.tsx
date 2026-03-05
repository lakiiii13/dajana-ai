import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/server";
import { BarChart3, Image, Video, Shirt, Users } from "lucide-react";

async function getAnalytics() {
  const supabase = createAdminClient();

  const [
    { count: usersCount },
    { count: outfitsCount },
    { data: imageGens },
    { data: videoGens },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("outfits").select("*", { count: "exact", head: true }),
    supabase.from("generations").select("id, created_at").eq("type", "image").order("created_at", { ascending: false }).limit(100),
    supabase.from("generations").select("id, created_at").eq("type", "video").order("created_at", { ascending: false }).limit(100),
  ]);

  const imagesByMonth = (imageGens ?? []).reduce<Record<string, number>>((acc, g) => {
    const key = g.created_at?.slice(0, 7) ?? "?";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const videosByMonth = (videoGens ?? []).reduce<Record<string, number>>((acc, g) => {
    const key = g.created_at?.slice(0, 7) ?? "?";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(
    ...Object.values(imagesByMonth),
    ...Object.values(videosByMonth),
    1
  );

  return {
    users: usersCount ?? 0,
    outfits: outfitsCount ?? 0,
    imageCount: imageGens?.length ?? 0,
    videoCount: videoGens?.length ?? 0,
    imagesByMonth: Object.entries(imagesByMonth).sort(([a], [b]) => a.localeCompare(b)),
    videosByMonth: Object.entries(videosByMonth).sort(([a], [b]) => a.localeCompare(b)),
    maxCount,
  };
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-20 text-xs text-gray-600 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
        <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 w-8 text-right">{value}</span>
    </div>
  );
}

export default async function AnalyticsPage() {
  const stats = await getAnalytics();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D4326]">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistika</h1>
          <p className="text-sm text-gray-500">Analitika korišćenja aplikacije</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-[#0D4326]">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Korisnici</p>
              <p className="text-xl font-bold text-gray-900">{stats.users}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-[#CF8F5A]">
              <Shirt className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outfiti</p>
              <p className="text-xl font-bold text-gray-900">{stats.outfits}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-500">
              <Image className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Slike (poslednjih 100)</p>
              <p className="text-xl font-bold text-gray-900">{stats.imageCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-500">
              <Video className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Videi (poslednjih 100)</p>
              <p className="text-xl font-bold text-gray-900">{stats.videoCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generisane slike po mesecu</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.imagesByMonth.length === 0 ? (
              <p className="text-gray-500 text-sm">Nema podataka.</p>
            ) : (
              <div className="space-y-0">
                {stats.imagesByMonth.map(([month, value]) => (
                  <BarRow
                    key={month}
                    label={month}
                    value={value}
                    max={stats.maxCount}
                    color="bg-[#CF8F5A]"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generisani videi po mesecu</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.videosByMonth.length === 0 ? (
              <p className="text-gray-500 text-sm">Nema podataka.</p>
            ) : (
              <div className="space-y-0">
                {stats.videosByMonth.map(([month, value]) => (
                  <BarRow
                    key={month}
                    label={month}
                    value={value}
                    max={stats.maxCount}
                    color="bg-purple-500"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
