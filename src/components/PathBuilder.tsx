"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { defaultPromptPack } from "@/content/promptPacks/default";
import { getPromptForWeek } from "@/utils/getPromptForWeek";
import { paths } from "@/data/pillars";
import PathCard from "@/components/PathCard";

type Path = (typeof paths)[number];

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

function readDraftsFromLocalStorage(): SavedDraft[] {
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

function writeDraftsToLocalStorage(drafts: SavedDraft[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function DraggablePath({ path }: { path: Path }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: path.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "cursor-grab active:cursor-grabbing",
        "rounded-2xl transition",
        isDragging
          ? "ring-2 ring-[#a4756f]/30"
          : "hover:ring-2 hover:ring-black/5",
      ].join(" ")}
      {...listeners}
      {...attributes}
    >
      <PathCard
        name={path.name}
        description={path.description}
        mainPillar={path.mainPillar}
        supports={path.supports}
      />
    </div>
  );
}

function MainSlot({
  selectedPath,
  onClear,
}: {
  selectedPath: Path | null;
  onClear: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "main-slot" });

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-2xl border p-5 bg-white shadow-sm min-h-[180px]",
        "text-neutral-950",
        isOver ? "border-neutral-900 ring-2 ring-black/5" : "border-neutral-300",
      ].join(" ")}
    >
      <p className="text-sm font-semibold text-neutral-950 mb-3">
        Main Path <span className="font-normal text-neutral-600">(drop here)</span>
      </p>

      {selectedPath ? (
        <div className="space-y-4">
          <PathCard
            name={selectedPath.name}
            description={selectedPath.description}
            mainPillar={selectedPath.mainPillar}
            supports={selectedPath.supports}
          />
          <button
            className="text-sm font-medium text-neutral-800 underline decoration-neutral-400 underline-offset-4 hover:text-neutral-950"
            onClick={onClear}
          >
            Clear selection
          </button>
        </div>
      ) : (
        <p className="text-sm text-neutral-700">
          Drag one of the paths on the left into this box.
        </p>
      )}
    </div>
  );
}

function RhythmPreview({
  path,
  pack,
  editMode,
  draftPrompts,
  setDraftPromptForWeek,
  draftPractices,
  setDraftPracticeForWeek,
}: {
  path: Path;
  pack: typeof defaultPromptPack;
  editMode: boolean;
  draftPrompts: Record<number, string>;
  setDraftPromptForWeek: (week: number, value: string) => void;
  draftPractices: Record<number, string>;
  setDraftPracticeForWeek: (week: number, value: string) => void;
}) {
  const weeks = [1, 2, 3, 4].map((week) => {
    const support =
      path.supports.length === 1
        ? path.supports[0]
        : path.supports[(week - 1) % 2];

    const basePrompt = getPromptForWeek(pack, path.id, week - 1);
    const prompt = draftPrompts[week] ?? basePrompt;

    const basePractices = `${path.mainPillar} + ${support}`;
    const practices = draftPractices[week] ?? basePractices;

    return { week, practices, prompt };
  });

  return (
    <div className="space-y-4">
      {weeks.map(({ week, practices, prompt }) => (
        <div
          key={week}
          className="rounded-xl border border-neutral-300 bg-white p-4"
        >
          <p className="mb-2 text-sm font-semibold text-neutral-950">
            Week {week}
          </p>

          <div className="mb-3 space-y-1 text-sm text-neutral-700">
            <div className="font-medium text-neutral-800">Practices</div>

            {editMode ? (
              <input
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                value={practices}
                onChange={(e) => setDraftPracticeForWeek(week, e.target.value)}
              />
            ) : (
              <p className="text-sm text-neutral-800">
                <span className="font-semibold text-neutral-950">
                  {practices}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1 text-sm text-neutral-700">
            <div className="font-medium text-neutral-800">Journal prompt</div>

            {editMode ? (
              <textarea
                className="w-full rounded-lg border border-neutral-300 p-2 text-sm text-neutral-900"
                rows={3}
                value={prompt}
                onChange={(e) => setDraftPromptForWeek(week, e.target.value)}
              />
            ) : (
              <p className="italic text-neutral-900">{prompt}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PathBuilder({ editMode = false }: { editMode?: boolean }) {
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [draftPrompts, setDraftPrompts] = useState<Record<number, string>>({});
  const [draftPractices, setDraftPractices] = useState<Record<number, string>>(
    {}
  );

  // Load draft data from URL params (when arriving from /drafts "Load" button)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const draftPathId = params.get("draftPathId");
    const draftPromptsParam = params.get("draftPrompts");
    const draftPracticesParam = params.get("draftPractices");

    if (draftPathId) setSelectedPathId(draftPathId);

    if (draftPromptsParam) {
      try {
        setDraftPrompts(JSON.parse(decodeURIComponent(draftPromptsParam)));
      } catch {
        // ignore
      }
    }

    if (draftPracticesParam) {
      try {
        setDraftPractices(JSON.parse(decodeURIComponent(draftPracticesParam)));
      } catch {
        // ignore
      }
    }
  }, []);

  const selectedPath = useMemo(
    () => paths.find((p) => p.id === selectedPathId) ?? null,
    [selectedPathId]
  );

  const setDraftPromptForWeek = (week: number, value: string) => {
    setDraftPrompts((prev) => ({ ...prev, [week]: value }));
  };

  const setDraftPracticeForWeek = (week: number, value: string) => {
    setDraftPractices((prev) => ({ ...prev, [week]: value }));
  };

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id?.toString();
    const activeId = event.active.id.toString();

    if (overId === "main-slot") {
      setSelectedPathId(activeId);
      setDraftPrompts({});
      setDraftPractices({});
    }
  }

  function resetToPackDefaults() {
    setDraftPrompts({});
    setDraftPractices({});
  }

  function saveDraftNow() {
    if (!selectedPathId) {
      alert("Pick a main path first, then save.");
      return;
    }

    const name = window.prompt("Name this draft")?.trim();
    if (!name) return;

    const now = new Date().toISOString();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const draft: SavedDraft = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      packId: defaultPromptPack.id,
      pathId: selectedPathId,
      draftPrompts,
      draftPractices,
    };

    const drafts = readDraftsFromLocalStorage();
    drafts.unshift(draft);
    writeDraftsToLocalStorage(drafts);

    alert("Draft saved. Open Saved drafts to view it.");
  }

  async function exportPdf() {
    if (!selectedPath) {
      alert("Pick a main path first.");
      return;
    }

    const weeks = [1, 2, 3, 4].map((week) => {
      const support =
        selectedPath.supports.length === 1
          ? selectedPath.supports[0]
          : selectedPath.supports[(week - 1) % 2];

      const basePrompt = getPromptForWeek(defaultPromptPack, selectedPath.id, week - 1);
      const prompt = draftPrompts[week] ?? basePrompt;

      const basePractices = `${selectedPath.mainPillar} + ${support}`;
      const practices = draftPractices[week] ?? basePractices;

      return { week, practices, prompt };
    });

    const payload = {
      title: "Aliven Rhythm Preview",
      pathId: selectedPath.id,
      pathName: selectedPath.name,
      createdAt: new Date().toISOString(),
      weeks,
    };

    const res = await fetch("/api/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    a.download = `aliven-rhythm-preview-${selectedPath.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 text-neutral-950">
      <div className="text-xs tracking-wide text-neutral-700">BUILDER LOADED</div>

      {editMode && (
        <div className="text-xs font-medium text-[#a4756f]">EDIT MODE</div>
      )}

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-neutral-950 mb-2">
              Pick your main path
            </h2>
            <p className="text-sm text-neutral-700 mb-6">
              Drag a card into the Main Path slot.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paths.map((p) => (
                <DraggablePath key={p.id} path={p} />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <MainSlot
              selectedPath={selectedPath}
              onClear={() => setSelectedPathId(null)}
            />

            <div className="rounded-2xl border border-neutral-300 p-5 bg-white shadow-sm text-neutral-950">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-neutral-950">
                  4-week rhythm preview
                </p>

                {editMode && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetToPackDefaults}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
                    >
                      Reset
                    </button>

                    <button
                      type="button"
                      onClick={saveDraftNow}
                      className="rounded-lg bg-[#a4756f] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                    >
                      Save draft
                    </button>

                    <button
                      type="button"
                      onClick={exportPdf}
                      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                    >
                      Export PDF
                    </button>
                  </div>
                )}
              </div>

              {selectedPath ? (
                <RhythmPreview
                  path={selectedPath}
                  pack={defaultPromptPack}
                  editMode={editMode}
                  draftPrompts={draftPrompts}
                  setDraftPromptForWeek={setDraftPromptForWeek}
                  draftPractices={draftPractices}
                  setDraftPracticeForWeek={setDraftPracticeForWeek}
                />
              ) : (
                <p className="text-sm text-neutral-700">
                  Select a main path to preview the weekly structure and journal
                  prompts.
                </p>
              )}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
