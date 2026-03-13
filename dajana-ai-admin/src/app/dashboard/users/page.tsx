import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/server";
import { User } from "lucide-react";

type ProfileRow = { id: string; email: string | null; full_name: string | null; language: string | null; created_at: string };

async function getUsers(): Promise<ProfileRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, language, created_at")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ProfileRow[];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("sr-Latn", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D4326]">
          <User className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Korisnici</h1>
          <p className="text-sm text-gray-500">Pregled registrovanih korisnika</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrovani korisnici ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500 py-8 text-center">Nema korisnika u bazi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Ime</th>
                    <th className="pb-3 font-medium">Jezik</th>
                    <th className="pb-3 font-medium">Registrovano</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                      <td className="py-3 text-gray-900">{u.email}</td>
                      <td className="py-3 text-gray-700">{u.full_name ?? "—"}</td>
                      <td className="py-3 text-gray-600">{u.language ?? "—"}</td>
                      <td className="py-3 text-gray-600">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
