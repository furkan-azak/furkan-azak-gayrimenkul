import Link from "next/link";
import Image from "next/image";
import { getListings, type Category } from "@/lib/listings";
import HomeSearchForm from "@/components/HomeSearchForm";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const NO_SCROLLBAR =
  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function Badge({ text }: { text: string }) {
  const sold = text.toLowerCase() === "satıldı";
  const rent = text.toLowerCase() === "kiralık" || text.toLowerCase() === "kiralik";
  const sale = text.toLowerCase() === "satılık" || text.toLowerCase() === "satilik";

  return (
    <span
      className={
        sold
          ? "rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700"
          : rent
          ? "rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700"
          : sale
          ? "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700"
          : "rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
      }
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

function getListingImages(x: any): string[] {
  const arr =
    (Array.isArray(x.images) ? x.images : null) ??
    (Array.isArray(x.imageUrls) ? x.imageUrls : null) ??
    [];
  return (arr as any[]).filter(Boolean).map(String);
}

export default async function Home({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const getOne = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const catRaw = (getOne(sp.cat) ?? "Tümü").trim();
  const cat = (CATS.includes(catRaw as any) ? catRaw : "Tümü") as Category | "Tümü";

  const tRaw = (getOne(sp.t) ?? "Tümü").trim();
  const t = (TYPES.includes(tRaw as any) ? tRaw : "Tümü") as "Tümü" | "sale" | "rent";

  const qInput = (getOne(sp.q) ?? "").trim();
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

  const top9 = filtered.slice(0, 9);
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-neutral-50/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="tracking-tight">
            <div className="text-sm uppercase tracking-[0.22em] text-neutral-600">Furkan Azak</div>
            <div className="text-lg font-medium">Gayrimenkul</div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-neutral-700 md:flex">
            <Link className="hover:text-neutral-950" href="/portfoy">
              Portföyler
            </Link>
            <a className="hover:text-neutral-950" href="#hakkimda">
              Hakkımda
            </a>
            <a className="hover:text-neutral-950" href="#iletisim">
              İletişim
            </a>
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

      {/* EN ÜST: Arama + filtre barı */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-medium">Hızlı Ara / Filtrele</div>
                <div className="mt-1 text-xs text-neutral-600">
                  Satılık-kiralık + kategori seç, arama yap.
                </div>
              </div>

              <div className="text-sm text-neutral-600">
                <span className="text-neutral-900">{filtered.length}</span> sonuç
              </div>
            </div>

            <HomeSearchForm initialQ={qInput} />

            {/* Type filtre */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {TYPES.map((tt) => {
                const active = t === tt;
                const label = tt === "Tümü" ? "Hepsi" : typeLabel(tt);

                const href =
                  tt === "Tümü"
                    ? `/${cat !== "Tümü" ? `?cat=${encodeURIComponent(cat)}` : ""}${
                        qInput ? `${cat !== "Tümü" ? "&" : "?"}q=${encodeURIComponent(qInput)}` : ""
                      }`
                    : `/?${cat !== "Tümü" ? `cat=${encodeURIComponent(cat)}&` : ""}t=${encodeURIComponent(
                        tt
                      )}${qInput ? `&q=${encodeURIComponent(qInput)}` : ""}`;

                return (
                  <Link
                    key={tt}
                    href={href}
                    scroll={false}
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

            {/* Category filtre */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {CATS.map((c) => {
                const active = cat === c;

                const href =
                  c === "Tümü"
                    ? `/${t !== "Tümü" ? `?t=${encodeURIComponent(t)}` : ""}${
                        qInput ? `${t !== "Tümü" ? "&" : "?"}q=${encodeURIComponent(qInput)}` : ""
                      }`
                    : `/?cat=${encodeURIComponent(c)}${
                        t !== "Tümü" ? `&t=${encodeURIComponent(t)}` : ""
                      }${qInput ? `&q=${encodeURIComponent(qInput)}` : ""}`;

                return (
                  <Link
                    key={c}
                    href={href}
                    scroll={false}
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
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <div className="grid gap-10 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
              Satılık · Kiralık · Arsa · Villa · Daire · Dükkan
            </p>

            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              Seçili portföyler,
              <span className="text-neutral-500"> premium sunum.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-700">
              Filtrele, ara, görselleri kaydır. “İlanı Gör →” ile direkt detaya geç.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-700">
                {filtered.length} sonuç
              </span>
              <span className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-700">
                Hızlı WhatsApp iletişim
              </span>
              <span className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-700">
                Kaydırmalı galeri
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/portfoy"
                className="rounded-full bg-neutral-900 px-6 py-3 text-sm text-neutral-50 hover:bg-neutral-800"
              >
                Tüm Portföyler
              </Link>
              <a
                href="tel:+905364518194"
                className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm text-neutral-900 hover:border-neutral-400"
              >
                Hemen Ara
              </a>
            </div>
          </div>
        </div>

        {/* Kaydırmalı Kart: Furkan + Belge */}
        <div className="mt-10 flex justify-center md:justify-end">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] w-full bg-neutral-100">
              <div
                className={cn(
                  "absolute inset-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth",
                  NO_SCROLLBAR
                )}
              >
                <div className="relative h-full w-full flex-shrink-0 snap-center">
                  <Image
                    src="/furkan.jpg"
                    alt="Furkan Azak"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 420px"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                </div>

                <div className="relative h-full w-full flex-shrink-0 snap-center bg-white">
                  <Image
                    src="/belge.jpg"
                    alt="Mesleki Yeterlilik Belgesi"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 420px"
                  />
                </div>
              </div>

              {/* Kaydır (tiny) */}
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/25 bg-black/45 px-2 py-0.5 text-[10px] text-white backdrop-blur">
                Kaydır
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">Furkan Azak</div>
              <div className="mt-1 text-sm text-neutral-700">“Az ama iyi. Seçili portföy sunumu.”</div>
              <div className="mt-2 text-xs text-neutral-500">Mesleki Yeterlilik Belgesi görseli mevcut.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Liste: 9 ilan */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Portföyler</h2>
            <p className="mt-2 text-sm text-neutral-600">
              İlk ekranda 9 ilan gösterilir. Daha fazlası için “Tüm Portföyler”.
            </p>
          </div>

          <Link
            href="/portfoy"
            className="hidden rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-900 shadow-sm hover:border-neutral-400 md:inline-flex"
          >
            Tüm Portföyler →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {top9.map((x: any) => {
            const typeKey = normalizeTypeKey(x.listingType);
            const images = getListingImages(x);
            const cover = (x.coverUrl ?? images?.[0] ?? null) as string | null;
            const slides = [cover, ...images.filter((u) => u !== cover)].filter(Boolean) as string[];

            const badgeList = [
              x.isSold ? "Satıldı" : null,
              typeLabel(typeKey),
              ...(x.badges ?? []),
            ].filter(Boolean) as string[];

            const href = `/portfoy/${x.slug}`;

            return (
              <div
                key={x.id}
                className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
              >
                {/* Apple-like glow + blur + micro zoom */}
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                  <div className="pointer-events-none absolute inset-0 z-10 ring-1 ring-neutral-200/70 transition duration-300 group-hover:ring-neutral-300/80" />
                  <div className="pointer-events-none absolute -inset-10 z-10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
                    <div className="h-full w-full bg-gradient-to-r from-neutral-200/35 via-white/10 to-neutral-200/35" />
                  </div>

                  {x.isSold && (
                    <div className="absolute left-3 top-3 z-20 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
                      Satıldı
                    </div>
                  )}

                  <Link
                    href={href}
                    className="absolute right-3 top-3 z-20 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 hover:bg-white"
                  >
                    İlanı Gör →
                  </Link>

                  {slides.length > 0 ? (
                    <>
                      {/* ✅ scrollbar tamamen gizli + overflow-y kapalı */}
                      <div
                        className={cn(
                          "absolute inset-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth",
                          NO_SCROLLBAR
                        )}
                      >
                        {slides.slice(0, 10).map((u, i) => (
                          <div key={`${u}-${i}`} className="relative h-full w-full flex-shrink-0 snap-center">
                            <Image
                              src={u}
                              alt={x.title}
                              fill
                              className="object-cover transition duration-500 group-hover:scale-[1.02]"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
                              <div className="h-full w-full bg-gradient-to-br from-white/10 via-transparent to-black/10" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Kaydır (tiny) */}
                      {slides.length > 1 && (
                        <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-white/25 bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur">
                          Kaydır
                        </div>
                      )}

                      {slides.length > 1 && (
                        <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full border border-white/20 bg-black/30 px-3 py-2 backdrop-blur">
                          {slides.slice(0, 6).map((_, i) => (
                            <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/70" />
                          ))}
                          {slides.length > 6 && (
                            <span className="ml-1 text-[10px] text-white/80">+{slides.length - 6}</span>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full w-full bg-neutral-100" />
                  )}
                </div>

                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                    {x.category} · {typeLabel(typeKey)}
                  </p>

                  <h3 className="mt-2 text-lg font-medium tracking-tight">
                    <Link href={href} className="hover:underline">
                      {x.title}
                    </Link>
                  </h3>

                  <p className="mt-2 text-sm text-neutral-700">
                    {[x.city, x.district, x.neighborhood].filter(Boolean).join(" · ")}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {badgeList.slice(0, 3).map((b) => (
                      <Badge key={b} text={b} />
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-sm text-neutral-900">{x.priceText}</span>
                    <Link href={href} className="text-sm text-neutral-500 hover:text-neutral-900">
                      Detay →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {top9.length === 0 && (
          <div className="mt-12 rounded-3xl border border-neutral-200 bg-white p-10 text-sm text-neutral-700">
            Bu filtreye uygun portföy bulunamadı.
          </div>
        )}

        <div className="mt-8 md:hidden">
          <Link
            href="/portfoy"
            className="inline-flex rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm text-neutral-900 shadow-sm hover:border-neutral-400"
          >
            Tüm Portföyler →
          </Link>
        </div>
      </section>

      {/* Hakkımda */}
      <section id="hakkimda" className="mx-auto max-w-6xl px-6 pt-10">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 md:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">Hakkımda</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-700">
            Furkan Azak Gayrimenkul olarak amacım; portföyleri doğru fiyat, doğru sunum ve hızlı
            iletişimle yönetmek. Süreci şeffaf yürütür, alıcı ve satıcı tarafında güveni
            önceliklendiririm.
          </p>
        </div>
      </section>

      {/* İletişim */}
      <footer id="iletisim" className="mx-auto mt-20 max-w-6xl border-t border-neutral-200 px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="text-sm uppercase tracking-[0.22em] text-neutral-600">İletişim</div>
            <div className="mt-2 text-lg font-medium">+90 536 451 81 94</div>
            <div className="mt-1 text-sm text-neutral-600">WhatsApp / Telefon</div>
          </div>

          <div className="flex gap-3">
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
              Ara
            </a>
          </div>
        </div>

        <div className="mt-10 text-xs text-neutral-500">
          ©️ <span suppressHydrationWarning>{year}</span> Furkan Azak Gayrimenkul
        </div>
      </footer>
    </main>
  );
}