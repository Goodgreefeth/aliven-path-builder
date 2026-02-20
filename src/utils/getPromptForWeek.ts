import type { PromptPack } from "@/content/promptPacks/default";

export function getPromptForWeek(
  pack: PromptPack,
  pathId: string,
  weekIndex: number
): string {
  const prompts = pack.promptsByPathId?.[pathId];

  if (!prompts || prompts.length === 0) return "";

  const idx =
    weekIndex < 0 ? 0 : weekIndex >= prompts.length ? prompts.length - 1 : weekIndex;

  return prompts[idx] ?? "";
}
