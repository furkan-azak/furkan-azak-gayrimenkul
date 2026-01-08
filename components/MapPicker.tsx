"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
  defaultCenter: LatLng;
  zoom?: number;
  height?: number;
};

function fixLeafletIconsOnce() {
  // Next + Leaflet'te marker ikonları bazen görünmez → URL fix
  // (Tek sefer çalışsın)
  // @ts-expect-error internal
  if ((L as any).__iconFixed) return;
  // @ts-expect-error internal
  (L as any).__iconFixed = true;

  // @ts-expect-error private
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function ClickToPick({
  onPick,
}: {
  onPick: (latlng: LatLng) => void;
}) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({
  value,
  onChange,
  defaultCenter,
  zoom = 12,
  height = 320,
}: Props) {
  useEffect(() => {
    fixLeafletIconsOnce();
  }, []);

  const center = useMemo(() => value ?? defaultCenter, [value, defaultCenter]);

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      <div style={{ height }}>
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickToPick onPick={(p) => onChange(p)} />

          {value ? <Marker position={value} /> : null}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-xs text-neutral-600">
          {value
            ? `Seçilen: ${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`
            : "Haritaya tıkla → pin koy"}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs hover:border-neutral-400"
          >
            Konumu kaldır
          </button>
          <button
            type="button"
            onClick={() => onChange(defaultCenter)}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs hover:border-neutral-400"
          >
            İzmir’e çek
          </button>
        </div>
      </div>
    </div>
  );
}