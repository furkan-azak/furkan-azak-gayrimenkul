"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      router.push("/admin");
    } catch (error: any) {
      setErr(error?.message ?? "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="text-sm uppercase tracking-[0.22em] text-neutral-600">
            Admin
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Giriş Yap
          </h1>

          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm text-neutral-700">E-posta</label>
              <input
                className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@..."
                type="email"
                required
              />
            </div>

            <div>
              <label className="text-sm text-neutral-700">Şifre</label>
              <input
                className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                type="password"
                required
              />
            </div>

            {err && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {err}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm text-neutral-50 hover:bg-neutral-800 disabled:opacity-60"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş"}
            </button>

            <div className="pt-2 text-xs text-neutral-500">
              Bu alan sadece yetkili kullanıcı içindir.
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}