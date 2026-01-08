"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Props = {
  title: string;
  images: string[];
  coverUrl?: string | null;
  isSold?: boolean;
};

export default function ListingGallery({ title, images, coverUrl, isSold }: Props) {
  const ordered = useMemo(() => {
    const imgs = (images ?? []).filter(Boolean);
    if (!imgs.length) return [];
    if (!coverUrl) return imgs;

    // coverUrl varsa başa al
    const rest = imgs.filter((u) => u !== coverUrl);
    return [coverUrl, ...rest].filter(Boolean);
  }, [images, coverUrl]);

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const total = ordered.length;
  const current = ordered[idx];

  function openAt(i: number) {
    if (!total) return;
    setIdx(Math.max(0, Math.min(i, total - 1)));
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function prev() {
    setIdx((v) => (v - 1 + total) % total);
  }

  function next() {
    setIdx((v) => (v + 1) % total);
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
          className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm md:col-span-8"
        >
          {isSold && (
            <div className="absolute left-4 top-4 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
              Satıldı
            </div>
          )}
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
        </button>

        <div className="grid gap-4 md:col-span-4">
          <button
            type="button"
            onClick={() => openAt(1)}
            className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm"
            disabled={!side1}
          >
            {side1 ? (
              <Image
                src={side1}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => openAt(2)}
            className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100 shadow-sm"
            disabled={!side2}
          >
            {side2 ? (
              <Image
                src={side2}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : null}
          </button>
        </div>
      </div>

      {/* THUMBNAILS (istersen) */}
      {ordered.length > 3 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {ordered.map((u, i) => (
            <button
              key={u}
              type="button"
              onClick={() => openAt(i)}
              className="relative h-20 w-28 flex-none overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100"
              title={`Foto ${i + 1}`}
            >
              <Image src={u} alt={title} fill className="object-cover" sizes="112px" />
            </button>
          ))}
        </div>
      )}

      {/* MODAL (fullscreen) */}
      {open && current && (
        <div
          className="fixed inset-0 z-[999] bg-black/85"
          onMouseDown={(e) => {
            // arka plana tıklayınca kapansın
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* üst bar */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4 text-white">
            <div className="text-xs opacity-80">
              {idx + 1} / {total}
            </div>

            <button
              type="button"
              onClick={close}
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Kapat ✕
            </button>
          </div>

          {/* oklar */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20"
                aria-label="Önceki"
              >
                ←
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20"
                aria-label="Sonraki"
              >
                →
              </button>
            </>
          )}

          {/* görüntü alanı */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="relative h-[82vh] w-[92vw] max-w-6xl">
              <Image
                src={current}
                alt={title}
                fill
                className="object-contain"
                sizes="92vw"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}