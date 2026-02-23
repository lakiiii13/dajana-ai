import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/server";
import { Users, Shirt, Image, Video } from "lucide-react";

async function getStats() {
  const supabase = createAdminClient();

  const [
    { count: usersCount },
    { count: outfitsCount },
    { count: imagesCount },
    { count: videosCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("outfits").select("*", { count: "exact", head: true }),
    supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("type", "image"),
    supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("type", "video"),
  ]);

  return {
    users: usersCount || 0,
    outfits: outfitsCount || 0,
    images: imagesCount || 0,
    videos: videosCount || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Korisnici"
          value={stats.users}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Outfiti"
          value={stats.outfits}
          icon={Shirt}
          color="bg-[#0D4326]"
        />
        <StatCard
          title="Generisane slike"
          value={stats.images}
          icon={Image}
          color="bg-[#CF8F5A]"
        />
        <StatCard
          title="Generisani videi"
          value={stats.videos}
          icon={Video}
          color="bg-purple-500"
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Dobrodošli u DAJANA AI Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Koristite navigaciju sa leve strane za upravljanje aplikacijom.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>
                <strong>Outfiti</strong> - Dodajte, izmenite ili obrišite outfite
                za kapsulu
              </li>
              <li>
                <strong>Korisnici</strong> - Pregled registrovanih korisnika
              </li>
              <li>
                <strong>Statistika</strong> - Analitika korišćenja aplikacije
              </li>
              <li>
                <strong>Notifikacije</strong> - Slanje push notifikacija
                korisnicima
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
