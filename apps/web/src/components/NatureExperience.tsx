import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useSetu } from "../context";

type Controller = ReturnType<
  typeof import("./immersiveScene").createImmersiveScene
>;

function NatureCursor({ disabled }: { disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cursor = ref.current;
    if (!cursor || disabled || !matchMedia("(pointer:fine)").matches) return;
    let frame = 0,
      x = 0,
      y = 0,
      px = 0,
      py = 0,
      active = false;
    let magnetic: HTMLElement | null = null;
    const draw = () => {
      px += (x - px) * 0.22;
      py += (y - py) * 0.22;
      cursor.style.transform = `translate3d(${px}px,${py}px,0)`;
      if (Math.abs(x - px) + Math.abs(y - py) > 0.1)
        frame = requestAnimationFrame(draw);
      else frame = 0;
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!active) {
        px = x;
        py = y;
        active = true;
      }
      const target = e.target instanceof Element ? e.target : null;
      const control = target?.closest("a,button,[data-cursor]");
      cursor.dataset.active = String(
        !!target?.closest(".immersive-public") &&
          !target.closest("input,select,textarea"),
      );
      cursor.dataset.hover = String(!!control);
      const next =
        control instanceof HTMLElement && control.classList.contains("magnetic")
          ? control
          : null;
      if (magnetic !== next && magnetic) {
        magnetic.style.setProperty("--magnet-x", "0px");
        magnetic.style.setProperty("--magnet-y", "0px");
      }
      magnetic = next;
      if (magnetic) {
        const box = magnetic.getBoundingClientRect();
        magnetic.style.setProperty(
          "--magnet-x",
          `${(x - box.left - box.width / 2) * 0.12}px`,
        );
        magnetic.style.setProperty(
          "--magnet-y",
          `${(y - box.top - box.height / 2) * 0.12}px`,
        );
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const leave = () => {
      cursor.dataset.active = "false";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      magnetic?.style.setProperty("--magnet-x", "0px");
      magnetic?.style.setProperty("--magnet-y", "0px");
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [disabled]);
  return (
    <div
      className="nature-cursor"
      ref={ref}
      aria-hidden="true"
      data-disabled={disabled}
    >
      <span />
    </div>
  );
}

export function NatureExperience() {
  const { prefs } = useSetu();
  const osReduced = useReducedMotion();
  const reduced = prefs.reduced_motion || !!osReduced || prefs.text_only;
  const [paused, setPaused] = useState(false);
  const [compact, setCompact] = useState(
    () => matchMedia("(max-width:1079px)").matches,
  );
  const [renderer, setRenderer] = useState("poster");
  const [ready, setReady] = useState(false);
  const [entry, setEntry] = useState<"loading" | "leaving" | "done">(
    reduced ? "done" : "loading",
  );
  const [chapter, setChapter] = useState(0);
  const story = useRef<HTMLElement>(null),
    world = useRef<HTMLDivElement>(null),
    mount = useRef<HTMLDivElement>(null),
    backdrop = useRef<HTMLCanvasElement>(null);
  const controller = useRef<Controller | null>(null);
  const progress = useRef(0);
  const current = useRef({ paused, reduced });
  current.current = { paused, reduced };
  const skip = () => setEntry("done");
  useEffect(() => {
    const media = matchMedia("(max-width:1079px)");
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    if (reduced || entry === "done") return;
    const timeout = window.setTimeout(
      () => setEntry("leaving"),
      ready ? 1200 : 5500,
    );
    return () => clearTimeout(timeout);
  }, [ready, reduced, entry]);
  useEffect(() => {
    if (entry !== "leaving") return;
    const timeout = window.setTimeout(() => setEntry("done"), 850);
    return () => clearTimeout(timeout);
  }, [entry]);
  useEffect(() => {
    if (entry === "done" || reduced) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEntry("done");
    };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", escape);
    };
  }, [entry, reduced]);

  useEffect(() => {
    const element = story.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const p =
        reduced || compact
          ? 0
          : Math.max(
              0,
              Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)),
            );
      progress.current = p;
      controller.current?.setProgress(p);
      element.style.setProperty("--journey-progress", String(p));
      world.current?.style.setProperty("--background-position", `${p * 100}%`);
      setChapter(p < 0.32 ? 0 : p < 0.82 ? 1 : 2);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reduced, compact]);

  useEffect(() => {
    controller.current?.setPaused(paused, reduced);
  }, [paused, reduced]);
  useEffect(() => {
    const host = mount.current,
      background = backdrop.current,
      container = world.current;
    if (!host || !background || !container || prefs.text_only) return;
    let cancelled = false,
      scene: Controller | undefined,
      intersecting = true;
    let lastWipe = -1;
    const wipe = (p: number) => {
      if (Math.abs(p - lastWipe) < 0.0001) return;
      lastWipe = p;
      const l = Math.min(1, p / 0.36),
        r = Math.min(1, p / 0.26);
      container.style.setProperty("--leaf-left-x", `${-110 * l ** 2.2}vw`);
      container.style.setProperty("--leaf-left-y", `${-500 * l ** 2.2}vh`);
      container.style.setProperty("--leaf-left-turn", `${-120 * l ** 3.6}deg`);
      container.style.setProperty("--leaf-left-scale", String(1 + l));
      container.style.setProperty("--leaf-right-x", `${110 * r ** 2.2}vw`);
      container.style.setProperty("--leaf-right-y", `${-560 * r ** 2.2}vh`);
      container.style.setProperty("--leaf-right-turn", `${60 * r}deg`);
      container.style.setProperty("--leaf-right-scale", String(1 + r));
      container.style.setProperty(
        "--leaf-blur",
        `${Math.min(p / 0.36, 1) * 16}px`,
      );
      container.dataset.wipe = p > 0.4 ? "hidden" : "visible";
    };
    const visible = () => {
      const value = intersecting && !document.hidden;
      container.dataset.visible = String(value);
      scene?.setVisible(value);
    };
    const observer = new IntersectionObserver(
      ([e]) => {
        intersecting = e.isIntersecting;
        visible();
      },
      { threshold: 0 },
    );
    observer.observe(container);
    const pointer = (e: PointerEvent) => {
      if (current.current.reduced || e.pointerType === "touch") return;
      scene?.setPointer(
        (e.clientX / innerWidth - 0.5) * 2,
        (0.5 - e.clientY / innerHeight) * 2,
      );
    };
    const leave = () => scene?.setPointer(0, 0);
    const lost = (event: Event) => {
      event.preventDefault();
      scene?.dispose();
      scene = undefined;
      controller.current = null;
      if (!cancelled) {
        setRenderer("poster");
        setReady(true);
      }
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pointermove", pointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    container.addEventListener("webglcontextlost", lost, true);
    import("./immersiveScene")
      .then(({ createImmersiveScene }) => {
        if (cancelled) return;
        try {
          scene = createImmersiveScene(
            host,
            background,
            current.current.paused,
            current.current.reduced,
            compact,
            wipe,
          );
          controller.current = scene;
          scene.setProgress(progress.current);
          visible();
          scene.ready
            .then(() => {
              if (!cancelled && scene && controller.current === scene) {
                setRenderer("webgl");
                setReady(true);
              }
            })
            .catch(() => {
              scene?.dispose();
              scene = undefined;
              controller.current = null;
              if (!cancelled) {
                setRenderer("poster");
                setReady(true);
              }
            });
        } catch {
          if (!cancelled) {
            setRenderer("poster");
            setReady(true);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pointermove", pointer);
      document.documentElement.removeEventListener("pointerleave", leave);
      container.removeEventListener("webglcontextlost", lost, true);
      scene?.dispose();
      controller.current = null;
    };
  }, [prefs.text_only, compact]);

  return (
    <>
      <NatureCursor disabled={reduced || paused} />
      {!reduced && entry !== "done" && (
        <div
          className="nature-entry"
          data-phase={entry}
          role="status"
          aria-label="Opening SwasthyaSetu"
        >
          <video
            src="/panda-reference/intro.mp4"
            autoPlay
            muted
            playsInline
            aria-hidden="true"
          />
          <div className="nature-entry-brand">
            SwasthyaSetu<span>AI</span>
          </div>
          <p>Accessible care begins with understanding.</p>
          <span className="nature-entry-line" aria-hidden="true" />
          <button onClick={skip}>Skip intro</button>
        </div>
      )}
      <section
        className="nature-journey"
        ref={story}
        data-reduced={reduced}
        data-chapter={chapter}
        data-entered={entry === "done" || reduced}
        aria-label="A journey to accessible healthcare"
      >
        <div className="nature-pin">
          {!prefs.text_only && (
            <div
              className="nature-world"
              ref={world}
              data-renderer={renderer}
              data-paused={paused || reduced}
              aria-hidden="true"
            >
              <canvas className="nature-backdrop" ref={backdrop} />
              <img
                className="nature-poster"
                src={`/panda-reference/${chapter === 0 ? "jungle" : "meadow"}-poster.png`}
                alt=""
              />
              <div className="nature-rig" ref={mount} />
              {!compact && !reduced && (
                <div className="nature-leaf-wipe">
                  <img
                    src="/panda-reference/leaf-bottom-left-2.avif"
                    className="nature-leaf-left"
                    alt=""
                  />
                  <img
                    src="/panda-reference/leaf-bottom-right-2.avif"
                    className="nature-leaf-right"
                    alt=""
                  />
                </div>
              )}
              <div className="nature-motes">
                {Array.from({ length: 30 }, (_, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${(i * 37 + 11) % 100}%`,
                      top: `${(i * 23 + 9) % 100}%`,
                      animationDelay: `${-i * 0.67}s`,
                      animationDuration: `${7 + (i % 6)}s`,
                    }}
                  />
                ))}
              </div>
              <div className="nature-shade" />
            </div>
          )}
          <div className="nature-intro-copy" data-active={chapter === 0}>
            <p className="nature-kicker">
              SwasthyaSetu AI · Accessible Healthcare for All
            </p>
            <h1 aria-label="Better care starts with being understood.">
              <span>Better care starts</span>
              <span>with being</span>
              <span>understood.</span>
            </h1>
            <div className="nature-actions">
              <Link className="nature-button magnetic" to="/app/chat">
                <span>Ask Setu AI</span>
              </Link>
              <Link className="nature-text-link" to="/app/tools">
                Find your access tools
              </Link>
            </div>
          </div>
          <div
            className="nature-intro-copy nature-second-copy"
            data-active={chapter === 1}
            aria-hidden={chapter !== 1}
          >
            <p className="nature-kicker">
              Your needs. Your language. Your pace.
            </p>
            <h2>
              Care that meets
              <br />
              you where
              <br />
              you are.
            </h2>
            <p>
              Read. Listen. Communicate.
              <br />
              Take the next step with confidence.
            </p>
            <Link
              className="nature-text-link"
              to="/app/passport"
              tabIndex={chapter === 1 ? 0 : -1}
            >
              Create your Accessibility Passport
            </Link>
          </div>
          <div
            className="nature-sky-copy"
            data-active={chapter === 2}
            aria-hidden={chapter !== 2}
          >
            <p>One small step can make a difference.</p>
            <h2>
              A clearer path
              <br />
              to care.
            </h2>
            <a href="#features" tabIndex={chapter === 2 ? 0 : -1}>
              Explore your tools
            </a>
          </div>
          <div className="nature-bottom-bar">
            <a className="nature-scroll-cue" href="#features">
              Scroll to explore
              <span aria-hidden="true" />
            </a>
            <span className="nature-scope">
              Health education · Human care at the centre
            </span>
            <button
              className="nature-pause"
              onClick={() => setPaused(!paused)}
              aria-pressed={paused || reduced}
              disabled={reduced}
              aria-label={
                paused ? "Resume ambient motion" : "Pause ambient motion"
              }
            >
              {paused || reduced ? <Play size={14} /> : <Pause size={14} />}
              <span>
                {reduced
                  ? "Reduced motion"
                  : paused
                    ? "Resume motion"
                    : "Pause motion"}
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export function NatureReveal({
  root,
}: {
  root: RefObject<HTMLDivElement | null>;
}) {
  useEffect(() => {
    const elements = root.current?.querySelectorAll("[data-nature-reveal]");
    if (!elements) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-revealed", "true");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    elements.forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [root]);
  return null;
}

export function ReplayNature() {
  return (
    <button
      className="nature-replay"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        window.location.reload();
      }}
    >
      <RotateCcw size={16} />
      Replay the entrance
    </button>
  );
}
