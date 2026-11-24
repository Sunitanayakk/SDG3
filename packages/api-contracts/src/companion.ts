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
    description:
      "The original leaf-crown panda welcomes you with natural facial movement.",
  },
  {
    id: "curious",
    label: "Curious",
    description: "A small head tilt and lifted gaze toward a butterfly.",
  },
  {
    id: "listening",
    label: "Listening",
    description: "Setu stays by your side while you choose your words.",
  },
  {
    id: "thinking",
    label: "Thinking",
    description:
      "Your request is being prepared; the original panda idle animation continues.",
  },
  {
    id: "reading",
    label: "Reading",
    description:
      "A quiet companion while you explore information at your pace.",
  },
  {
    id: "happy",
    label: "Glad to help",
    description: "A soft smile, bright eyes and relaxed shoulders.",
  },
  {
    id: "celebrate",
    label: "A small success",
    description:
      "A saved preference or completed task, acknowledged with the original panda artwork.",
  },
  {
    id: "concerned",
    label: "Here for you",
    description: "Still, attentive support for an error or urgent message.",
  },
  {
    id: "resting",
    label: "Taking a breath",
    description:
      "The original panda is shown as a still frame, with movement paused.",
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
