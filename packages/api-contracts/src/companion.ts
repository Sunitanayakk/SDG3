import type { SafetyLevel } from "./types";

export const pandaMoods = [
  {
    id: "idle",
    label: "At ease",
    description: "Soft breathing, natural blinking and a quiet sway.",
  },
  {
    id: "welcome",
    label: "A warm hello",
    description: "A raised paw, a gentle wave and a welcoming smile.",
  },
  {
    id: "curious",
    label: "Curious",
    description: "A small head tilt and lifted gaze toward a butterfly.",
  },
  {
    id: "listening",
    label: "Listening",
    description: "A slight forward lean, attentive eyes and a calm expression.",
  },
  {
    id: "thinking",
    label: "Thinking",
    description: "A paw near the chin and a thoughtful upward glance.",
  },
  {
    id: "reading",
    label: "Reading",
    description: "An open book, lowered gaze and a subtle reading nod.",
  },
  {
    id: "happy",
    label: "Glad to help",
    description: "A soft smile, bright eyes and relaxed shoulders.",
  },
  {
    id: "celebrate",
    label: "A small success",
    description: "Both paws rise with one short, gentle bounce.",
  },
  {
    id: "concerned",
    label: "Here for you",
    description: "Still, attentive support for an error or urgent message.",
  },
  {
    id: "resting",
    label: "Taking a breath",
    description: "Closed eyes and a relaxed resting pose.",
  },
] as const;
export type PandaMood = (typeof pandaMoods)[number]["id"];

/** Reflect interface state, never infer a patient's emotions or medical outcome. */
export function pandaMoodForChat(input: {
  pending: boolean;
  error: boolean;
  focused: boolean;
  hasReply: boolean;
  safety?: SafetyLevel;
}): PandaMood {
  if (input.safety === "emergency") return "concerned";
  if (input.error) return "concerned";
  if (input.pending) return "thinking";
  if (input.focused) return "listening";
  if (input.hasReply) return "happy";
  return "welcome";
}
