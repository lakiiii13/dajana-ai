"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, ImagePlus } from "lucide-react";
import { useRef } from "react";

const BODY_TYPES = [
  { value: "pear", label: "Kruška" },
  { value: "apple", label: "Jabuka" },
  { value: "hourglass", label: "Peščani sat" },
  { value: "rectangle", label: "Pravougaonik" },
  { value: "inverted_triangle", label: "Obrnuti trougao" },
];

const SEASONS = [
  { value: "light_spring", label: "Svetlo proleće" },
  { value: "warm_spring", label: "Toplo proleće" },
  { value: "clear_spring", label: "Čisto proleće" },
  { value: "light_summer", label: "Svetlo leto" },
  { value: "cool_summer", label: "Hladno leto" },
  { value: "soft_summer", label: "Meko leto" },
  { value: "soft_autumn", label: "Meka jesen" },
  { value: "warm_autumn", label: "Topla jesen" },
  { value: "deep_autumn", label: "Duboka jesen" },
  { value: "deep_winter", label: "Duboka zima" },
  { value: "cool_winter", label: "Hladna zima" },
  { value: "clear_winter", label: "Čista zima" },
];

const CATEGORIES = [
  { value: "tops", label: "Gornji deo", icon: "👚" },
  { value: "bottoms", label: "Donji deo", icon: "👖" },
  { value: "dresses", label: "Haljine", icon: "👗" },
  { value: "outerwear", label: "Jakne/Kaputi", icon: "🧥" },
  { value: "accessories", label: "Aksesori", icon: "👜" },
  { value: "obuca", label: "Obuca", icon: "👟" },
  { value: "complete_look", label: "Kompletan outfit", icon: "✨" },
];

export default function EditOutfitPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    body_types: [] as string[],
    seasons: [] as string[],
    tags: [] as string[],
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    const fetchOutfit = async () => {
      try {
        const res = await fetch(`/api/outfits/${id}`);
        if (!res.ok) throw new Error("Outfit nije pronađen");
        const data = await res.json();
        setFormData({
          title: data.title || "",
          description: data.description || "",
          image_url: data.image_url || "",
          body_types: data.body_types || [],
          seasons: data.seasons || [],
          tags: data.tags || [],
          display_order: data.display_order ?? 0,
          is_active: data.is_active ?? true,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutfit();
  }, [id]);

  const handleBodyTypeToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      body_types: prev.body_types.includes(value)
        ? prev.body_types.filter((v) => v !== value)
        : [...prev.body_types, value],
    }));
  };

  const handleSeasonToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      seasons: prev.seasons.includes(value)
        ? prev.seasons.filter((v) => v !== value)
        : [...prev.seasons, value],
    }));
  };

  const handleCategoryToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(value)
        ? prev.tags.filter((v) => v !== value)
        : [...prev.tags, value],
    }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload nije uspeo");
      setFormData((prev) => ({ ...prev, image_url: data.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.image_url) {
      setError("URL slike je obavezan");
      return;
    }

    if (formData.body_types.length === 0) {
      setError("Izaberite najmanje jedan tip građe");
      return;
    }

    if (formData.seasons.length === 0) {
      setError("Izaberite najmanje jednu sezonu");
      return;
    }

    if (formData.tags.length === 0) {
      setError("Izaberite najmanje jednu kategoriju");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`/api/outfits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Greška prilikom čuvanja");
      }

      router.push("/dashboard/outfits");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/outfits">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Nazad
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Izmeni outfit</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <Card>
            <CardHeader>
              <CardTitle>Osnovni podaci</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Naziv</Label>
                <Input
                  id="title"
                  placeholder="Npr. Elegantan poslovni outfit"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <Textarea
                  id="description"
                  placeholder="Kratak opis outfita..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Slika outfita *</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    id="image_url"
                    placeholder="https://... ili izaberi iz galerije"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        image_url: e.target.value,
                      }))
                    }
                    className="flex-1 min-w-[200px]"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <ImagePlus className="w-4 h-4 mr-2" />
                    {isUploading ? "Otpremanje..." : "Izaberi iz galerije"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Unesite URL ili kliknite „Izaberi iz galerije” da otpremite sliku sa računara.
                </p>
              </div>

              {formData.image_url && (
                <div className="border rounded-lg p-2">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="display_order">Redosled prikaza</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-gray-500">
                  Manji broj = prikazuje se prvi (0, 1, 2...)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="is_active">Aktivan (vidljiv korisnicima)</Label>
              </div>
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tipovi građe *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {BODY_TYPES.map((bt) => (
                    <button
                      key={bt.value}
                      type="button"
                      onClick={() => handleBodyTypeToggle(bt.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.body_types.includes(bt.value)
                          ? "bg-[#0D4326] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sezone *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleSeasonToggle(s.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.seasons.includes(s.value)
                          ? "bg-[#CF8F5A] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategorija *</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-3">
                  Izaberite kategoriju za filtriranje u aplikaciji
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.tags.includes(cat.value)
                          ? "bg-[#0D4326] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/dashboard/outfits">
            <Button variant="outline" type="button">
              Otkaži
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[#0D4326] hover:bg-[#0D4326]/90"
            disabled={isSaving}
          >
            {isSaving ? "Čuvanje..." : "Sačuvaj izmene"}
          </Button>
        </div>
      </form>
    </div>
  );
}
