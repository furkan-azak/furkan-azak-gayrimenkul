import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/lib/listings";
import ListingGallery from "@/components/ListingGallery";
import ListingTabs from "@/components/ListingTabs";

function typeLabel(t: "sale" | "rent") {
  return t === "sale" ? "Satılık" : "Kiralık";
}

function normalizeTypeKey(v: unknown): "sale" | "rent" {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "rent" || s === "kiralık" || s === "kiralik") return "rent";
  if (s === "sale" || s === "satılık" || s === "satilik") return "sale";
  return "sale";
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const listing = await getListingBySlug(slug);
  if (!listing) return notFound();

  const locationText = [listing.city, listing.district, listing.neighborhood]
    .filter(Boolean)
    .join(" · ");

  const images: string[] = (listing.images ?? (listing as any).imageUrls ?? []).filter(Boolean);
  const coverUrl: string | null = (listing as any).coverUrl ?? (images[0] ?? null);

  const videos: string[] = (listing.videos ?? (listing as any).videoUrls ?? []).filter(Boolean);

  const rawLoc = (listing as any).location;
  const mapLocation =
    rawLoc && typeof rawLoc.lat === "number" && typeof rawLoc.lng === "number"
      ? { lat: rawLoc.lat, lng: rawLoc.lng }
      : null;

  const typeKey = normalizeTypeKey((listing as any).listingType);

  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-neutral-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="tracking-tight">
            <div className="text-sm uppercase tracking-[0.22em] text-neutral-600">Furkan Azak</div>
            <div className="text-lg font-medium">Gayrimenkul</div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-neutral-700 md:flex">
            <Link className="hover:text-neutral-950" href="/portfoy">
              Portföyler
            </Link>
            <Link className="hover:text-neutral-950" href="/#hakkimda">
              Hakkımda
            </Link>
            <Link className="hover:text-neutral-950" href="/#iletisim">
              İletişim
            </Link>
          </nav>

          <a
            href="https://wa.me/905364518194"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm hover:border-neutral-400"
          >
            WhatsApp
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10">
        {/* Breadcrumb */}
        <div className="text-sm text-neutral-600">
          <Link href="/portfoy" className="hover:text-neutral-900">
            Portföyler
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">
            {listing.category} · {typeLabel(typeKey)}
          </span>
        </div>

        {/* Title */}
        <div className="mt-6 grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
              {listing.category} · {typeLabel(typeKey)}
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {listing.title}
            </h1>

            <p className="mt-3 text-sm text-neutral-700">{locationText}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700">
                {typeLabel(typeKey)}
              </span>

              {listing.isSold && (
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">
                  Satıldı
                </span>
              )}

              {(listing.badges ?? []).map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700"
                >
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/905364518194"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-neutral-900 px-6 py-3 text-sm text-neutral-50 hover:bg-neutral-800"
              >
                WhatsApp’tan Yaz
              </a>
              <a
                href="tel:+905364518194"
                className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm text-neutral-900 hover:border-neutral-400"
              >
                Hemen Ara
              </a>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">Özet</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{listing.priceText}</div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-600">m²</div>
                  <div className="mt-1 font-medium">{listing.areaM2 ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs text-neutral-600">Oda</div>
                  <div className="mt-1 font-medium">{listing.rooms ?? "—"}</div>
                </div>
              </div>

              <div className="mt-6 text-xs text-neutral-500">Fiyat ve uygunluk bilgisi için iletişim.</div>
            </div>
          </div>
        </div>

        <ListingGallery
          title={listing.title}
          images={images}
          coverUrl={coverUrl}
          isSold={!!listing.isSold}
        />

        {videos.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight">Video</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {videos.map((v) => (
                <div
                  key={v}
                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
                >
                  <video src={v} controls playsInline className="h-full w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Tabs + Contact card */}
        <div className="mt-14 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <ListingTabs listing={listing as any} mapLocation={mapLocation} />
          </div>

          <aside className="md:col-span-5">
            <div className="sticky top-[92px] rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">Hızlı İletişim</div>

              <div className="mt-3 text-lg font-medium tracking-tight">
                {typeLabel(typeKey)} {listing.category}
              </div>
              <div className="mt-2 text-sm text-neutral-600">{locationText || "—"}</div>

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="text-xs text-neutral-600">Fiyat</div>
                <div className="mt-1 text-xl font-semibold">{listing.priceText || "₺ —"}</div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <a
                  href="https://wa.me/905364518194"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-neutral-900 px-6 py-3 text-center text-sm text-neutral-50 hover:bg-neutral-800"
                >
                  WhatsApp’tan bilgi al
                </a>
                <a
                  href="tel:+905364518194"
                  className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-center text-sm text-neutral-900 hover:border-neutral-400"
                >
                  Telefonla ara
                </a>
                <Link
                  href="/portfoy"
                  className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-center text-sm text-neutral-900 hover:border-neutral-400"
                >
                  Tüm portföylere dön
                </Link>
              </div>

              <div className="mt-6 text-xs text-neutral-500">
                Detaylar ve güncel durum için iletişime geçebilirsin.
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-20 border-t border-neutral-200 py-10 text-xs text-neutral-500">
          ©️ <span suppressHydrationWarning>{year}</span> Furkan Azak Gayrimenkul
        </footer>
      </section>
    </main>
  );
}