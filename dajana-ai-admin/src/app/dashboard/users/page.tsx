import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Korisnici</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pregled korisnika</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Dolazi u Fazi 7 - Finalizacija</p>
        </CardContent>
      </Card>
    </div>
  );
}
