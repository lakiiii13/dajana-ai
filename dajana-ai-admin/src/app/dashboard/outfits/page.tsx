import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DeleteOutfitButton } from "./delete-button";

const BODY_TYPE_LABELS: Record<string, string> = {
  pear: "Kruška",
  apple: "Jabuka",
  hourglass: "Peščani sat",
  rectangle: "Pravougaonik",
  inverted_triangle: "Obrnuti trougao",
};

const SEASON_LABELS: Record<string, string> = {
  light_spring: "Svetlo proleće",
  warm_spring: "Toplo proleće",
  clear_spring: "Čisto proleće",
  light_summer: "Svetlo leto",
  cool_summer: "Hladno leto",
  soft_summer: "Meko leto",
  soft_autumn: "Meka jesen",
  warm_autumn: "Topla jesen",
  deep_autumn: "Duboka jesen",
  deep_winter: "Duboka zima",
  cool_winter: "Hladna zima",
  clear_winter: "Čista zima",
};

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  tops: { label: "Gornji deo", icon: "👚" },
  bottoms: { label: "Donji deo", icon: "👖" },
  dresses: { label: "Haljine", icon: "👗" },
  outerwear: { label: "Jakne", icon: "🧥" },
  accessories: { label: "Aksesori", icon: "👜" },
  obuca: { label: "Obuca", icon: "👟" },
  complete_look: { label: "Kompletan", icon: "✨" },
};

async function getOutfits() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching outfits:", error);
    return [];
  }

  return data || [];
}

export default async function OutfitsPage() {
  const outfits = await getOutfits();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Outfiti</h1>
        <Link href="/dashboard/outfits/new">
          <Button className="bg-[#0D4326] hover:bg-[#0D4326]/90">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj outfit
          </Button>
        </Link>
      </div>

      {outfits.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">Nema outfita u bazi</p>
          <Link href="/dashboard/outfits/new">
            <Button className="bg-[#0D4326] hover:bg-[#0D4326]/90">
              Dodaj prvi outfit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-20">Slika</TableHead>
                <TableHead>Naziv</TableHead>
                <TableHead>Kategorija</TableHead>
                <TableHead>Tipovi građe</TableHead>
                <TableHead>Sezone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outfits.map((outfit) => (
                <TableRow key={outfit.id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-500">
                      {outfit.display_order ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    {outfit.image_url ? (
                      <img
                        src={outfit.image_url}
                        alt={outfit.title || "Outfit"}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {outfit.title || "Bez naziva"}
                      </p>
                      {outfit.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {outfit.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {outfit.tags?.length > 0 ? (
                        outfit.tags.map((tag: string) => {
                          const cat = CATEGORY_LABELS[tag];
                          return cat ? (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs bg-[#0D4326]/10 text-[#0D4326] border-[#0D4326]/20"
                            >
                              {cat.icon} {cat.label}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {outfit.body_types?.map((bt: string) => (
                        <Badge key={bt} variant="secondary" className="text-xs">
                          {BODY_TYPE_LABELS[bt] || bt}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {outfit.seasons?.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {SEASON_LABELS[s] || s}
                        </Badge>
                      ))}
                      {outfit.seasons?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{outfit.seasons.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={outfit.is_active ? "default" : "secondary"}
                      className={
                        outfit.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {outfit.is_active ? "Aktivan" : "Neaktivan"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/outfits/${outfit.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DeleteOutfitButton id={outfit.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
