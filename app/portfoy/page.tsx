import Link from "next/link";
import Image from "next/image";
import { getListings, type Category } from "@/lib/listings";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

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

const CATS: Array<Category | "Tümü"> = ["Tümü", "Villa", "Daire", "Arsa"];
const TYPES: Array<"Tümü" | "sale" | "rent"> = ["Tümü", "sale", "rent"];

function typeLabel(t: "sale" | "rent") {
  return t === "sale" ? "Satılık" : "Kiralık";
}

function normalizeTypeKey(v: unknown): "sale" | "rent" {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "rent" || s === "kiralık" || s === "kiralik") return "rent";
  return "sale";
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: { cat?: string; q?: string; t?: string };
}) {
  const all = await getListings();

  const cat = (searchParams?.cat ?? "Tümü") as string;
  const q = (searchParams?.q ?? "").trim().toLowerCase();

  const tRaw = (searchParams?.t ?? "Tümü") as string;
  const t = (TYPES.includes(tRaw as any) ? tRaw : "Tümü") as "Tümü" | "sale" | "rent";

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

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
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

      <section className="mx-auto max-w-6xl px-6 pt-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
              Satılık · Kiralık · Arsa · Villa · Daire
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Portföyler</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
              Seçili ilanlar; net bilgi, sade sunum, hızlı iletişim.
            </p>
          </div>

          <div className="text-sm text-neutral-600">
            <span className="text-neutral-900">{filtered.length}</span> sonuç
          </div>
        </div>

        <form className="mt-8" action="/portfoy">
          <input
            name="q"
            defaultValue={searchParams?.q ?? ""}
            placeholder="Ara: Çeşme, villa, arsa..."
            className="w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
          {cat !== "Tümü" && <input type="hidden" name="cat" value={cat} />}
          {t !== "Tümü" && <input type="hidden" name="t" value={t} />}
        </form>

        {/* ✅ Filtreler: tıklanabilirlik için z-10 */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center gap-2">
          {TYPES.map((tt) => {
            const active = (t === tt) || (tt === "Tümü" && t === "Tümü");
            const label = tt === "Tümü" ? "Hepsi" : typeLabel(tt);

            const href =
              tt === "Tümü"
                ? `/portfoy${cat !== "Tümü" ? `?cat=${encodeURIComponent(cat)}` : ""}${
                    q ? `${cat !== "Tümü" ? "&" : "?"}q=${encodeURIComponent(q)}` : ""
                  }`
                : `/portfoy?${cat !== "Tümü" ? `cat=${encodeURIComponent(cat)}&` : ""}t=${encodeURIComponent(tt)}${
                    q ? `&q=${encodeURIComponent(q)}` : ""
                  }`;

            return (
              <Link
                key={tt}
                href={href}
                prefetch={false}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm",
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

        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
          {CATS.map((c) => {
            const active = (cat === c) || (c === "Tümü" && cat === "Tümü");

            const href =
              c === "Tümü"
                ? `/portfoy${t !== "Tümü" ? `?t=${encodeURIComponent(t)}` : ""}${
                    q ? `${t !== "Tümü" ? "&" : "?"}q=${encodeURIComponent(q)}` : ""
                  }`
                : `/portfoy?cat=${encodeURIComponent(c)}${
                    t !== "Tümü" ? `&t=${encodeURIComponent(t)}` : ""
                  }${q ? `&q=${encodeURIComponent(q)}` : ""}`;

            return (
              <Link
                key={c}
                href={href}
                prefetch={false}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm",
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
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <div className="grid gap-6 md:grid-cols-3">
          {filtered.map((x: any) => {
            const cover = x.coverUrl ?? x.images?.[0];
            const typeKey = normalizeTypeKey(x.listingType);

            const badgeList = [
              x.isSold ? "Satıldı" : null,
              typeLabel(typeKey),
              ...(x.badges ?? []),
            ].filter(Boolean) as string[];

            return (
              <Link
                key={x.id}
                href={`/portfoy/${x.slug}`}
                className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                  {x.isSold && (
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
                      Satıldı
                    </div>
                  )}

                  {cover ? (
                    <Image
                      src={cover}
                      alt={x.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-neutral-100" />
                  )}
                </div>

                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                    {x.category} · {typeLabel(typeKey)}
                  </p>

                  <h3 className="mt-2 text-lg font-medium tracking-tight">{x.title}</h3>

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
                    <span className="text-sm text-neutral-500 group-hover:text-neutral-900">Detay →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 rounded-3xl border border-neutral-200 bg-white p-10 text-sm text-neutral-700">
            Bu filtreye uygun portföy bulunamadı.
          </div>
        )}
      </section>
    </main>
  );
}