"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  href: string;
  title: string;
  images: string[];
  isSold?: boolean;
};

export default function ListingCardCarousel({ href, title, images, isSold }: Props) {
  const safeImages = useMemo(() => (images ?? []).filter(Boolean), [images]);
  const total = safeImages.length;

  const [idx, setIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [hint, setHint] = useState(true);

  const startXRef = useRef<number | null>(null);
  const pointerDownRef = useRef(false);

  // Hint: 2.2 sn sonra kaybolsun
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 2200);
    return () => clearTimeout(t);
  }, []);

  // images değişirse index taşmasın
  useEffect(() => {
    if (idx > total - 1) setIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  function go(next: number) {
    if (total <= 1) return;
    setIdx(clamp(next, 0, total - 1));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (total <= 1) return;
    pointerDownRef.current = true;
    startXRef.current = e.clientX;
    setDragging(true);
    setDragX(0);

    // iOS safari seçimi engellemek için
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointerDownRef.current || startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    setDragX(dx);
  }

  function endDrag() {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;

    const dx = dragX;
    setDragging(false);
    setDragX(0);
    startXRef.current = null;

    // threshold: 50px
    if (Math.abs(dx) < 50) return;

    if (dx < 0) go(idx + 1);
    else go(idx - 1);
  }

  const translatePct = total > 0 ? -(idx * 100) : 0;
  const dragPct = total > 0 ? (dragX / (typeof window !== "undefined" ? window.innerWidth : 375)) * 100 : 0;

  return (
    <div className="relative">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {/* Satıldı badge */}
        {isSold && (
          <div className="absolute left-3 top-3 z-20 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
            Satıldı
          </div>
        )}

        {/* Glass top-right mini controls */}
        {total > 1 && (
          <div className="absolute right-3 top-3 z-20 rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs text-white backdrop-blur">
            {idx + 1}/{total}
          </div>
        )}

        {/* Swipe hint */}
        {total > 1 && hint && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-black/35 px-4 py-2 text-xs text-white backdrop-blur">
            Kaydır →
          </div>
        )}

        {/* Track */}
        {total > 0 ? (
          <div
            className={cn(
              "h-full w-full",
              "touch-pan-y select-none"
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => dragging && endDrag()}
          >
            <div
              className={cn(
                "flex h-full w-full",
                dragging ? "transition-none" : "transition-transform duration-300"
              )}
              style={{
                transform: `translateX(${translatePct + (dragging ? dragPct : 0)}%)`,
              }}
            >
              {safeImages.map((src, i) => (
                <div key={`${src}-${i}`} className="relative h-full w-full shrink-0">
                  <Image
                    src={src}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={i === 0}
                  />
                  {/* subtle overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
            Görsel yok
          </div>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-2 backdrop-blur">
            {safeImages.slice(0, 8).map((_, i) => {
              const active = i === idx;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition",
                    active ? "bg-white" : "bg-white/40 hover:bg-white/70"
                  )}
                  aria-label={`Görsel ${i + 1}`}
                />
              );
            })}
            {total > 8 && <span className="ml-1 text-[10px] text-white/80">+{total - 8}</span>}
          </div>
        )}

        {/* İlanı Gör button (only this navigates) */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white drop-shadow">
                {title}
              </div>
              <div className="text-xs text-white/80">Detayları görmek için</div>
            </div>

            <Link
              href={href}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm",
                "border border-white/25 bg-white/10 text-white backdrop-blur",
                "hover:bg-white/15"
              )}
            >
              İlanı Gör
            </Link>
          </div>
        </div>
      </div>

      {/* Optional: keyboard / arrow buttons (desktop) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(idx - 1)}
            className={cn(
              "hidden md:flex",
              "absolute left-3 top-1/2 z-30 -translate-y-1/2 items-center justify-center",
              "h-10 w-10 rounded-full border border-white/20 bg-black/25 text-white backdrop-blur",
              "hover:bg-black/35"
            )}
            aria-label="Önceki"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => go(idx + 1)}
            className={cn(
              "hidden md:flex",
              "absolute right-3 top-1/2 z-30 -translate-y-1/2 items-center justify-center",
              "h-10 w-10 rounded-full border border-white/20 bg-black/25 text-white backdrop-blur",
              "hover:bg-black/35"
            )}
            aria-label="Sonraki"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}