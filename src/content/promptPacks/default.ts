export type PromptPack = {
  id: string;
  label: string;
  promptsByPathId: Record<string, string[]>;
};

export const defaultPromptPack: PromptPack = {
  id: "default",
  label: "Default Aliven Rhythm",
  promptsByPathId: {
    // IMPORTANT:
    // These keys must match your actual path.id values in src/data/pillars.ts
    // Replace "asana" / "stillness" etc if your ids are different.
    asana: [
      "Where can I soften without losing structure?",
      "What does steady effort feel like in my body?",
      "Where am I holding unnecessary tension?",
      "How can I support myself with consistency this week?",
    ],
    stillness: [
      "What am I noticing when I slow down?",
      "What wants to be felt but not fixed?",
      "Where can I allow more space in my day?",
      "What happens when I don’t rush myself?",
    ],
    strength: [
      "Where do I feel stable and strong right now?",
      "What kind of strength do I actually need today?",
      "Where can I choose progress over pressure?",
      "How can I meet my edge with respect?",
    ],
    movement: [
      "What sensations, emotions, or impulses want expression?",
      "Where do I feel stuck, and what movement might unstick me?",
      "What happens when I let my body lead for 2 minutes?",
      "What do I discover when I move without performing?",
    ],
  },
};
