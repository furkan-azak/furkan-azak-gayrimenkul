"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

function fixLeafletIconsOnce() {
  const anyL = L as any;
  if (anyL.__iconFixed) return;
  anyL.__iconFixed = true;

  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function injectLeafletPremiumCssOnce() {
  if (typeof window === "undefined") return;
  const id = "leaflet-premium-ui-v5";
  if (document.getElementById(id)) return;

  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    .leaflet-container{
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }

    /* Attribution */
    .leaflet-control-attribution{
      background: rgba(255,255,255,.72) !important;
      border: 1px solid rgba(0,0,0,.06) !important;
      border-radius: 999px !important;
      padding: 5px 10px !important;
      margin: 12px !important;
      font-size: 11px !important;
      color: rgba(0,0,0,.55) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0,0,0,.10) !important;
    }
    .leaflet-control-attribution a{ color: rgba(0,0,0,.60) !important; text-decoration: none !important; }
    .leaflet-control-attribution a:hover{ text-decoration: underline !important; }

    /* Zoom controls */
    .leaflet-control-zoom{
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      margin: 14px !important;
    }
    .leaflet-control-zoom a{
      width: 44px !important;
      height: 44px !important;
      line-height: 44px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(0,0,0,.10) !important;
      background: rgba(255,255,255,.88) !important;
      color: rgba(0,0,0,.82) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 14px 34px rgba(0,0,0,.14) !important;
      transition: transform .15s ease, background .15s ease, border-color .15s ease;
      margin-bottom: 10px !important;
      font-weight: 700 !important;
    }
    .leaflet-control-zoom a:hover{
      transform: translateY(-1px);
      background: rgba(255,255,255,.97) !important;
      border-color: rgba(0,0,0,.18) !important;
    }

    /* Popup */
    .leaflet-popup-content-wrapper{
      border-radius: 18px !important;
      border: 1px solid rgba(0,0,0,.08) !important;
      box-shadow: 0 20px 60px rgba(0,0,0,.20) !important;
      background: rgba(255,255,255,.92) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .leaflet-popup-content{
      margin: 12px 14px !important;
      font-size: 13px !important;
      color: rgba(0,0,0,.82) !important;
    }

    /* LUX PIN */
    .lux-pin {
      position: relative;
      width: 44px;
      height: 56px;
      filter: drop-shadow(0 16px 30px rgba(0,0,0,.22));
      pointer-events: none;
    }
    .lux-pin .ring {
      position: absolute;
      left: 0; top: 0;
      width: 44px; height: 44px;
      border-radius: 999px;
      background:
        radial-gradient(circle at 30% 30%, rgba(255,255,255,.38), rgba(255,255,255,0) 58%),
        linear-gradient(135deg, #0b0b0b, #171717);
      border: 1px solid rgba(255,255,255,.12);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.10);
    }
    .lux-pin .dot {
      position: absolute;
      left: 50%; top: 22px;
      width: 12px; height: 12px;
      transform: translate(-50%,-50%);
      border-radius: 999px;
      background: radial-gradient(circle at 30% 30%, #ffe9a6, #d4a84a);
      box-shadow: 0 6px 16px rgba(212,168,74,.35);
    }
    .lux-pin .tail {
      position: absolute;
      left: 50%;
      top: 40px;
      transform: translateX(-50%);
      width: 0; height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 14px solid #0c0c0c;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,.18));
    }

    /* pulse */
    .lux-pulse {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: rgba(212,168,74,.22);
      box-shadow: 0 0 0 0 rgba(212,168,74,.28);
      animation: luxPulse 1.6s ease-out infinite;
    }
    @keyframes luxPulse{
      0% { box-shadow: 0 0 0 0 rgba(212,168,74,.28); transform: scale(1); }
      70% { box-shadow: 0 0 0 18px rgba(212,168,74,0); transform: scale(1.05); }
      100% { box-shadow: 0 0 0 0 rgba(212,168,74,0); transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

/** Tab içinde açılınca Leaflet bazen ölçüyü yanlış alır */
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const t1 = window.setTimeout(() => map.invalidateSize(), 0);
    const t2 = window.setTimeout(() => map.invalidateSize(), 180);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map]);
  return null;
}

function MapInner({
  location,
  title,
  luxIcon,
  pulseIcon,
  scrollWheelZoom,
}: {
  location: LatLng;
  title: string;
  luxIcon: L.DivIcon;
  pulseIcon: L.DivIcon;
  scrollWheelZoom: boolean;
}) {
  return (
    <MapContainer
      center={location}
      zoom={15}
      scrollWheelZoom={scrollWheelZoom}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <InvalidateSizeOnMount />

      {/* Daha “entelektüel” / temiz basemap */}
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      <ZoomControl position="bottomright" />

      {/* pulse */}
      <Marker position={location} icon={pulseIcon} />

      {/* premium pin */}
      <Marker position={location} icon={luxIcon}>
        <Popup>
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              İlan
            </div>
            <div className="font-medium text-neutral-900">{title}</div>
            <div className="text-[12px] text-neutral-600">
              Haritada yaklaşık konum.
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default function ListingMap({
  location,
  title,
}: {
  location: LatLng;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    fixLeafletIconsOnce();
    injectLeafletPremiumCssOnce();
  }, []);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // modal açıkken scroll kilitle
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const luxIcon = useMemo(() => {
    return L.divIcon({
      className: "",
      html: `
        <div class="lux-pin" aria-label="Konum pini">
          <div class="ring"></div>
          <div class="dot"></div>
          <div class="tail"></div>
        </div>
      `,
      iconSize: [44, 56],
      iconAnchor: [22, 56],
      popupAnchor: [0, -58],
    });
  }, []);

  const pulseIcon = useMemo(() => {
    return L.divIcon({
      className: "",
      html: `<div class="lux-pulse"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }, []);

  function openDirections() {
    const { lat, lng } = location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyLocationLink() {
    try {
      const { lat, lng } = location;
      const link = `https://www.google.com/maps?q=${lat},${lng}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  }

  return (
    <>
      {/* EMBED MAP */}
      <div className="relative h-[380px] w-full overflow-hidden rounded-3xl bg-neutral-100">
        {/* premium overlays */}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.35),transparent_45%)]" />

        {/* top-left glass header */}
        <div className="absolute left-4 top-4 z-[600]">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/70 px-3 py-2 text-xs text-neutral-800 shadow-[0_18px_60px_rgba(0,0,0,.14)] backdrop-blur-xl">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white text-[11px]">
              ⌁
            </span>
            <div className="leading-tight">
              <div className="font-medium">Konum</div>
              <div className="text-[11px] text-neutral-600">
                Haritada ilan noktası
              </div>
            </div>
          </div>
        </div>

        {/* top-right fullscreen button */}
        <div className="absolute right-4 top-4 z-[600]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-2xl border border-white/40 bg-white/70 px-3 py-2 text-[12px] text-neutral-900 shadow-[0_18px_60px_rgba(0,0,0,.14)] backdrop-blur-xl hover:bg-white/80"
          >
            Tam ekran ⤢
          </button>
        </div>

        {/* bottom actions */}
        <div className="absolute bottom-4 left-4 right-4 z-[600]">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 shadow-[0_22px_70px_rgba(0,0,0,.16)] backdrop-blur-xl">
            <div className="text-[12px] text-neutral-700">
              Konum bilgisi yaklaşık gösterilir.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyLocationLink}
                className={cn(
                  "rounded-xl border px-3 py-2 text-[12px] transition",
                  copied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300"
                )}
              >
                {copied ? "Kopyalandı ✓" : "Konumu Kopyala"}
              </button>

              <button
                type="button"
                onClick={openDirections}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-[12px] text-white hover:bg-neutral-800"
              >
                Yol Tarifi
              </button>
            </div>
          </div>
        </div>

        <MapInner
          location={location}
          title={title}
          luxIcon={luxIcon}
          pulseIcon={pulseIcon}
          scrollWheelZoom={false}
        />
      </div>

      {/* FULLSCREEN MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-2xl"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          onTouchStart={(e) => {
            const t = e.touches[0];
            touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
          }}
          onTouchEnd={() => {
            touch.current = null;
          }}
        >
          {/* soft gradients */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.10),transparent_45%)]" />

          {/* TOP BAR */}
          <div className="absolute left-4 right-4 top-4 z-[700]">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white shadow-[0_24px_80px_rgba(0,0,0,.30)] backdrop-blur-xl">
              <div className="min-w-0">
                <div className="text-xs opacity-80">Konum</div>
                <div className="mt-1 truncate text-sm font-medium">{title}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyLocationLink}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[12px] transition",
                    copied
                      ? "border-emerald-200/40 bg-emerald-500/15 text-emerald-50"
                      : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  )}
                >
                  {copied ? "Kopyalandı ✓" : "Konumu Kopyala"}
                </button>

                <button
                  type="button"
                  onClick={openDirections}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[12px] text-white hover:bg-white/15"
                >
                  Yol Tarifi
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[12px] text-white hover:bg-white/15"
                >
                  Kapat ✕
                </button>
              </div>
            </div>
          </div>

          {/* MAP STAGE */}
          <div className="absolute inset-0 flex items-center justify-center p-5 md:p-10">
            <div className="relative h-[78vh] w-[94vw] max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-[0_35px_120px_rgba(0,0,0,.55)]">
              <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
              <MapInner
                location={location}
                title={title}
                luxIcon={luxIcon}
                pulseIcon={pulseIcon}
                scrollWheelZoom={true}
              />
            </div>
          </div>

          {/* BOTTOM NOTE */}
          <div className="absolute bottom-4 left-4 right-4 z-[700]">
            <div className="mx-auto max-w-7xl rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-[12px] text-white/80 shadow-[0_26px_90px_rgba(0,0,0,.35)] backdrop-blur-xl">
              İpucu: Yakınlaştırmak için +/– butonlarını kullan. (ESC ile kapanır)
            </div>
          </div>
        </div>
      )}
    </>
  );
}