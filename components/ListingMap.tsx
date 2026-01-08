"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

type LatLng = { lat: number; lng: number };

function fixLeafletIconsOnce() {
  const anyL = L as any;
  if (anyL.__iconFixed) return;
  anyL.__iconFixed = true;

  // Leaflet default icon path fix
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export default function ListingMap({
  location,
  title,
}: {
  location: LatLng;
  title: string;
}) {
  useEffect(() => {
    fixLeafletIconsOnce();
  }, []);

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-6">
        <h2 className="text-lg font-medium tracking-tight">Konum</h2>
        <p className="mt-1 text-sm text-neutral-600">Harita üzerinde ilan konumu.</p>
      </div>

      <div className="h-[360px] w-full">
        <MapContainer
          center={location}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={location}>
            <Popup>{title}</Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="border-t border-neutral-200 p-4 font-mono text-xs text-neutral-600">
        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
      </div>
    </div>
  );
}