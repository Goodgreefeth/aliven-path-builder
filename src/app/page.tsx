"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const PathBuilder = dynamic(() => import("@/components/PathBuilder"), {
  ssr: false,
});

export default function Home() {
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const hasDraft = url.searchParams.has("draftPathId");
    if (hasDraft) setEditMode(true);
  }, []);

  async function exportPdf() {
    const res = await fetch("/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // placeholder for now
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      alert(`PDF export failed (${res.status}). ${msg}`);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "aliven-rhythm-preview.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#efe9e1] px-4 py-8">
      <div id="path-export" className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-800">
              Aliven Method
            </div>

            <h1 className="mt-1 text-3xl font-semibold text-neutral-950">
              Personalized Path Builder
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-neutral-900">
              Build a weekly path that feels steady, supportive, and realistic.
              Drag, drop, and shape your practice.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportPdf}
              className="hidden sm:block rounded-2xl border border-neutral-300 bg-white/90 px-4 py-3 text-right shadow-sm hover:bg-white"
            >
              <div className="text-xs text-neutral-800">Export</div>
              <div className="text-sm font-semibold text-neutral-950">PDF</div>
            </button>

            <Link
              href="/drafts"
              className="rounded-xl border border-neutral-300 bg-white/90 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-white"
            >
              Saved drafts
            </Link>

            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                editMode ? "bg-neutral-900 text-white" : "bg-[#a4756f] text-white"
              }`}
            >
              {editMode ? "Exit Edit Mode" : "Edit Mode"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-300 bg-white/85 p-4 shadow-sm backdrop-blur sm:p-6">
          <PathBuilder editMode={editMode} />
        </div>

        <div className="mt-6 text-xs text-neutral-800">
          Tip: keep it simple. Consistency beats intensity.
        </div>
      </div>
    </main>
  );
}
