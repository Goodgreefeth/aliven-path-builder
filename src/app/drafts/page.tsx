"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const DRAFTS_KEY = "aliven:pathbuilder:drafts:v1";

type SavedDraft = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  packId: string;
  pathId: string;
  draftPrompts: Record<number, string>;
  draftPractices: Record<number, string>;
};

function readDrafts(): SavedDraft[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedDraft[]) : [];
  } catch {
    return [];
  }
}

function writeDrafts(drafts: SavedDraft[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    // ignore (storage full / blocked / private mode)
  }
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  useEffect(() => {
    setDrafts(readDrafts());
  }, []);

  const sorted = useMemo(() => {
    return [...drafts].sort((a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || "")
    );
  }, [drafts]);

  function deleteDraft(id: string) {
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    writeDrafts(next);
  }

  function clearAll() {
    setDrafts([]);
    writeDrafts([]);
  }

  return (
    <main className="min-h-screen bg-[#efe9e1] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-neutral-800">
              Aliven Method
            </div>
            <h1 className="mt-1 text-3xl font-semibold text-neutral-950">
              Saved Drafts
            </h1>
            <p className="mt-2 text-sm text-neutral-900">
              These drafts are saved in this browser only (localStorage).
            </p>

            <div className="mt-3">
              <Link
                href="/"
                className="text-sm font-semibold text-neutral-900 underline decoration-neutral-400 underline-offset-4 hover:text-neutral-950"
              >
                ← Back to builder
              </Link>
            </div>
          </div>

          {sorted.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-neutral-300 bg-white/90 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-white"
            >
              Delete all
            </button>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-neutral-300 bg-white/85 p-6 shadow-sm">
            <p className="text-sm text-neutral-800">No saved drafts yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl border border-neutral-300 bg-white/85 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-neutral-950">
                      {d.name}
                    </div>
                    <div className="mt-1 text-xs text-neutral-800">
                      Path: <span className="font-medium">{d.pathId}</span> ·{" "}
                      Updated:{" "}
                      <span className="font-medium">
                        {new Date(d.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteDraft(d.id)}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
                  >
                    Delete
                  </button>
                </div>
<div className="mt-3 flex gap-2">
  <Link
    href={`/?draftPathId=${d.pathId}&draftPrompts=${encodeURIComponent(
      JSON.stringify(d.draftPrompts)
    )}&draftPractices=${encodeURIComponent(
      JSON.stringify(d.draftPractices)
    )}`}
    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
  >
    Load draft
  </Link>
</div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-semibold text-neutral-800">
                    View JSON
                  </summary>
                  <pre className="mt-3 overflow-auto rounded-lg border border-neutral-300 bg-white p-3 text-xs text-neutral-900">
                    {JSON.stringify(d, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
