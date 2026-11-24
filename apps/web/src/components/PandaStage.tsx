import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { pandaMoods, type PandaMood } from "@setu/api-contracts";
import { useSetu } from "../context";
import { PandaAvatar } from "./PandaAvatar";
import type { PandaSceneName } from "./pandaScene";

type Scene = ReturnType<typeof import("./pandaScene").createPandaScene>;

export function PandaStage({
  mood = "welcome",
  className = "",
  controls = true,
  variant,
  time,
  environment = true,
}: {
  mood?: PandaMood;
  className?: string;
  controls?: boolean;
  variant?: PandaSceneName;
  time?: number;
  environment?: boolean;
}) {
  const { prefs } = useSetu();
  const systemReduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const stopped =
    paused ||
    prefs.reduced_motion ||
    !!systemReduced ||
    mood === "concerned" ||
    mood === "resting" ||
    time !== undefined;
  const [renderer, setRenderer] = useState("poster");
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const current = useRef({ mood, stopped, variant, time, environment });
  const description = pandaMoods.find((m) => m.id === mood)!;
  useEffect(() => {
    current.current = { mood, stopped, variant, time, environment };
    scene.current?.setMood(mood);
    scene.current?.setScene(variant);
    scene.current?.setPaused(stopped);
    scene.current?.setEnvironment(environment);
    if (time !== undefined) scene.current?.seek(time);
  }, [mood, stopped, variant, time, environment]);
  useEffect(() => {
    const host = mount.current;
    if (
      !host ||
      prefs.text_only ||
      typeof WebGL2RenderingContext === "undefined"
    )
      return;
    let cancelled = false,
      inView = true;
    let controller: Scene | undefined;
    const visible = () => controller?.setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        visible();
      },
      { rootMargin: "40px" },
    );
    observer.observe(host);
    document.addEventListener("visibilitychange", visible);
    const lost = (event: Event) => {
      event.preventDefault();
      controller?.dispose();
      controller = undefined;
      scene.current = null;
      if (!cancelled) setRenderer("poster");
    };
    host.addEventListener("webglcontextlost", lost, true);
    import("./pandaScene")
      .then(({ createPandaScene }) => {
        if (cancelled) return;
        try {
          controller = createPandaScene(
            host,
            current.current.mood,
            current.current.stopped,
            current.current.variant,
            current.current.environment,
          );
          scene.current = controller;
          visible();
          controller.ready
            .then(() => {
              if (cancelled || !controller || scene.current !== controller)
                return;
              if (current.current.time !== undefined)
                controller?.seek(current.current.time);
              setRenderer("webgl");
            })
            .catch(() => {
              controller?.dispose();
              controller = undefined;
              scene.current = null;
              if (!cancelled) setRenderer("poster");
            });
        } catch {
          setRenderer("poster");
        }
      })
      .catch(() => {
        if (!cancelled) setRenderer("poster");
      });
    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", visible);
      host.removeEventListener("webglcontextlost", lost, true);
      controller?.dispose();
      scene.current = null;
    };
  }, [prefs.text_only]);
  return (
    <figure
      className={`panda-stage ${className}`}
      data-mood={mood}
      data-paused={stopped}
      data-renderer={renderer}
      data-scenery={environment}
      data-scene={
        variant ||
        (["curious", "listening", "reading", "happy", "celebrate"].includes(
          mood,
        )
          ? "meadow"
          : "jungle")
      }
    >
      <div
        className="panda-viewport"
        role="img"
        aria-label={`Setu panda: ${description.label}. ${description.description}`}
      >
        <div className="panda-halo" />
        <div className="panda-scene-mount" ref={mount} />
        <div className="panda-poster">
          <PandaAvatar mood={mood} variant={variant} />
        </div>
      </div>
      {controls && (
        <figcaption className="panda-stage-caption">
          <span>
            <strong>Setu, by your side.</strong>
            <small>
              {variant
                ? variant === "jungle"
                  ? "Leaf-crown panda"
                  : "Butterfly panda"
                : description.label}
            </small>
          </span>
          <button
            className="panda-motion-toggle"
            onClick={() => setPaused(!paused)}
            aria-pressed={stopped}
            disabled={
              !!systemReduced ||
              prefs.reduced_motion ||
              mood === "concerned" ||
              mood === "resting" ||
              time !== undefined
            }
            aria-label={
              stopped ? "Play panda animation" : "Pause panda animation"
            }
          >
            {stopped ? <Play size={15} /> : <Pause size={15} />}
            <span>
              {systemReduced || prefs.reduced_motion
                ? "Reduced motion"
                : time !== undefined
                  ? "Frame preview"
                  : mood === "concerned" || mood === "resting"
                    ? "Still support"
                    : paused
                      ? "Play motion"
                      : "Pause motion"}
            </span>
          </button>
        </figcaption>
      )}
    </figure>
  );
}

export function PandaMini({ mood }: { mood: PandaMood }) {
  const { prefs } = useSetu();
  return (
    <span
      className="panda-mini"
      data-still={prefs.reduced_motion}
      aria-hidden="true"
    >
      <PandaAvatar mood={mood} animate />
    </span>
  );
}
