"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  images: string[];
  coverUrl?: string | null;
  isSold?: boolean;
};

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function ListingGallery({ title, images, coverUrl, isSold }: Props) {
  const ordered = useMemo(() => {
    const imgs = (images ?? []).filter(Boolean);
    if (!imgs.length) return [];
    if (!coverUrl) return imgs;

    const rest = imgs.filter((u) => u !== coverUrl);
    return [coverUrl, ...rest].filter(Boolean);
  }, [images, coverUrl]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const total = ordered.length;
  const current = ordered[idx];

  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  function openAt(i: number) {
    if (!total) return;
    setIdx(Math.max(0, Math.min(i, total - 1)));
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function prev() {
    if (!total) return;
    setIdx((v) => (v - 1 + total) % total);
  }

  function next() {
    if (!total) return;
    setIdx((v) => (v + 1) % total);
  }

  async function copyLink() {
    try {
      if (typeof window === "undefined") return;
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  }

  // ESC + ok tuşları
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, total]);

  // modal açıkken scroll kilitle
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // thumbnail strip: aktif foto görünür kalsın
  const thumbsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const el = thumbsRef.current;
    if (!el) return;

    const active = el.querySelector<HTMLButtonElement>(`button[data-i="${idx}"]`);
    if (!active) return;

    active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [idx, open]);

  if (!ordered.length) {
    return (
      <div className="mt-10 grid gap-4 md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm" />
        </div>
        <div className="grid gap-4 md:col-span-4">
          <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm" />
          <div className="aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm" />
        </div>
      </div>
    );
  }

  const cover = ordered[0];
  const side1 = ordered[1];
  const side2 = ordered[2];

  return (
    <>
      {/* GRID (sayfadaki normal galeri) */}
      <div className="mt-10 grid gap-4 md:grid-cols-12">
        <button
          type="button"
          onClick={() => openAt(0)}
          className={cn(
            "group relative aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm md:col-span-8",
            "transition hover:shadow-[0_30px_80px_rgba(0,0,0,.10)]"
          )}
        >
          {/* premium overlay */}
          <div className="pointer-events-none absolute inset-0 z-[1] ring-1 ring-black/5" />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-80" />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.25),transparent_40%)]" />

          {isSold && (
            <div className="absolute left-4 top-4 z-10 rounded-full border border-red-200 bg-red-600/90 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
              Satıldı
            </div>
          )}

          <div className="absolute bottom-4 left-4 z-10">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-black/35 px-3 py-2 text-xs text-white backdrop-blur-xl">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px]">
                ⌁
              </span>
              <span className="opacity-95">Fotoğrafları gör</span>
            </div>
          </div>

          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
        </button>

        <div className="grid gap-4 md:col-span-4">
          <button
            type="button"
            onClick={() => openAt(1)}
            className={cn(
              "group relative aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm",
              "transition hover:shadow-[0_26px_70px_rgba(0,0,0,.10)]"
            )}
            disabled={!side1}
          >
            <div className="pointer-events-none absolute inset-0 z-[1] ring-1 ring-black/5" />
            {side1 ? (
              <Image
                src={side1}
                alt={title}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => openAt(2)}
            className={cn(
              "group relative aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm",
              "transition hover:shadow-[0_26px_70px_rgba(0,0,0,.10)]"
            )}
            disabled={!side2}
          >
            <div className="pointer-events-none absolute inset-0 z-[1] ring-1 ring-black/5" />
            {side2 ? (
              <Image
                src={side2}
                alt={title}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : null}
          </button>
        </div>
      </div>

      {/* THUMBNAILS (sayfa altı) */}
      {ordered.length > 3 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {ordered.map((u, i) => (
            <button
              key={`${u}-${i}`}
              type="button"
              onClick={() => openAt(i)}
              className={cn(
                "group relative h-20 w-28 flex-none overflow-hidden rounded-2xl border bg-neutral-100",
                "border-neutral-200 hover:border-neutral-300"
              )}
              title={`Foto ${i + 1}`}
            >
              <Image src={u} alt={title} fill className="object-cover" sizes="112px" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
            </button>
          ))}
        </div>
      )}

      {/* MODAL (fullscreen premium) */}
      {open && current && (
        <div
          className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-2xl"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
          }}
          onTouchEnd={(e) => {
            const start = touch.current;
            touch.current = null;
            if (!start) return;

            const t = e.changedTouches[0];
            const dx = t.clientX - start.x;
            const dy = t.clientY - start.y;
            const dt = Date.now() - start.t;

            // swipe: yatay baskın + yeterli mesafe + hızlı
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && dt < 600) {
              if (dx > 0) prev();
              else next();
            }
          }}
        >
          {/* soft gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.10),transparent_45%)]" />

          {/* TOP BAR (glass) */}
          <div className="absolute left-4 right-4 top-4 z-[700]">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-[0_24px_80px_rgba(0,0,0,.30)] backdrop-blur-xl">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-xs opacity-80">
                    {idx + 1} / {total}
                  </div>
                  {isSold ? (
                    <span className="rounded-full border border-red-200/40 bg-red-500/25 px-2 py-0.5 text-[11px]">
                      Satıldı
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 truncate text-sm font-medium">{title}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[12px] transition",
                    copied
                      ? "border-emerald-200/40 bg-emerald-500/15 text-emerald-50"
                      : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  {copied ? "Link Kopyalandı ✓" : "Linki Kopyala"}
                </button>

                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[12px] text-white hover:bg-white/15"
                >
                  Kapat ✕
                </button>
              </div>
            </div>
          </div>

          {/* ARROWS (premium) */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 z-[650] -translate-y-1/2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-[0_22px_70px_rgba(0,0,0,.25)] backdrop-blur-xl hover:bg-white/15"
                aria-label="Önceki"
              >
                ←
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 z-[650] -translate-y-1/2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-[0_22px_70px_rgba(0,0,0,.25)] backdrop-blur-xl hover:bg-white/15"
                aria-label="Sonraki"
              >
                →
              </button>
            </>
          )}

          {/* IMAGE STAGE */}
          <div className="absolute inset-0 flex items-center justify-center p-5 md:p-10">
            <div className="relative h-[78vh] w-[94vw] max-w-7xl">
              <Image
                src={current}
                alt={title}
                fill
                className="object-contain"
                sizes="94vw"
                priority
              />
            </div>
          </div>

          {/* BOTTOM BAR (thumb rail - Apple vibe) */}
          <div className="absolute bottom-4 left-4 right-4 z-[700]">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3 shadow-[0_26px_90px_rgba(0,0,0,.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-white/80">
                  Fotoğraflar — kaydır veya ok tuşlarını kullan
                </div>
                <div className="text-[12px] text-white/70">{idx + 1}/{total}</div>
              </div>

              <div
                ref={thumbsRef}
                className="mt-3 flex gap-2 overflow-x-auto pb-1"
              >
                {ordered.map((u, i) => (
                  <button
                    key={`${u}-${i}`}
                    data-i={i}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={cn(
                      "relative h-14 w-20 flex-none overflow-hidden rounded-xl border transition",
                      i === idx
                        ? "border-white/60 ring-2 ring-white/35"
                        : "border-white/15 hover:border-white/30"
                    )}
                    title={`Foto ${i + 1}`}
                  >
                    <Image src={u} alt={title} fill className="object-cover" sizes="80px" />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-black/10" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}