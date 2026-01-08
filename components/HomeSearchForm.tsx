"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomeSearchForm({
  initialQ,
}: {
  initialQ: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);

  const currentParams = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const params = new URLSearchParams(currentParams);

    const v = q.trim();
    if (v) params.set("q", v);
    else params.delete("q");

    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  }

  return (
    <form className="mt-4" onSubmit={onSubmit}>
      <input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ara: Çeşme, villa, arsa..."
        autoComplete="off"
        className="w-full rounded-2xl border border-neutral-300 bg-white px-5 py-4 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
      />
    </form>
  );
}