import type { PandaMood } from "@setu/api-contracts";
import type { PandaSceneName } from "./pandaScene";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useSetu } from "../context";

export function PandaAvatar({
  mood = "idle",
  className = "",
  variant,
  animate = false,
}: {
  mood?: PandaMood;
  className?: string;
  variant?: PandaSceneName;
  animate?: boolean;
}) {
  const { prefs } = useSetu();
  const reduced = useReducedMotion();
  const element = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!animate || !element.current) return;
    let inView = true;
    const update = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(element.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [animate, prefs.text_only]);
  const scene =
    variant ||
    (["curious", "listening", "reading", "happy", "celebrate"].includes(mood)
      ? "meadow"
      : "jungle");
  if (prefs.text_only) return null;
  const moving =
    animate &&
    visible &&
    !prefs.reduced_motion &&
    !reduced &&
    mood !== "concerned" &&
    mood !== "resting";
  return (
    <img
      ref={element}
      src={`/panda-reference/${scene}-${moving ? "motion.webp" : "poster.png"}`}
      className={`panda-avatar ${className}`}
      data-mood={mood}
      alt=""
      aria-hidden="true"
      decoding="async"
    />
  );
}
