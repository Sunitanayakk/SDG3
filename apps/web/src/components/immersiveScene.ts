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
import { createNatureBackdrop } from "./natureBackdrop";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (a: number, b: number, n: number) => {
  const p = clamp((n - a) / (b - a));
  return p * p * (3 - 2 * p);
};
const rise = (start: number, duration: number, n: number, power: number) =>
  1 - Math.pow(1 - clamp((n - start) / duration), power);
type Actor = {
  skeleton: Skeleton;
  state: AnimationState;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Full viewport composition. Artwork/keyframes remain in the original source rigs. */
export function createImmersiveScene(
  host: HTMLElement,
  backdropCanvas: HTMLCanvasElement,
  paused: boolean,
  reduced: boolean,
  compactLayout = false,
  onFrame?: (progress: number) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const context = new ManagedWebGLRenderingContext(canvas, {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  const gl = context.gl,
    renderer = new SceneRenderer(canvas, context),
    assets = new AssetManager(context, "/panda-reference/");
  // Source images have straight alpha. Match the PMA blend and canvas output
  // by premultiplying once at upload, avoiding bright edges on fur and petals.
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const backdrop = createNatureBackdrop(backdropCanvas);
  host.appendChild(canvas);
  const actors = new Map<string, Actor>();
  const files = compactLayout
    ? ["panda-1"]
    : [
        "panda-1",
        "panda-2",
        "leafs-left",
        "leafs-right",
        "leafs-front",
        "flowers-back",
        "flowers-left",
        "flowers-right",
        "flowers-front",
        "fish1",
        "fish2",
        "fish3",
      ];
  for (const file of files) {
    assets.loadJson(file + ".json");
    assets.loadTextureAtlas(
      file.startsWith("fish")
        ? "fishes.atlas"
        : file === "leafs-left"
          ? "leafs-left-web.atlas"
          : file + ".atlas",
    );
  }
  let disposed = false,
    loaded = false,
    visible = true,
    frame = 0,
    last = 0,
    lastDraw = 0,
    count = 0,
    time = 0;
  let target = 0,
    progress = 0,
    px = 0,
    py = 0,
    tx = 0,
    ty = 0;
  const paint = (
    key: string,
    x: number,
    y: number,
    w: number,
    h: number,
    opacity = 1,
    rotation = 0,
    flip = false,
  ) => {
    const a = actors.get(key);
    if (!a || opacity < 0.002) return;
    const scale = Math.min(w / a.width, h / a.height);
    const root = a.skeleton.getRootBone();
    if (root) root.rotation = root.data.rotation;
    a.state.apply(a.skeleton);
    a.skeleton.scaleX = scale * (flip ? -1 : 1);
    a.skeleton.scaleY = scale;
    a.skeleton.color.a = opacity;
    a.skeleton.x = x + (w - a.width * scale) / 2 - a.x * a.skeleton.scaleX;
    if (flip) a.skeleton.x += a.width * scale;
    a.skeleton.y = y + (h - a.height * scale) / 2 - a.y * scale;
    if (root) root.rotation += rotation;
    a.skeleton.updateWorldTransform();
    renderer.drawSkeleton(a.skeleton, true);
  };
  function draw() {
    if (disposed || !visible) return;
    const { width: w, height: h } = host.getBoundingClientRect();
    if (!w || !h) return;
    const p = reduced ? 0 : progress,
      compact = compactLayout || w < 1080;
    onFrame?.(p);
    backdrop?.draw(
      w,
      h,
      p,
      time,
      reduced ? 0 : px,
      reduced ? 0 : py,
      !paused && !reduced,
    );
    if (!loaded) return;
    const dpr = Math.min(devicePixelRatio || 1, compact ? 1.25 : 1.6);
    const pw = Math.round(w * dpr),
      ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    gl.viewport(0, 0, pw, ph);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderer.camera.setViewport(w, h);
    renderer.camera.position.set(w / 2, h / 2, 0);
    renderer.begin();
    const driftX = reduced ? 0 : px * 12,
      driftY = reduced ? 0 : py * 7;
    const switchP = smooth(0.28, 0.43, p),
      exit = smooth(0.74, 0.89, p);
    const shrink = 1 - 0.3 * smooth(0, 0.06, p) + 0.45 * smooth(0.13, 1, p);
    const pandaH = compact ? h * 0.61 : h * 1.05 * shrink;
    const pandaW = compact ? w * 0.8 : pandaH * 0.86;
    const pandaX = compact ? w * 0.02 : w * 0.04 + driftX;
    const pandaY = compact
      ? -h * 0.07
      : -h * 0.15 +
        h * (0.1 * smooth(0, 0.06, p) - 0.06 * smooth(0.13, 1, p)) -
        exit * h * 0.3 +
        driftY;
    const flowers = rise(0.15, 0.63, p, 2);
    if (!compact)
      paint(
        "flowers-back",
        -w * 0.025,
        -h * 0.1 - (1 - flowers) * h * 0.7,
        w * 1.05,
        h * 0.67,
      );
    paint("panda-1", pandaX, pandaY, pandaW, pandaH, 1 - switchP);
    if (!compact)
      paint(
        "panda-2",
        pandaX,
        pandaY + h * 0.07,
        pandaW * 1.12,
        pandaH * 0.88,
        switchP * (1 - exit),
      );
    if (!compact) {
      const leave = smooth(0, 0.38, p),
        leafScale = 1 - 0.2 * leave;
      paint(
        "leafs-left",
        -w * 0.28 - w * 1.2 * leave + driftX * 2,
        -h * 0.3 + h * 3 * leave + driftY * 2,
        h * 1.57 * leafScale,
        h * 1.5 * leafScale,
        1,
        -15 * leave,
      );
      paint(
        "leafs-right",
        w * 0.67 + w * 1.3 * leave - driftX * 2,
        -h * 0.3 + h * 1.9 * leave + driftY * 2,
        h * 1.31 * leafScale,
        h * 1.5 * leafScale,
        1,
        35 * leave,
      );
      const sweep = smooth(0, 0.5, p),
        frontW = Math.max(620, Math.min(980, w * 0.52));
      paint(
        "leafs-front",
        w * 0.1 - frontW * 1.5 * smooth(0, 0.95, p) + driftX * 2.8,
        -h * 0.25,
        frontW * (1 + 4.5 * sweep),
        frontW * 0.381 * (1 + 4.5 * sweep),
        1,
        -180 * smooth(0, 0.95, p),
      );
      const left = rise(0.22, 0.58, p, 3),
        right = rise(0.26, 0.56, p, 3),
        front = rise(0.32, 0.53, p, 4);
      paint(
        "flowers-left",
        -w * 0.04 + driftX * 1.9,
        -h * 0.05 - (1 - left) * h * 0.95,
        h * 0.714,
        h * 0.85,
      );
      paint(
        "flowers-right",
        w - h * 0.793 + w * 0.08 - driftX * 2,
        -h * 0.1 - (1 - right) * h * 1.05,
        h * 0.793,
        h * 0.9,
      );
      paint(
        "flowers-front",
        -w * 0.05 + driftX * 2.6,
        -h * 0.1 - (1 - front) * h * 1.3,
        h * 0.81,
        h * 0.3,
      );
      const fishAlpha = smooth(0.77, 0.94, p);
      if (fishAlpha > 0.01)
        for (let i = 0; i < 6; i++) {
          const travel = (time * (0.027 + i * 0.003) + i * 0.19) % 1;
          const dir = i % 2 === 0 ? 1 : -1;
          const x =
            (dir === 1 ? travel : 1 - travel) * w * 1.4 -
            w * 0.2 +
            px * (20 + i * 4);
          const y =
            h * (0.12 + ((0.13 * i) % 0.65)) +
            Math.sin(time * 0.4 + i) * h * 0.045 +
            py * 12;
          const fw = w * (0.09 + (i % 3) * 0.018);
          paint(
            "fish" + ((i % 3) + 1),
            x,
            y,
            fw,
            fw * 0.34,
            fishAlpha * 0.7,
            Math.sin(time * 0.3 + i) * 5,
            dir < 0,
          );
        }
    }
    renderer.end();
    host.dataset.frameCount = String(++count);
    host.dataset.progress = progress.toFixed(4);
    host.dataset.scene = p < 0.35 ? "jungle" : p < 0.82 ? "meadow" : "sky";
    host.dataset.pointerX = px.toFixed(3);
    host.dataset.pointerY = py.toFixed(3);
  }
  function tick(now: number) {
    if (disposed || !visible || paused || reduced) return;
    frame = requestAnimationFrame(tick);
    if (now - lastDraw < 32) return;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    lastDraw = now;
    time += dt;
    const scrolling = Math.abs(progress - target) > 0.001;
    progress += (target - progress) * 0.1;
    px += (tx - px) * 0.075;
    py += (ty - py) * 0.075;
    actors.forEach((a, key) => {
      if (!scrolling || key.startsWith("panda") || key.startsWith("fish"))
        a.state.update(dt);
    });
    draw();
  }
  function play() {
    cancelAnimationFrame(frame);
    last = 0;
    if (!disposed && visible && !paused && !reduced)
      frame = requestAnimationFrame(tick);
  }
  const observer = new ResizeObserver(draw);
  observer.observe(host);
  const ready = assets.loadAll().then(() => {
    if (disposed) {
      assets.dispose();
      return;
    }
    for (const file of files) {
      const json = assets.require(file + ".json");
      const atlas = file.startsWith("fish")
        ? "fishes.atlas"
        : file === "leafs-left"
          ? "leafs-left-web.atlas"
          : file + ".atlas";
      const data = new SkeletonJson(
        new AtlasAttachmentLoader(assets.require(atlas)),
      ).readSkeletonData(json);
      const skeleton = new Skeleton(data),
        state = new AnimationState(new AnimationStateData(data));
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
  draw();
  play();
  return {
    ready,
    setProgress(value: number) {
      target = clamp(value);
      if (paused || reduced) {
        progress = target;
        draw();
      }
    },
    setPointer(x: number, y: number) {
      tx = Math.max(-1, Math.min(1, x));
      ty = Math.max(-1, Math.min(1, y));
      if (paused && !reduced) {
        px = tx;
        py = ty;
        draw();
      }
    },
    setPaused(value: boolean, reduce: boolean) {
      paused = value;
      reduced = reduce;
      if (reduced) {
        progress = 0;
        px = 0;
        py = 0;
      }
      draw();
      play();
    },
    setVisible(value: boolean) {
      visible = value;
      host.dataset.visible = String(value);
      if (value) draw();
      play();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      assets.dispose();
      renderer.dispose();
      backdrop?.dispose();
      canvas.remove();
    },
  };
}
