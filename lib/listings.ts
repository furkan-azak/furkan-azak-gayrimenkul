import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { unstable_noStore as noStore } from "next/cache";

export type Category = "Villa" | "Daire" | "Arsa";
export type ListingType = "sale" | "rent";
export type ListingFeature = { label: string; value: string };
export type LatLng = { lat: number; lng: number };

export type Listing = {
  id: string;
  slug: string;
  title: string;
  category: Category;

  // ✅ yeni: satılık/kiralık
  listingType?: ListingType;

  city: string;
  district?: string;
  neighborhood?: string;
  priceText: string;
  areaM2?: number;
  rooms?: string;
  badges?: string[];
  description: string;
  features?: ListingFeature[];

  images?: string[];
  videos?: string[];

  coverUrl?: string | null;
  isSold?: boolean;

  location?: LatLng | null;
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asOptionalString(v: unknown): string | undefined {
  const s = asString(v, "").trim();
  return s ? s : undefined;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asStringArray(v: unknown): string[] | undefined {
  if (Array.isArray(v)) {
    const arr = v.map((x) => asString(x, "").trim()).filter(Boolean);
    return arr.length ? arr : undefined;
  }
  if (typeof v === "string") {
    const arr = v
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);
    return arr.length ? arr : undefined;
  }
  return undefined;
}

function parseFeatures(v: unknown): ListingFeature[] | undefined {
  if (Array.isArray(v)) {
    const arr = v
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        const o = x as Record<string, unknown>;
        const label = asString(o.label, "").trim();
        const value = asString(o.value, "").trim();
        if (!label || !value) return null;
        return { label, value };
      })
      .filter(Boolean) as ListingFeature[];
    return arr.length ? arr : undefined;
  }

  if (typeof v === "string") {
    const parts = v
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);

    const arr = parts
      .map((p) => {
        const idx = p.indexOf(":");
        if (idx === -1) return null;
        const label = p.slice(0, idx).trim();
        const value = p.slice(idx + 1).trim();
        if (!label || !value) return null;
        return { label, value };
      })
      .filter(Boolean) as ListingFeature[];

    return arr.length ? arr : undefined;
  }

  return undefined;
}

function normalizeCategory(v: unknown): Category {
  const s = asString(v, "Daire");
  if (s === "Villa" || s === "Daire" || s === "Arsa") return s;
  return "Daire";
}

function normalizeListingType(v: unknown): ListingType {
  const s = asString(v, "sale");
  return s === "rent" ? "rent" : "sale";
}

function parseLocation(v: unknown): LatLng | null {
  if (!v || typeof v !== "object") return null;
  const o = v as any;
  if (typeof o.lat === "number" && typeof o.lng === "number") {
    return { lat: o.lat, lng: o.lng };
  }
  return null;
}

function mapDocToListing(id: string, data: Record<string, unknown>): Listing {
  const slug = asString(data.slug, id).trim() || id;

  const images =
    asStringArray(data.images) ??
    asStringArray((data as any).imageUrls) ??
    undefined;

  const videos =
    asStringArray(data.videos) ??
    asStringArray((data as any).videoUrls) ??
    undefined;

  return {
    id,
    slug,
    title: asString(data.title, "").trim(),
    category: normalizeCategory(data.category),

    // ✅ burada ekliyoruz
    listingType: normalizeListingType((data as any).listingType),

    city: asString(data.city, "").trim(),
    district: asOptionalString(data.district),
    neighborhood: asOptionalString(data.neighborhood),
    priceText: asString(data.priceText, "₺ —").trim() || "₺ —",
    areaM2: asNumber(data.areaM2),
    rooms: asOptionalString(data.rooms),
    badges: asStringArray(data.badges),
    description: asString(data.description, "").trim(),
    features: parseFeatures(data.features),

    images,
    videos,

    coverUrl: (data as any).coverUrl ?? null,
    isSold: Boolean((data as any).isSold),

    location: parseLocation((data as any).location),
  };
}

export async function getListings(): Promise<Listing[]> {
  noStore();

  const col = collection(db, "listings");

  let qRef;
  try {
    qRef = query(col, orderBy("createdAt", "desc"));
  } catch {
    qRef = query(col);
  }

  const snap = await getDocs(qRef);
  const items = snap.docs.map((d) =>
    mapDocToListing(d.id, d.data() as Record<string, unknown>)
  );

  return items.filter((x) => x.slug && x.title);
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  noStore();

  const direct = await getDoc(doc(db, "listings", slug));
  if (direct.exists()) {
    return mapDocToListing(direct.id, direct.data() as Record<string, unknown>);
  }

  const col = collection(db, "listings");
  const qRef = query(col, where("slug", "==", slug), limit(1));
  const snap = await getDocs(qRef);
  const first = snap.docs[0];
  if (!first) return null;

  return mapDocToListing(first.id, first.data() as Record<string, unknown>);
}