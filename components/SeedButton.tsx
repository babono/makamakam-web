"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * One button, because the alternative is typing a whole survey into a dashboard.
 */
export function SeedButton({ backing }: { backing: string }) {
  const [state, setState] = useState<"idle" | "working" | string>("idle");
  const router = useRouter();

  async function seed(skipExisting: boolean) {
    setState("working");
    const response = await fetch(`/api/admin/seed?skipExisting=${skipExisting ? 1 : 0}`, {
      method: "POST",
    });
    if (!response.ok) {
      setState(`Gagal: ${response.status} ${await response.text()}`);
      return;
    }
    const result = (await response.json()) as { written: number; skipped: number };
    setState(`${result.written} catatan ditulis, ${result.skipped} dilewati.`);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => seed(true)}
          disabled={state === "working"}
          className="rounded bg-grass px-4 py-2 text-sm text-plaque disabled:opacity-60"
        >
          Isi dari survei — lewati yang sudah ada
        </button>
        <button
          type="button"
          onClick={() => seed(false)}
          disabled={state === "working"}
          className="rounded border border-engraved px-4 py-2 text-sm text-engraved disabled:opacity-60"
        >
          Timpa semuanya
        </button>
      </div>
      <p className="text-xs text-ink-soft">
        Menulis ke: <strong>{backing}</strong>.{" "}
        {state !== "idle" && state !== "working" && <span>{state}</span>}
        {state === "working" && <span>Sedang menulis…</span>}
      </p>
    </div>
  );
}
