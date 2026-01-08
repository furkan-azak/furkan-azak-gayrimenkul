"use client";

import { useMemo, useState } from "react";
import ListingMapSection from "@/components/ListingMapSection";

type LatLng = { lat: number; lng: number } | null;

type Feature = { label: string; value: string };

type ListingLike = {
  title: string;
  category: string;
  listingType?: unknown;
  priceText?: string;
  areaM2?: number | null;
  rooms?: string | null;
  city?: string;
  district?: string | null;
  neighborhood?: string | null;
  isSold?: boolean;
  description?: string;
  features?: Feature[];
};

function typeLabel(t: "sale" | "rent") {
  return t === "sale" ? "Satılık" : "Kiralık";
}

function normalizeTypeKey(v: unknown): "sale" | "rent" {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "rent" || s === "kiralık" || s === "kiralik") return "rent";
  if (s === "sale" || s === "satılık" || s === "satilik") return "sale";
  return "sale";
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function KVRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-neutral-200/80 py-3 text-sm">
      <span className="text-neutral-600">{k}</span>
      <span className="font-medium text-neutral-900 text-right">{v}</span>
    </div>
  );
}

// küçük helper: tek satır adres
function formatAddress(city?: string, district?: string | null, neighborhood?: string | null) {
  return [city, district, neighborhood].filter(Boolean).join(" · ");
}

export default function ListingTabs({
  listing,
  mapLocation,
}: {
  listing: ListingLike;
  mapLocation: LatLng;
}) {
  const [tab, setTab] = useState<"info" | "desc" | "loc">("info");

  const typeKey = normalizeTypeKey(listing.listingType);

  const locationText = useMemo(() => {
    return formatAddress(listing.city, listing.district, listing.neighborhood);
  }, [listing.city, listing.district, listing.neighborhood]);

  const baseRows = useMemo(() => {
    const rows: Array<[string, string]> = [
      ["Fiyat", listing.priceText?.trim() || "₺ —"],
      ["İlan Tipi", typeLabel(typeKey)],
      ["Emlak Tipi", `${listing.category} · ${typeLabel(typeKey)}`],
      ["İl", listing.city?.trim() || "—"],
      ["İlçe", listing.district?.trim() || "—"],
      ["Mahalle", listing.neighborhood?.trim() || "—"],
      ["m²", listing.areaM2 ? String(listing.areaM2) : "—"],
      ["Oda Sayısı", listing.rooms?.trim() || "—"],
      ["Konum", locationText || "—"],
    ];

    const existing = new Set(rows.map((r) => r[0].toLowerCase()));

    const extra =
      (listing.features ?? [])
        .filter((f) => f?.label && f?.value)
        .filter((f) => !existing.has(f.label.trim().toLowerCase()))
        .map((f) => [f.label.trim(), f.value.trim()] as [string, string]) ?? [];

    return { rows, extra };
  }, [
    listing.priceText,
    listing.category,
    listing.city,
    listing.district,
    listing.neighborhood,
    listing.areaM2,
    listing.rooms,
    listing.isSold,
    listing.features,
    locationText,
    typeKey,
  ]);

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Tabs header */}
      <div className="sticky top-[73px] z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="flex gap-2 p-2">
          <button
            type="button"
            onClick={() => setTab("info")}
            className={cn(
              "flex-1 rounded-2xl px-4 py-3 text-sm transition",
              tab === "info"
                ? "bg-neutral-900 text-neutral-50"
                : "bg-neutral-50 text-neutral-900 hover:bg-neutral-100"
            )}
          >
            İlan Bilgileri
          </button>

          <button
            type="button"
            onClick={() => setTab("desc")}
            className={cn(
              "flex-1 rounded-2xl px-4 py-3 text-sm transition",
              tab === "desc"
                ? "bg-neutral-900 text-neutral-50"
                : "bg-neutral-50 text-neutral-900 hover:bg-neutral-100"
            )}
          >
            Açıklama
          </button>

          <button
            type="button"
            onClick={() => setTab("loc")}
            className={cn(
              "flex-1 rounded-2xl px-4 py-3 text-sm transition",
              tab === "loc"
                ? "bg-neutral-900 text-neutral-50"
                : "bg-neutral-50 text-neutral-900 hover:bg-neutral-100"
            )}
          >
            Konumu
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {tab === "info" && (
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">
              İlan Bilgileri
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-5">
              {baseRows.rows.map(([k, v]) => (
                <KVRow key={k} k={k} v={v} />
              ))}
            </div>

            {(baseRows.extra?.length ?? 0) > 0 && (
              <div className="mt-10">
                <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                  Özellikler
                </div>

                <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-5">
                  {baseRows.extra.map(([k, v]) => (
                    <KVRow key={k} k={k} v={v} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "desc" && (
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">
              Açıklama
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-line">
                {listing.description?.trim() || "Açıklama eklenmemiş."}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="text-sm font-medium tracking-tight">Notlar & Süreç</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700">
                <li>Randevu ile yerinde gösterim.</li>
                <li>Tapu/imar/ekspertiz gibi resmi detaylar istenirse paylaşılır.</li>
                <li>Alıcı-satıcı tarafında net ve şeffaf iletişim.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ✅ PREMIUM KONUM (koordinatsız) */}
        {tab === "loc" && (
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">Konumu</div>

            <div className="mt-4">
              {mapLocation ? (
                <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  {/* üst şerit */}
                  <div className="border-b border-neutral-200 bg-neutral-50/80 backdrop-blur">
                    <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">Harita Konumu</div>
                        <div className="mt-1 text-xs text-neutral-600">
                          Yaklaşık adres:{" "}
                          <span className="font-medium text-neutral-900">
                            {locationText || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
                          {listing.category} · {typeLabel(typeKey)}
                        </span>
                        {listing.areaM2 ? (
                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
                            {listing.areaM2} m²
                          </span>
                        ) : null}
                        {listing.rooms ? (
                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
                            {listing.rooms}
                          </span>
                        ) : null}
                        {listing.isSold ? (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">
                            Satıldı
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* map */}
                  <div className="p-4 md:p-5">
                    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">
                      <ListingMapSection location={mapLocation} title={listing.title} />
                    </div>

                    {/* alt bilgi - koordinatsız */}
                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-900">
                          ✦
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-neutral-900">
                            Premium Konum Bilgilendirmesi
                          </div>
                          <div className="mt-1 text-sm text-neutral-700">
                            Harita, ilan konumunu <span className="font-medium">yaklaşık</span>{" "}
                            gösterir. Detaylı yönlendirme için hızlı iletişimden ulaşabilirsin.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
                  Konum eklenmemiş.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}