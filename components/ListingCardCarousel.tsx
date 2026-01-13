"use client";

import Link from "next/link";
import Image from "next/image";

export default function ListingCardCarousel({
  href,
  title,
  images,
  isSold,
}: {
  href: string;
  title: string;
  images: string[];
  isSold?: boolean;
}) {
  const list = (images ?? []).filter(Boolean);
  const hasMany = list.length > 1;

  return (
    <div className="relative">
      {/* Satıldı badge */}
      {isSold && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
          Satıldı
        </div>
      )}

      {/* ✅ İlanı Gör butonu (üstte) */}
      <Link
        href={href}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 hover:bg-white"
      >
        İlanı Gör
      </Link>

      {/* ✅ Swipe alanı */}
      <div
        className={[
          "relative aspect-[4/3] overflow-x-auto bg-neutral-100",
          "flex snap-x snap-mandatory scroll-smooth",
          hasMany ? "touch-pan-x" : "",
        ].join(" ")}
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {/* scrollbar gizleme (webkit) */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {list.length > 0 ? (
          list.map((src, i) => (
            <div key={`${src}-${i}`} className="relative w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              {/* küçük sayfa noktaları */}
              {hasMany && (
                <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-2 py-1 text-[10px] text-white">
                  {i + 1}/{list.length}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="h-full w-full bg-neutral-100" />
        )}
      </div>
    </div>
  );
}