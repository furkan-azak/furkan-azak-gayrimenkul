import Link from "next/link";
import { getListings, type Category } from "@/lib/listings";
import ListingCardCarousel from "@/components/ListingCardCarousel";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ text }: { text: string }) {
  const sold = text.toLowerCase() === "satıldı";
  const rent = text.toLowerCase() === "kiralık" || text.toLowerCase() === "kiralik";
  const sale = text.toLowerCase() === "satılık" || text.toLowerCase() === "satilik";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs",
        "bg-white/70 backdrop-blur",
        sold
          ? "border-red-200 text-red-700"
          : rent
          ? "border-blue-200 text-blue-700"
          : sale
          ? "border-emerald-200 text-emerald-700"
          : "border-neutral-200 text-neutral-700"
      )}
    >
      {text}
    </span>
  );
}

const CATS: Array<Category | "Tümü"> = ["Tümü", "Villa", "Daire", "Arsa", "Dükkan"];
const TYPES: Array<"Tümü" | "sale" | "rent"> = ["Tümü", "sale", "rent"];

function typeLabel(t: "sale" | "rent") {
  return t === "sale" ? "Satılık" : "Kiralık";
}

function normalizeTypeKey(v: unknown): "sale" | "rent" {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "rent" || s === "kiralık" || s === "kiralik") return "rent";
  if (s === "sale" || s === "satılık" || s === "satilik") return "sale";
  return "sale";
}

type SP =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

export default async function PortfolioPage({ searchParams }: { searchParams?: SP }) {
  const sp = await Promise.resolve(searchParams ?? {});
  const getOne = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const catRaw = (getOne((sp as any).cat) ?? "Tümü").trim();
  const cat = (CATS.includes(catRaw as any) ? catRaw : "Tümü") as Category | "Tümü";

  const tRaw = (getOne((sp as any).t) ?? "Tümü").trim();
  const t = (TYPES.includes(tRaw as any) ? tRaw : "Tümü") as "Tümü" | "sale" | "rent";

  const qInput = (getOne((sp as any).q) ?? "").trim();
  const q = qInput.toLowerCase();

  const all = await getListings();

  const filtered = all.filter((x: any) => {
    const typeKey = normalizeTypeKey(x.listingType);
    const typeOk = t === "Tümü" ? true : typeKey === t;
    const catOk = cat === "Tümü" ? true : x.category === cat;

    const qOk =
      !q ||
      [
        x.title,
        x.city,
        x.district,
        x.neighborhood,
        x.category,
        ...(x.badges ?? []),
        x.isSold ? "Satıldı" : "",
        typeLabel(typeKey),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);

    return typeOk && catOk && qOk;
  });

  const resultsText = `${filtered.length} sonuç`;

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* PREMIUM TOP BAR */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-neutral-50/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="group tracking-tight">
            <div className="text-sm uppercase tracking-[0.28em] text-neutral-600 group-hover:text-neutral-900">
              Furkan Azak
            </div>
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
            className={cn(
              "rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 shadow-sm",
              "hover:border-neutral-400 hover:shadow"
            )}
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* HERO + SEARCH */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div
          className={cn(
            "relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm",
            "p-8 md:p-10"
          )}
        >
          {/* subtle background */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-50 to-white" />

          <div className="relative">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-600">
                  Satılık · Kiralık · Arsa · Villa · Daire · Dükkan
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  Portföyler
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
                  Seçili ilanlar; net bilgi, sade sunum, hızlı iletişim. Swipe ile görselleri gez,
                  tek tıkla ilana gir.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full border border-neutral-200 bg-white/70 px-4 py-2 text-sm text-neutral-700 backdrop-blur">
                  <span className="font-medium text-neutral-900">{resultsText}</span>
                </span>
                <Link
                  href="/"
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 hover:border-neutral-400"
                >
                  Ana sayfa
                </Link>
              </div>
            </div>

            {/* Search */}
            <form className="mt-7" action="/portfoy">
              <div className="relative">
                <input
                  name="q"
                  defaultValue={qInput}
                  placeholder="Ara: Çeşme, villa, arsa..."
                  className={cn(
                    "w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-sm outline-none",
                    "placeholder:text-neutral-400 focus:border-neutral-400",
                    "pr-32"
                  )}
                />
                <button
                  type="submit"
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 text-sm",
                    "bg-neutral-900 text-neutral-50 hover:bg-neutral-800"
                  )}
                >
                  Ara
                </button>
              </div>

              {cat !== "Tümü" && <input type="hidden" name="cat" value={cat} />}
              {t !== "Tümü" && <input type="hidden" name="t" value={t} />}
            </form>

            {/* ✅ Sticky Premium Filter Bar */}
            <div className="mt-7 rounded-2xl border border-neutral-200 bg-white/70 p-4 backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm font-medium text-neutral-900">Filtreler</div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* type chips */}
                  {TYPES.map((tt) => {
                    const active = t === tt || (tt === "Tümü" && t === "Tümü");
                    const label = tt === "Tümü" ? "Hepsi" : typeLabel(tt);

                    const href =
                      tt === "Tümü"
                        ? `/portfoy${cat !== "Tümü" ? `?cat=${encodeURIComponent(cat)}` : ""}${
                            qInput ? `${cat !== "Tümü" ? "&" : "?"}q=${encodeURIComponent(qInput)}` : ""
                          }`
                        : `/portfoy?${cat !== "Tümü" ? `cat=${encodeURIComponent(cat)}&` : ""}t=${encodeURIComponent(
                            tt
                          )}${qInput ? `&q=${encodeURIComponent(qInput)}` : ""}`;

                    return (
                      <Link
                        key={tt}
                        href={href}
                        scroll={false}
                        prefetch={false}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm transition",
                          active
                            ? "border-neutral-900 bg-neutral-900 text-neutral-50"
                            : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400"
                        )}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* cat chips */}
                {CATS.map((c) => {
                  const active = cat === c || (c === "Tümü" && cat === "Tümü");

                  const href =
                    c === "Tümü"
                      ? `/portfoy${t !== "Tümü" ? `?t=${encodeURIComponent(t)}` : ""}${
                          qInput ? `${t !== "Tümü" ? "&" : "?"}q=${encodeURIComponent(qInput)}` : ""
                        }`
                      : `/portfoy?cat=${encodeURIComponent(c)}${
                          t !== "Tümü" ? `&t=${encodeURIComponent(t)}` : ""
                        }${qInput ? `&q=${encodeURIComponent(qInput)}` : ""}`;

                  return (
                    <Link
                      key={c}
                      href={href}
                      scroll={false}
                      prefetch={false}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition",
                        active
                          ? "border-neutral-900 bg-neutral-900 text-neutral-50"
                          : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400"
                      )}
                    >
                      {c}
                    </Link>
                  );
                })}
              </div>

              {/* Active filters mini summary */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
                  Tip: <span className="text-neutral-900">{t === "Tümü" ? "Hepsi" : typeLabel(t)}</span>
                </span>
                <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
                  Kategori: <span className="text-neutral-900">{cat === "Tümü" ? "Hepsi" : cat}</span>
                </span>
                {!!qInput && (
                  <span className="rounded-full border border-neutral-200 bg-white px-3 py-1">
                    Arama: <span className="text-neutral-900">{qInput}</span>
                  </span>
                )}
                {(t !== "Tümü" || cat !== "Tümü" || qInput) && (
                  <Link
                    href="/portfoy"
                    className="ml-auto rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-neutral-300"
                  >
                    Filtreleri sıfırla
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="grid gap-6 md:grid-cols-3">
          {filtered.map((x: any) => {
            const typeKey = normalizeTypeKey(x.listingType);

            const images: string[] = [
              ...(x.images ?? []),
              ...((x as any).imageUrls ?? []),
            ].filter(Boolean);

            const cover = (x as any).coverUrl ?? images[0] ?? null;
            const carouselImages = cover ? [cover, ...images.filter((u) => u !== cover)] : images;

            const badgeList = [
              x.isSold ? "Satıldı" : null,
              typeLabel(typeKey),
              ...(x.badges ?? []),
            ].filter(Boolean) as string[];

            return (
              <article
                key={x.id}
                className={cn(
                  "group overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm",
                  "transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow"
                )}
              >
                {/* ✅ Swipe carousel + İlanı Gör */}
                <div className="relative">
                  <ListingCardCarousel
                    href={`/portfoy/${x.slug}`}
                    title={x.title}
                    isSold={!!x.isSold}
                    images={carouselImages}
                  />

                  {/* Glass bottom fade */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent" />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-neutral-600">
                        {x.category} · {typeLabel(typeKey)}
                      </p>

                      <Link
                        href={`/portfoy/${x.slug}`}
                        className={cn(
                          "mt-2 block text-lg font-medium tracking-tight",
                          "hover:underline"
                        )}
                      >
                        {x.title}
                      </Link>

                      <p className="mt-2 text-sm text-neutral-700">
                        {[x.city, x.district, x.neighborhood].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                      {x.priceText || "₺ —"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {badgeList.slice(0, 4).map((b) => (
                      <Badge key={b} text={b} />
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <Link
                      href={`/portfoy/${x.slug}`}
                      className={cn(
                        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm",
                        "border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-400"
                      )}
                    >
                      İlanı Gör
                    </Link>

                   <Link
  href={`/portfoy/${x.slug}`}
  className="text-sm text-neutral-500 hover:text-neutral-900"
>
  Detay →
</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-10 text-sm text-neutral-700 shadow-sm">
            Bu filtreye uygun portföy bulunamadı.
          </div>
        )}
      </section>

      {/* FOOTER MINI */}
      <footer className="border-t border-neutral-200/70 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-xs text-neutral-500">
          <div>©️ Furkan Azak Gayrimenkul</div>
          <div className="flex items-center gap-4">
            <Link href="/#iletisim" className="hover:text-neutral-900">
              İletişim
            </Link>
            <a
              href="https://wa.me/905364518194"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}