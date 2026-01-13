"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  href: string;
  title: string;
  images: string[];
  isSold?: boolean;
};

const NO_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export default function ListingCardCarousel({ href, title, images, isSold }: Props) {
  const slides = useMemo(() => (images ?? []).filter(Boolean), [images]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const [idx, setIdx] = useState(0);

  // ✅ Tap-guard: Scroll hareketi varsa click iptal
  const gesture = useRef({
    startX: 0,
    startY: 0,
    moved: false,
  });

  function onPointerDown(e: React.PointerEvent) {
    gesture.current.startX = e.clientX;
    gesture.current.startY = e.clientY;
    gesture.current.moved = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    const dx = Math.abs(e.clientX - gesture.current.startX);
    const dy = Math.abs(e.clientY - gesture.current.startY);

    // küçük eşik: scroll/touch hassasiyetini çözer
    if (dx > 8 || dy > 8) gesture.current.moved = true;
  }

  function guardClick(e: React.MouseEvent) {
    // parmak kaydıysa = scroll yaptıysa → link çalışmasın
    if (gesture.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // ✅ Dot index hesapla
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const w = el.clientWidth || 1;
      const i = Math.round(el.scrollLeft / w);
      setIdx(Math.max(0, Math.min(i, slides.length - 1)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [slides.length]);

  const showDots = slides.length > 1;

  return (
    <div className="relative">
      {/* ✅ SOLD badge */}
      {isSold && (
        <div className="absolute left-3 top-3 z-20 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
          Satıldı
        </div>
      )}

      {/* ✅ CTA: sadece buradan aç */}
      <Link
        href={href}
        onClickCapture={guardClick}
        className="absolute right-3 top-3 z-20 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 hover:bg-white"
      >
        İlanı Gör →
      </Link>

      {/* ✅ Carousel (GÖRSEL TIKLAMA YOK, sadece swipe) */}
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        className={[
          "relative aspect-[4/3] w-full overflow-x-auto overflow-y-hidden",
          "snap-x snap-mandatory scroll-smooth bg-neutral-100",
          NO_SCROLLBAR,
        ].join(" ")}
      >
        {slides.length ? (
          slides.slice(0, 12).map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full flex-shrink-0 snap-center">
              <Image
                src={src}
                alt={title}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              {/* premium overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
            </div>
          ))
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      {/* ✅ Dots + tiny 'Kaydır' (çok küçük) */}
      {showDots && (
        <>
          <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-black/30 px-3 py-2 backdrop-blur">
            {slides.slice(0, 6).map((_, i) => (
              <span
                key={i}
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  i === idx ? "bg-white" : "bg-white/50",
                ].join(" ")}
              />
            ))}
            {slides.length > 6 && (
              <span className="ml-1 text-[10px] text-white/80">+{slides.length - 6}</span>
            )}
          </div>

          {/* Kaydır yazısı: TINY */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-white/25 bg-black/35 px-2 py-0.5 text-[10px] text-white backdrop-blur">
            Kaydır
          </div>
        </>
      )}
    </div>
  );
}