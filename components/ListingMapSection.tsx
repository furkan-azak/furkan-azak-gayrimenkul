"use client";

import dynamic from "next/dynamic";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
});

export default function ListingMapSection({
  location,
  title,
}: {
  location: { lat: number; lng: number };
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <ListingMap location={location} title={title} />
    </div>
  );
}