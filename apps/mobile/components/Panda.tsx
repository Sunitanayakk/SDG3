import { useEffect, useState } from "react";
import { AppState, Image, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { PandaMood } from "@setu/api-contracts";
import { useSetu } from "../services/context";
import jungleStill from "../assets/panda/jungle-poster.png";
import jungleMotion from "../assets/panda/jungle-motion.gif";
import meadowStill from "../assets/panda/meadow-poster.png";
import meadowMotion from "../assets/panda/meadow-motion.gif";

const media = {
  jungle: {
    still: jungleStill,
    motion: jungleMotion,
  },
  meadow: {
    still: meadowStill,
    motion: meadowMotion,
  },
};

/** Original rig playback encoded into a 20-second loop; pauses by displaying a still. */
export function Panda({
  mood = "welcome",
  size = 110,
  paused = false,
  variant,
}: {
  mood?: PandaMood;
  size?: number;
  paused?: boolean;
  variant?: "jungle" | "meadow";
}) {
  const { prefs, ready } = useSetu();
  const systemReduced = useReducedMotion();
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => listener.remove();
  }, []);
  if (prefs.text_only) return null;
  const scene =
    variant ||
    (["curious", "listening", "reading", "happy", "celebrate"].includes(mood)
      ? "meadow"
      : "jungle");
  const moving =
    ready &&
    active &&
    !paused &&
    !prefs.reduced_motion &&
    !systemReduced &&
    mood !== "concerned" &&
    mood !== "resting";
  return (
    <View
      style={{ width: size, height: size * 1.1 }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={moving ? media[scene].motion : media[scene].still}
        style={{ width: size, height: size * 1.1, borderRadius: 12 }}
        resizeMode="contain"
      />
    </View>
  );
}
