"use client";

import { useEffect, useMemo, useState } from "react";
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
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function injectLeafletPremiumCssOnce() {
  if (typeof window === "undefined") return;
  const id = "leaflet-premium-ui-v4";
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

    /* LUX PIN (uç kısmı iconSize içinde, anchor tam noktaya oturur) */
    .lux-pin {
      position: relative;
      width: 44px;
      height: 56px; /* 44 circle + 12 tail */
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

/** Tab içinde açılınca Leaflet bazen ölçüyü yanlış alır → harita/pin kayıyor gibi görünür */
function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const t1 = window.setTimeout(() => map.invalidateSize(), 0);
    const t2 = window.setTimeout(() => map.invalidateSize(), 160);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map]);
  return null;
}

export default function ListingMap({
  location,
  title,
}: {
  location: LatLng;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fixLeafletIconsOnce();
    injectLeafletPremiumCssOnce();
  }, []);

  const luxIcon = useMemo(() => {
    // anchor: tam “uç” noktası = kutunun alt orta noktası
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
      // koordinat göstermiyoruz → link kopyalıyoruz
      const link = `https://www.google.com/maps?q=${lat},${lng}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  }

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-3xl bg-neutral-100">
      {/* premium overlays */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,.35),transparent_45%)]" />

      {/* top-left glass header */}
      <div className="pointer-events-none absolute left-4 top-4 z-[600]">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/70 px-3 py-2 text-xs text-neutral-800 shadow-[0_18px_60px_rgba(0,0,0,.14)] backdrop-blur-xl">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-white text-[11px]">
            ⌁
          </span>
          <div className="leading-tight">
            <div className="font-medium">Konum</div>
            <div className="text-[11px] text-neutral-600">Haritada ilan noktası</div>
          </div>
        </div>
      </div>

      {/* bottom actions (Apple-ish, coordinates yok) */}
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

      <MapContainer
        center={location}
        zoom={15}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <InvalidateSizeOnMount />

        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="bottomright" />

        {/* pulse layer (exact coordinate) */}
        <Marker position={location} icon={pulseIcon} />

        {/* premium pin */}
        <Marker position={location} icon={luxIcon}>
          <Popup>
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">İlan</div>
              <div className="font-medium text-neutral-900">{title}</div>
              <div className="text-[12px] text-neutral-600">Haritada yaklaşık konum.</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}