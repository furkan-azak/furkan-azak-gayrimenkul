"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

import { auth, db, storage } from "@/lib/firebaseClient";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from "firebase/storage";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

type Category = "Villa" | "Daire" | "Arsa" | "Dükkan";
type ListingType = "sale" | "rent";
type LatLng = { lat: number; lng: number } | null;

type ListingRow = {
  id: string;
  title: string;
  slug: string;
  category: Category;
  listingType: ListingType;
  city?: string;
  isSold?: boolean;
};

function listingTypeLabel(t: ListingType) {
  return t === "sale" ? "Satılık" : "Kiralık";
}

function slugifyTR(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** ✅ file.type bazen boş geliyor (özellikle .jfif) → uzantıdan da image kabul et */
function isImageFile(file: File) {
  const name = (file.name || "").toLowerCase();
  const byExt =
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".jfif");

  const byType = (file.type || "").startsWith("image/");
  return byType || byExt;
}

/** ✅ Fotoğrafa tam ortadan watermark (şeffaf PNG) — JFIF dahil */
async function watermarkImageFile(file: File, watermarkUrl = "/watermark.png") {
  if (!isImageFile(file)) return file;

  const imgUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = imgUrl;
    });

    const mark = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = reject;
      // ✅ cache kır (bazı cihazlarda watermark eski/boş geliyor)
      im.src = `${watermarkUrl}?v=2`; // /public/watermark.png
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    canvas.width = w;
    canvas.height = h;

    // Fotoğraf
    ctx.drawImage(img, 0, 0, w, h);

    // Watermark boyutu: kısa kenarın %25’i
    const base = Math.min(w, h);
    const targetW = Math.round(base * 0.25);

    // oran koru
    const markW = mark.naturalWidth || mark.width || 1;
    const markH = mark.naturalHeight || mark.height || 1;
    const targetH = Math.round(targetW * (markH / markW));

    // tam ortala
    const x = Math.round((w - targetW) / 2);
    const y = Math.round((h - targetH) / 2);

    // watermark
    ctx.save();
    ctx.globalAlpha = 0.40; // 👈 opaklık burası (0.55 daha net olur)
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = Math.max(2, base * 0.01);
    ctx.shadowOffsetY = Math.max(1, base * 0.004);
    ctx.drawImage(mark, x, y, targetW, targetH);
    ctx.restore();

    // ✅ en stabil çıktı: JPEG (JFIF/JPG için süper uyumlu)
    const outBlob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.92);
    });

    // bazı tarayıcılarda toBlob null dönebilir → fallback
    const finalBlob =
      outBlob instanceof Blob && outBlob.size > 0
        ? outBlob
        : await (await fetch(canvas.toDataURL("image/jpeg", 0.92))).blob();

    const outName =
      file.name.replace(/\.(png|jpg|jpeg|webp|jfif)$/i, "") + ".jpg";

    return new File([finalBlob], outName, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

async function isAdmin(uid: string) {
  const adminRef = doc(db, "admins", uid);
  const snap = await getDoc(adminRef);
  return snap.exists();
}

async function fetchListings(): Promise<ListingRow[]> {
  const col = collection(db, "listings");

  try {
    const qRef = query(col, orderBy("updatedAt", "desc"), limit(100));
    const snap = await getDocs(qRef);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      const lt = (data.listingType as ListingType) ?? "sale";
      return {
        id: d.id,
        title: String(data.title ?? ""),
        slug: String(data.slug ?? d.id),
        category: (data.category as Category) ?? "Daire",
        listingType: lt,
        city: data.city ? String(data.city) : undefined,
        isSold: Boolean(data.isSold),
      };
    });
  } catch {
    const snap = await getDocs(query(col, limit(100)));
    return snap.docs.map((d) => {
      const data = d.data() as any;
      const lt = (data.listingType as ListingType) ?? "sale";
      return {
        id: d.id,
        title: String(data.title ?? ""),
        slug: String(data.slug ?? d.id),
        category: (data.category as Category) ?? "Daire",
        listingType: lt,
        city: data.city ? String(data.city) : undefined,
        isSold: Boolean(data.isSold),
      };
    });
  }
}

async function deleteStorageFolder(folderPath: string) {
  const folderRef = ref(storage, folderPath);
  const res = await listAll(folderRef);

  for (const prefix of res.prefixes) {
    await deleteStorageFolder(prefix.fullPath);
  }
  for (const item of res.items) {
    await deleteObject(item);
  }
}

function storagePathFromDownloadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf("/o/");
    if (idx === -1) return null;
    const encoded = u.pathname.slice(idx + 3);
    const path = decodeURIComponent(encoded);
    return path || null;
  } catch {
    return null;
  }
}

function readLocation(data: any): LatLng {
  const loc = data?.location;
  if (
    loc &&
    typeof loc === "object" &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number"
  ) {
    return { lat: loc.lat, lng: loc.lng };
  }
  return null;
}

export default function AdminPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [adminOk, setAdminOk] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<Category>("Villa");

  // Satılık / Kiralık
  const [listingType, setListingType] = useState<ListingType>("sale");

  const [city, setCity] = useState("İzmir");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [priceText, setPriceText] = useState("₺ —");
  const [areaM2, setAreaM2] = useState<string>("");
  const [rooms, setRooms] = useState("");
  const [badgesText, setBadgesText] = useState("");

  const [featuresText, setFeaturesText] = useState("");
  const [description, setDescription] = useState("");

  const [isSold, setIsSold] = useState(false);

  // konum
  const [location, setLocation] = useState<LatLng>(null);

  // medya + cover
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string>("");

  // yeni dosyalar
  const [images, setImages] = useState<FileList | null>(null);
  const [videos, setVideos] = useState<FileList | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [busyMediaUrl, setBusyMediaUrl] = useState<string | null>(null);

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refreshList() {
    setLoadingRows(true);
    try {
      setRows(await fetchListings());
    } catch (e: any) {
      setErr(e?.message ?? "Liste çekilemedi.");
    } finally {
      setLoadingRows(false);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setErr(null);
      setMsg(null);

      if (!u) {
        setAdminOk(false);
        setChecking(false);
        router.push("/admin/login");
        return;
      }

      try {
        const ok = await isAdmin(u.uid);
        setAdminOk(ok);
        if (!ok) setErr("Bu kullanıcı admin değil. Firestore admins kontrol et.");
        else await refreshList();
      } catch (e: any) {
        setErr(e?.message ?? "Admin kontrolü başarısız.");
        setAdminOk(false);
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!slug) setSlug(slugifyTR(title));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const badges = useMemo(() => {
    return badgesText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [badgesText]);

  async function uploadFiles(
    listingId: string,
    files: FileList | null,
    kind: "images" | "videos"
  ) {
    if (!files || files.length === 0) return [];

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];

      // ✅ sadece fotoğraflara watermark
      const processed = kind === "images" ? await watermarkImageFile(f) : f;

      // ✅ debug (istersen sonra sil)
      console.log(
        "UPLOAD:",
        f.name,
        f.type || "(type boş)",
        "=>",
        processed.name,
        processed.type,
        processed.size
      );

      const safeName = `${Date.now()}-${slugifyTR(processed.name) || "file"}`;
      const path = `listings/${listingId}/${kind}/${safeName}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, processed);

      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }
    return urls;
  }

  function resetForm() {
    setEditId(null);
    setTitle("");
    setSlug("");
    setCategory("Villa");
    setListingType("sale");

    setCity("İzmir");
    setDistrict("");
    setNeighborhood("");
    setPriceText("₺ —");
    setAreaM2("");
    setRooms("");
    setBadgesText("");
    setFeaturesText("");
    setDescription("");
    setIsSold(false);

    setLocation(null);

    setExistingImageUrls([]);
    setExistingVideoUrls([]);
    setCoverUrl("");
    setImages(null);
    setVideos(null);
    setErr(null);
    setMsg(null);
  }

  async function onEditClick(id: string) {
    setErr(null);
    setMsg(null);

    try {
      const snap = await getDoc(doc(db, "listings", id));
      if (!snap.exists()) return setErr("İlan bulunamadı.");

      const data = snap.data() as any;

      setEditId(id);
      setTitle(String(data.title ?? ""));
      setSlug(String(data.slug ?? id));
      setCategory((data.category as Category) ?? "Daire");
      setListingType(((data.listingType as ListingType) ?? "sale") as ListingType);

      setCity(String(data.city ?? "İzmir"));
      setDistrict(String(data.district ?? ""));
      setNeighborhood(String(data.neighborhood ?? ""));
      setPriceText(String(data.priceText ?? "₺ —"));
      setAreaM2(data.areaM2 === null || data.areaM2 === undefined ? "" : String(data.areaM2));
      setRooms(String(data.rooms ?? ""));
      setBadgesText(Array.isArray(data.badges) ? data.badges.join(", ") : "");
      setDescription(String(data.description ?? ""));
      setIsSold(Boolean(data.isSold));

      if (Array.isArray(data.features)) {
        const lines = data.features
          .map((f: any) => `${String(f?.label ?? "").trim()}: ${String(f?.value ?? "").trim()}`)
          .filter((x: string) => x.includes(":"));
        setFeaturesText(lines.join("\n"));
      } else if (typeof data.features === "string") {
        const lines = String(data.features)
          .split("|")
          .map((x) => x.trim())
          .filter(Boolean)
          .map((p) => p.replace(/\s*:\s*/, ": "));
        setFeaturesText(lines.join("\n"));
      } else {
        setFeaturesText("");
      }

      setLocation(readLocation(data));

      const imgs =
        (Array.isArray(data.imageUrls) ? data.imageUrls : null) ??
        (Array.isArray(data.images) ? data.images : []);
      const vids =
        (Array.isArray(data.videoUrls) ? data.videoUrls : null) ??
        (Array.isArray(data.videos) ? data.videos : []);

      setExistingImageUrls(imgs);
      setExistingVideoUrls(vids);

      const c = String(data.coverUrl ?? "");
      setCoverUrl(c || imgs?.[0] || "");

      setImages(null);
      setVideos(null);

      setMsg("✏️ Düzenleme modu: Kaydet = günceller.");
    } catch (e: any) {
      setErr(e?.message ?? "Düzenleme verisi çekilemedi.");
    }
  }

  async function onDeleteClick(id: string) {
    if (!adminOk) return;

    const yes = window.confirm(
      `Bu ilanı silmek istiyor musun?\n\nFirestore: listings/${id}\nStorage: listings/${id}/...\n\nGeri alamazsın.`
    );
    if (!yes) return;

    setDeletingId(id);
    setErr(null);
    setMsg(null);

    try {
      await deleteStorageFolder(`listings/${id}`);
      await deleteDoc(doc(db, "listings", id));

      setMsg("🗑️ Silindi.");
      if (editId === id) resetForm();
      await refreshList();
    } catch (e: any) {
      setErr(e?.message ?? "Silme hatası.");
    } finally {
      setDeletingId(null);
    }
  }

  async function deleteOneImage(url: string) {
    if (!editId) return;

    const yes = window.confirm("Bu fotoğrafı silmek istiyor musun? (Storage'dan da silinir)");
    if (!yes) return;

    setBusyMediaUrl(url);
    setErr(null);
    setMsg(null);

    try {
      const path = storagePathFromDownloadUrl(url);
      if (!path) throw new Error("Storage path bulunamadı (downloadURL parse edilemedi).");

      await deleteObject(ref(storage, path));

      const nextImages = existingImageUrls.filter((x) => x !== url);

      let nextCover = coverUrl;
      if (coverUrl === url) nextCover = nextImages[0] ?? "";

      setExistingImageUrls(nextImages);
      setCoverUrl(nextCover);

      await setDoc(
        doc(db, "listings", editId),
        {
          imageUrls: nextImages,
          coverUrl: nextCover || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("✅ Foto silindi.");
      await refreshList();
    } catch (e: any) {
      setErr(e?.message ?? "Foto silme hatası.");
    } finally {
      setBusyMediaUrl(null);
    }
  }

  // ✅ YENİ: Video silme
  async function deleteOneVideo(url: string) {
    if (!editId) return;

    const yes = window.confirm("Bu videoyu silmek istiyor musun? (Storage'dan da silinir)");
    if (!yes) return;

    setBusyMediaUrl(url);
    setErr(null);
    setMsg(null);

    try {
      const path = storagePathFromDownloadUrl(url);
      if (!path) throw new Error("Storage path bulunamadı (downloadURL parse edilemedi).");

      await deleteObject(ref(storage, path));

      const nextVideos = existingVideoUrls.filter((x) => x !== url);
      setExistingVideoUrls(nextVideos);

      // ✅ eski dokümanlarda "videos" alanı da olabiliyor → ikisini de güncelle
      await setDoc(
        doc(db, "listings", editId),
        {
          videoUrls: nextVideos,
          videos: nextVideos,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg("✅ Video silindi.");
      await refreshList();
    } catch (e: any) {
      setErr(e?.message ?? "Video silme hatası.");
    } finally {
      setBusyMediaUrl(null);
    }
  }

  async function makeCover(url: string) {
    if (!editId) return;

    setBusyMediaUrl(url);
    setErr(null);
    setMsg(null);

    try {
      setCoverUrl(url);
      await setDoc(
        doc(db, "listings", editId),
        {
          coverUrl: url,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setMsg("⭐ Kapak foto güncellendi.");
      await refreshList();
    } catch (e: any) {
      setErr(e?.message ?? "Kapak güncelleme hatası.");
    } finally {
      setBusyMediaUrl(null);
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!user) return setErr("Giriş yok.");
    if (!adminOk) return setErr("Admin yetkisi yok.");

    const finalSlug = (slug || slugifyTR(title)).trim();
    if (!finalSlug) return setErr("Slug boş olamaz.");

    if (editId && finalSlug !== editId) {
      return setErr("Düzenlemede slug değiştirme kapalı.");
    }

    setSaving(true);
    try {
      const listingId = editId ?? finalSlug;

      const newImageUrls = await uploadFiles(listingId, images, "images");
      const newVideoUrls = await uploadFiles(listingId, videos, "videos");

      const imageUrls = [...existingImageUrls, ...newImageUrls];
      const videoUrls = [...existingVideoUrls, ...newVideoUrls];

      const finalCover = coverUrl || imageUrls[0] || "";

      const parsedFeatures = featuresText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const idx = line.indexOf(":");
          if (idx === -1) return null;
          const label = line.slice(0, idx).trim();
          const value = line.slice(idx + 1).trim();
          if (!label || !value) return null;
          return { label, value };
        })
        .filter(Boolean);

      const baseData: any = {
        slug: listingId,
        title: title.trim(),
        category,
        listingType,

        city: city.trim(),
        district: district.trim() || null,
        neighborhood: neighborhood.trim() || null,
        priceText: priceText.trim() || "₺ —",
        areaM2: areaM2 ? Number(areaM2) : null,
        rooms: rooms.trim() || null,

        badges,
        features: parsedFeatures,
        description: description.trim() || "",

        imageUrls,
        videoUrls,
        coverUrl: finalCover || null,
        isSold,

        location: location ? { lat: location.lat, lng: location.lng } : null,
        updatedAt: serverTimestamp(),
      };

      if (!editId) baseData.createdAt = serverTimestamp();

      await setDoc(doc(db, "listings", listingId), baseData, { merge: true });

      setExistingImageUrls(imageUrls);
      setExistingVideoUrls(videoUrls);
      setCoverUrl(finalCover);

      setMsg(editId ? "✅ Güncellendi!" : "✅ Kaydedildi!");
      setImages(null);
      setVideos(null);

      await refreshList();
    } catch (e: any) {
      setErr(e?.message ?? "Kaydetme hatası.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-neutral-50 text-neutral-900">
        <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-neutral-600">
          Kontrol ediliyor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-neutral-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="tracking-tight">
            <div className="text-sm uppercase tracking-[0.22em] text-neutral-600">Furkan Azak</div>
            <div className="text-lg font-medium">Admin Panel</div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/portfoy"
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm hover:border-neutral-400"
            >
              Siteyi Gör
            </Link>

            <button
              onClick={async () => {
                await signOut(auth);
                router.push("/admin/login");
              }}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-50 hover:bg-neutral-800"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {!adminOk && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Admin yetkisi yok. Firestore → <b>admins</b> collection içinde UID dokümanı olmalı.
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-12">
          {/* FORM */}
          <section className="md:col-span-7">
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {editId ? "İlan Düzenle" : "İlan Ekle"}
                  </h1>
                  <p className="mt-2 text-sm text-neutral-600">
                    Foto/video yükle → URL üretir → Firestore’a kaydeder. (Fotoğraflara otomatik logo basılır)
                  </p>
                </div>

                {editId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm hover:border-neutral-400"
                  >
                    Yeni ilan
                  </button>
                )}
              </div>

              <form onSubmit={onSave} className="mt-8 space-y-4">
                <div>
                  <label className="text-sm text-neutral-700">Başlık</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-neutral-700">Slug</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
                      value={slug}
                      onChange={(e) => setSlug(slugifyTR(e.target.value))}
                      disabled={!!editId}
                    />
                    <div className="mt-1 text-xs text-neutral-500">
                      URL: /portfoy/{slug || "ilan-slug"}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-neutral-700">Kategori</label>
                    <select
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                    >
                      <option value="Villa">Villa</option>
                      <option value="Daire">Daire</option>
                      <option value="Arsa">Arsa</option>
                      <option value="Dükkan">Dükkan</option>
                    </select>
                  </div>
                </div>

                {/* SATILIK / KİRALIK */}
                <div>
                  <label className="text-sm text-neutral-700">İlan Tipi</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value as ListingType)}
                  >
                    <option value="sale">Satılık</option>
                    <option value="rent">Kiralık</option>
                  </select>
                  <div className="mt-1 text-xs text-neutral-500">
                    Portföyde filtre buradan çalışacak.
                  </div>
                </div>

                {/* SATILDI */}
                <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <input
                    id="sold"
                    type="checkbox"
                    checked={isSold}
                    onChange={(e) => setIsSold(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="sold" className="text-sm text-neutral-800">
                    Satıldı olarak işaretle
                  </label>
                </div>

                {/* KONUM */}
                <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Konum</div>
                      <div className="mt-1 text-xs text-neutral-600">
                        Haritaya tıkla → pin koy.
                      </div>
                    </div>

                    {location && (
                      <div className="text-xs font-mono text-neutral-600">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <MapPicker
                      value={location}
                      onChange={setLocation}
                      defaultCenter={{ lat: 38.4237, lng: 27.1428 }}
                      zoom={12}
                    />
                  </div>
                </div>

                {/* Mevcut Fotoğraflar */}
                {editId && (
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Mevcut Fotoğraflar</div>
                        <div className="mt-1 text-xs text-neutral-600">
                          Kapak seçebilir, tek tek silebilirsin.
                        </div>
                      </div>
                      <div className="text-xs text-neutral-600">
                        {existingImageUrls.length} foto
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {existingImageUrls.map((u) => {
                        const isCover = coverUrl === u;
                        const busy = busyMediaUrl === u;

                        return (
                          <div
                            key={u}
                            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                          >
                            <div className="relative aspect-[4/3] bg-neutral-100">
                              <img
                                src={u}
                                alt="foto"
                                className="h-full w-full object-cover"
                              />

                              {isCover && (
                                <div className="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                                  Kapak
                                </div>
                              )}

                              {isSold && (
                                <div className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs text-white">
                                  Satıldı
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 p-3">
                              <button
                                type="button"
                                onClick={() => makeCover(u)}
                                disabled={busy}
                                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs hover:border-neutral-400 disabled:opacity-60"
                              >
                                Kapak Yap
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteOneImage(u)}
                                disabled={busy}
                                className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs text-red-700 hover:border-red-300 disabled:opacity-60"
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {existingImageUrls.length === 0 && (
                        <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 sm:col-span-3">
                          Henüz foto yok.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ Mevcut Videolar */}
                {editId && (
                  <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Mevcut Videolar</div>
                        <div className="mt-1 text-xs text-neutral-600">
                          Videoları tek tek silebilirsin.
                        </div>
                      </div>
                      <div className="text-xs text-neutral-600">
                        {existingVideoUrls.length} video
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {existingVideoUrls.map((v) => {
                        const busy = busyMediaUrl === v;

                        return (
                          <div
                            key={v}
                            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                          >
                            <div className="relative aspect-video bg-neutral-100">
                              <video
                                src={v}
                                controls
                                playsInline
                                className="h-full w-full object-cover"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2 p-3">
                              <button
                                type="button"
                                onClick={() => deleteOneVideo(v)}
                                disabled={busy}
                                className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs text-red-700 hover:border-red-300 disabled:opacity-60"
                              >
                                Sil
                              </button>

                              <a
                                href={v}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs hover:border-neutral-400"
                              >
                                Aç
                              </a>
                            </div>
                          </div>
                        );
                      })}

                      {existingVideoUrls.length === 0 && (
                        <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 sm:col-span-2">
                          Henüz video yok.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Diğer alanlar */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-neutral-700">İl</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-700">İlçe</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-700">Mahalle</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm text-neutral-700">Fiyat</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                      value={priceText}
                      onChange={(e) => setPriceText(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-neutral-700">m²</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                      value={areaM2}
                      onChange={(e) => setAreaM2(e.target.value)}
                      inputMode="numeric"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-neutral-700">Oda</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                      value={rooms}
                      onChange={(e) => setRooms(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-neutral-700">Badge’ler</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                    value={badgesText}
                    onChange={(e) => setBadgesText(e.target.value)}
                    placeholder="Premium, Havuz, Bahçe..."
                  />
                </div>

                <div>
                  <label className="text-sm text-neutral-700">İlan Bilgileri / Özellikler</label>
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    rows={10}
                  />
                </div>

                <div>
                  <label className="text-sm text-neutral-700">Açıklama</label>
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-400"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-neutral-700">Yeni Fotoğraflar</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setImages(e.target.files)}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-neutral-700">Yeni Videolar</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm"
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => setVideos(e.target.files)}
                    />
                  </div>
                </div>

                {err && (
                  <div className="whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {err}
                  </div>
                )}

                {msg && (
                  <div className="whitespace-pre-line rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    {msg}
                  </div>
                )}

                <button
                  disabled={saving || !adminOk}
                  className="rounded-full bg-neutral-900 px-6 py-3 text-sm text-neutral-50 hover:bg-neutral-800 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Kaydet"}
                </button>
              </form>
            </div>
          </section>

          {/* LİSTE */}
          <aside className="md:col-span-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                    Mevcut İlanlar
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">{rows.length} ilan</div>
                </div>

                <button
                  type="button"
                  onClick={refreshList}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm hover:border-neutral-400 disabled:opacity-60"
                  disabled={loadingRows}
                >
                  {loadingRows ? "Yenileniyor..." : "Yenile"}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-neutral-600">
                          {r.category} · {listingTypeLabel(r.listingType)}
                        </div>
                        <div className="mt-1 text-sm font-medium">{r.title}</div>
                        <div className="mt-1 text-xs text-neutral-600">
                          slug: <span className="font-mono">{r.slug}</span>
                        </div>
                      </div>

                      {r.isSold && (
                        <div className="rounded-full bg-red-600 px-3 py-1 text-xs text-white">
                          Satıldı
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEditClick(r.id)}
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm hover:border-neutral-400"
                      >
                        Düzenle
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteClick(r.id)}
                        disabled={deletingId === r.id}
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-700 hover:border-red-300 disabled:opacity-60"
                      >
                        {deletingId === r.id ? "Siliniyor..." : "Sil"}
                      </button>

                      <Link
                        href={`/portfoy/${r.slug}`}
                        className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm hover:border-neutral-400"
                        target="_blank"
                      >
                        Gör
                      </Link>
                    </div>
                  </div>
                ))}

                {rows.length === 0 && (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    Henüz ilan yok.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}