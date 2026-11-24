import {
  AnimationState,
  AnimationStateData,
  AssetManager,
  AtlasAttachmentLoader,
  ManagedWebGLRenderingContext,
  SceneRenderer,
  Skeleton,
  SkeletonJson,
} from "@esotericsoftware/spine-webgl";
import type { PandaMood } from "@setu/api-contracts";

export type PandaSceneName = "jungle" | "meadow";
export const referenceScenes = {
  jungle: {
    name: "Leaf-crown panda",
    file: "panda-1",
    animation: "idle-panda",
    duration: 20,
  },
  meadow: {
    name: "Butterfly panda",
    file: "panda-2",
    animation: "idle_panda",
    duration: 20,
  },
} as const;

export function sceneForMood(mood: PandaMood): PandaSceneName {
  return ["curious", "listening", "reading", "happy", "celebrate"].includes(
    mood,
  )
    ? "meadow"
    : "jungle";
}

/** Plays the source artwork, weighted meshes and keyframes without recreating them. */
export function createPandaScene(
  host: HTMLElement,
  initialMood: PandaMood,
  initialPaused: boolean,
  initialScene?: PandaSceneName,
  initialEnvironment = true,
) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const context = new ManagedWebGLRenderingContext(canvas, {
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  const gl = context.gl;
  const renderer = new SceneRenderer(canvas, context);
  const assets = new AssetManager(context, "/panda-reference/");
  host.appendChild(canvas);
  type Actor = {
    skeleton: Skeleton;
    state: AnimationState;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  const actors = new Map<string, Actor>();
  const scenery = [
    "leafs-right",
    "leafs-front",
    "flowers-back",
    "flowers-left",
    "flowers-right",
    "flowers-front",
  ];
  let environment = initialEnvironment;
  let mood = initialMood,
    paused = initialPaused,
    override = initialScene;
  let visible = true,
    disposed = false,
    loaded = false,
    animation = 0,
    previous = 0,
    lastDraw = 0,
    frames = 0;
  const currentScene = () => override || sceneForMood(mood);
  const still = () => paused || mood === "concerned" || mood === "resting";
  for (const { file } of Object.values(referenceScenes)) {
    assets.loadJson(file + ".json");
    assets.loadTextureAtlas(file + ".atlas");
  }
  for (const file of scenery) {
    assets.loadJson(file + ".json");
    assets.loadTextureAtlas(file + ".atlas");
  }

  function draw() {
    if (disposed || !loaded) return;
    const name = currentScene(),
      actor = actors.get(name)!;
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    const pixelWidth = Math.round(width * dpr),
      pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderer.camera.setViewport(width, height);
    renderer.camera.position.set(width / 2, height / 2, 0);
    renderer.begin();
    const paint = (
      key: string,
      x: number,
      y: number,
      w: number,
      h: number,
      padding = 1,
    ) => {
      const a = actors.get(key)!;
      const scale = Math.min(w / a.width, h / a.height) / padding;
      a.skeleton.scaleX = scale;
      a.skeleton.scaleY = scale;
      a.skeleton.x = x + (w - a.width * scale) / 2 - a.x * scale;
      a.skeleton.y = y + (h - a.height * scale) / 2 - a.y * scale;
      a.state.apply(a.skeleton);
      a.skeleton.updateWorldTransform();
      renderer.drawSkeleton(a.skeleton, false);
    };
    if (environment && name === "meadow")
      paint("flowers-back", -width * 0.12, 0, width * 1.24, height * 0.3);
    paint(name, 0, 0, width, height, 1.07);
    if (environment && name === "jungle") {
      paint(
        "leafs-right",
        width * 0.76,
        height * 0.08,
        width * 0.43,
        height * 0.86,
      );
      paint(
        "leafs-front",
        width * 0.06,
        -height * 0.025,
        width * 0.95,
        height * 0.28,
      );
    }
    if (environment && name === "meadow") {
      paint(
        "flowers-left",
        -width * 0.12,
        -height * 0.04,
        width * 0.42,
        height * 0.62,
      );
      paint(
        "flowers-right",
        width * 0.78,
        -height * 0.04,
        width * 0.36,
        height * 0.62,
      );
      paint(
        "flowers-front",
        width * 0.08,
        -height * 0.035,
        width * 0.68,
        height * 0.2,
      );
    }
    renderer.end();
    host.dataset.frameCount = String(++frames);
    host.dataset.scene = name;
    host.dataset.clip = referenceScenes[name].animation;
    host.dataset.time = String(
      Number((actor.state.getCurrent(0)!.trackTime % 20).toFixed(3)),
    );
  }
  function tick(now: number) {
    if (disposed || !visible || still() || !loaded) return;
    animation = requestAnimationFrame(tick);
    if (now - lastDraw < 32) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
    previous = now;
    lastDraw = now;
    actors.get(currentScene())!.state.update(delta);
    if (environment)
      scenery.forEach((key) => actors.get(key)!.state.update(delta));
    draw();
  }
  function play() {
    cancelAnimationFrame(animation);
    previous = 0;
    if (!disposed && loaded && visible && !still())
      animation = requestAnimationFrame(tick);
  }
  const observer = new ResizeObserver(draw);
  observer.observe(host);
  const ready = assets.loadAll().then(() => {
    if (disposed) {
      assets.dispose();
      return;
    }
    for (const [name, config] of Object.entries(referenceScenes)) {
      const json = assets.require(config.file + ".json");
      const loader = new SkeletonJson(
        new AtlasAttachmentLoader(assets.require(config.file + ".atlas")),
      );
      const data = loader.readSkeletonData(json);
      const skeleton = new Skeleton(data);
      const state = new AnimationState(new AnimationStateData(data));
      state.setAnimation(0, config.animation, true);
      actors.set(name as PandaSceneName, {
        skeleton,
        state,
        x: json.skeleton.x,
        y: json.skeleton.y,
        width: json.skeleton.width,
        height: json.skeleton.height,
      });
    }
    for (const file of scenery) {
      const json = assets.require(file + ".json");
      const loader = new SkeletonJson(
        new AtlasAttachmentLoader(assets.require(file + ".atlas")),
      );
      const data = loader.readSkeletonData(json);
      const skeleton = new Skeleton(data);
      const state = new AnimationState(new AnimationStateData(data));
      state.setAnimation(0, data.animations[0].name, true);
      actors.set(file, {
        skeleton,
        state,
        x: json.skeleton.x,
        y: json.skeleton.y,
        width: json.skeleton.width,
        height: json.skeleton.height,
      });
    }
    loaded = true;
    draw();
    play();
  });
  return {
    ready,
    setMood(value: PandaMood) {
      if (disposed) return;
      mood = value;
      draw();
      play();
    },
    setScene(value?: PandaSceneName) {
      if (disposed) return;
      override = value;
      draw();
      play();
    },
    setEnvironment(value: boolean) {
      if (disposed) return;
      environment = value;
      draw();
    },
    seek(seconds: number) {
      if (disposed || !loaded) return;
      const actor = actors.get(currentScene())!;
      actor.skeleton.setToSetupPose();
      actor.state.getCurrent(0)!.trackTime = Math.max(0, Math.min(20, seconds));
      scenery.forEach((key) => {
        const a = actors.get(key)!;
        a.skeleton.setToSetupPose();
        a.state.getCurrent(0)!.trackTime = Math.max(0, seconds);
      });
      draw();
    },
    setPaused(value: boolean) {
      if (disposed) return;
      paused = value;
      draw();
      play();
    },
    setVisible(value: boolean) {
      if (disposed) return;
      visible = value;
      if (visible) draw();
      play();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(animation);
      observer.disconnect();
      assets.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
