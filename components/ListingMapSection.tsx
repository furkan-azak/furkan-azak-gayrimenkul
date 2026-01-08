"use client";

import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
});

export default function ListingMapSection({
  location,
  title,
}: {
  location: { lat: number; lng: number };
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      {/* Top bar (premium header) */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-neutral-50/80 px-5 py-4 backdrop-blur">
        <div className="min-w-0">
          <div className="text-sm font-medium tracking-tight text-neutral-900">
            Konum
          </div>
          <div className="mt-0.5 truncate text-xs text-neutral-600">
            Harita üzerinde ilan konumu
          </div>
        </div>

        {/* coords chip */}
        <div className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] text-neutral-700 font-mono">
          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      </div>

      {/* Map frame */}
      <div className="p-4 md:p-5">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">
          {/* subtle vignette / ring */}
          <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
          <ListingMap location={location} title={title} />
        </div>

        {/* Bottom note */}
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
          Konum bilgisi yaklaşık gösterilir. Detaylı yönlendirme için iletişime geçebilirsin.
        </div>
      </div>
    </section>
  );
}