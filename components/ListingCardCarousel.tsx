"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const NO_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  href: string;
  title: string;
  images: string[];
  isSold?: boolean;
  className?: string;
};

export default function ListingCardCarousel({
  href,
  title,
  images,
  isSold,
  className,
}: Props) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // drag vs click ayrımı
  const startX = useRef(0);
  const startY = useRef(0);
  const [dragging, setDragging] = useState(false);

  const hasImages = Array.isArray(images) && images.length > 0;
  const slides = hasImages ? images.slice(0, 12) : [];

  function onPointerDown(e: React.PointerEvent) {
    // only primary pointer
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setDragging(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    const dx = Math.abs(e.clientX - startX.current);
    const dy = Math.abs(e.clientY - startY.current);

    // küçük eşik: swipe niyeti varsa drag kabul et
    if (!dragging && dx > 6 && dx > dy) setDragging(true);
  }

  function onPointerUp() {
    // drag değilse "tap" say ve ilana git
    if (!dragging) router.push(href);
  }

  return (
    <div className={cn("relative aspect-[4/3] overflow-hidden bg-neutral-100", className)}>
      {/* Apple-like ring + glow */}
      <div className="pointer-events-none absolute inset-0 z-10 ring-1 ring-neutral-200/70 transition duration-300 group-hover:ring-neutral-300/80" />
      <div className="pointer-events-none absolute -inset-10 z-10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
        <div className="h-full w-full bg-gradient-to-r from-neutral-200/35 via-white/10 to-neutral-200/35" />
      </div>

      {/* Sold */}
      {isSold && (
        <div className="absolute left-3 top-3 z-20 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
          Satıldı
        </div>
      )}

      {/* CTA (swipe engellemesin) */}
      <Link
        href={href}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-3 z-20 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 hover:bg-white"
      >
        İlanı Gör →
      </Link>

      {/* Scroller */}
      {slides.length ? (
        <div
          ref={scrollerRef}
          className={cn(
            "absolute inset-0 z-0 flex",
            "overflow-x-auto overflow-y-hidden",
            "snap-x snap-mandatory scroll-smooth",
            "touch-pan-x", // ✅ iOS swipe fix
            "select-none",
            "overscroll-x-contain",
            NO_SCROLLBAR
          )}
          // drag/tap ayrımı
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDragging(false)}
        >
          {slides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={cn(
                "relative h-full w-full flex-shrink-0 snap-center",
                "cursor-pointer"
              )}
            >
              <Image
                src={src}
                alt={title}
                fill
                draggable={false}
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={i === 0}
              />
              {/* premium vignette */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                <div className="h-full w-full bg-gradient-to-br from-white/10 via-transparent to-black/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="absolute inset-0" />
      )}

      {/* Dots + count */}
      {slides.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-black/30 px-3 py-2 backdrop-blur">
          {slides.slice(0, 6).map((_, i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/70" />
          ))}
          {slides.length > 6 && (
            <span className="ml-1 text-[10px] text-white/80">+{slides.length - 6}</span>
          )}
        </div>
      )}

      {/* “Kaydır” tiny (istersen tamamen kaldırırız) */}
      {slides.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-white/25 bg-black/35 px-2 py-0.5 text-[10px] text-white backdrop-blur">
          Kaydır
        </div>
      )}
    </div>
  );
}