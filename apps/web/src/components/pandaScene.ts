import * as THREE from "three";
import type { PandaMood } from "@setu/api-contracts";

export function createPandaScene(
  host: HTMLElement,
  initialMood: PandaMood,
  initialPaused: boolean,
) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 30);
  camera.position.set(0, 1.55, 7.1);
  camera.lookAt(0, 1.25, 0);
  scene.add(new THREE.HemisphereLight(0xfffdf1, 0xa7bfac, 2.6));
  const key = new THREE.DirectionalLight(0xfff6df, 3.1);
  key.position.set(-3, 5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -2;
  key.shadow.normalBias = 0.025;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc9ede1, 1.5);
  fill.position.set(4, 2, 3);
  scene.add(fill);
  const white = new THREE.MeshPhysicalMaterial({
    color: 0xfffdf2,
    roughness: 0.9,
    sheen: 0.8,
    sheenColor: new THREE.Color(0xffffff),
  });
  const black = new THREE.MeshPhysicalMaterial({
    color: 0x24312d,
    roughness: 0.8,
    sheen: 0.4,
  });
  const innerEar = new THREE.MeshStandardMaterial({
    color: 0x52655a,
    roughness: 1,
  });
  const teal = new THREE.MeshStandardMaterial({
    color: 0x148b71,
    roughness: 0.85,
  });
  const eyeWhite = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
  });
  const pupilMaterial = new THREE.MeshStandardMaterial({
    color: 0x101d19,
    roughness: 0.13,
  });
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 24);
  const rig = new THREE.Group();
  scene.add(rig);
  function ellipsoid(
    parent: THREE.Object3D,
    material: THREE.Material,
    position: [number, number, number],
    scale: [number, number, number],
  ) {
    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const body = new THREE.Group();
  rig.add(body);
  ellipsoid(body, black, [0, 0.83, 0], [0.72, 0.86, 0.54]);
  ellipsoid(body, white, [0, 0.82, 0.38], [0.51, 0.64, 0.2]);
  ellipsoid(body, black, [-0.43, 0.12, 0.3], [0.35, 0.23, 0.45]);
  ellipsoid(body, black, [0.43, 0.12, 0.3], [0.35, 0.23, 0.45]);
  const head = new THREE.Group();
  head.position.y = 1.98;
  body.add(head);
  ellipsoid(head, white, [0, 0, 0], [0.82, 0.73, 0.66]);
  const ears = [-1, 1].map((side) => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.59, 0.5, -0.02);
    head.add(ear);
    ellipsoid(ear, black, [0, 0, 0], [0.24, 0.27, 0.15]);
    ellipsoid(ear, innerEar, [0, 0, 0.12], [0.13, 0.16, 0.04]);
    return ear;
  });
  const eyes: THREE.Group[] = [],
    pupils: THREE.Mesh[] = [],
    brows: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const patch = ellipsoid(
      head,
      black,
      [side * 0.31, 0.075, 0.573],
      [0.225, 0.28, 0.062],
    );
    patch.rotation.z = side * -0.25;
    const eye = new THREE.Group();
    eye.position.set(side * 0.305, 0.09, 0.63);
    head.add(eye);
    eyes.push(eye);
    ellipsoid(eye, eyeWhite, [0, 0, 0], [0.095, 0.117, 0.048]);
    const pupil = ellipsoid(
      eye,
      pupilMaterial,
      [side * -0.014, 0.005, 0.044],
      [0.056, 0.075, 0.026],
    );
    pupils.push(pupil);
    ellipsoid(pupil, eyeWhite, [0.26, 0.31, 0.8], [0.23, 0.2, 0.18]);
    const brow = ellipsoid(
      head,
      black,
      [side * 0.3, 0.4, 0.55],
      [0.13, 0.038, 0.035],
    );
    brows.push(brow);
  }
  ellipsoid(head, white, [-0.13, -0.22, 0.57], [0.24, 0.17, 0.12]);
  ellipsoid(head, white, [0.13, -0.22, 0.57], [0.24, 0.17, 0.12]);
  ellipsoid(head, black, [0, -0.17, 0.73], [0.12, 0.075, 0.065]);
  function line(
    points: [number, number, number][],
    radius: number,
    material: THREE.Material,
    parent: THREE.Object3D,
  ) {
    const path = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(path, 18, radius, 7, false),
      material,
    );
    parent.add(mesh);
    return mesh;
  }
  const smile = line(
    [
      [-0.16, -0.29, 0.665],
      [0, -0.36, 0.69],
      [0.16, -0.29, 0.665],
    ],
    0.018,
    black,
    head,
  );
  const calm = line(
    [
      [-0.14, -0.33, 0.68],
      [0, -0.35, 0.69],
      [0.14, -0.33, 0.68],
    ],
    0.016,
    black,
    head,
  );
  const concern = line(
    [
      [-0.13, -0.35, 0.68],
      [0, -0.32, 0.69],
      [0.13, -0.35, 0.68],
    ],
    0.016,
    black,
    head,
  );
  const surprise = ellipsoid(
    head,
    black,
    [0, -0.35, 0.69],
    [0.045, 0.065, 0.013],
  );
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.62, 1.33, 0.05);
    body.add(arm);
    ellipsoid(arm, black, [0, -0.35, 0.07], [0.22, 0.48, 0.25]);
    return arm;
  });
  const scarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.085, 10, 40),
    teal,
  );
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 1.43, 0.08);
  body.add(scarf);
  const scarfTail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.43, 3), teal);
  scarfTail.position.set(0.3, 1.2, 0.52);
  scarfTail.rotation.z = -0.3;
  body.add(scarfTail);
  const badge = ellipsoid(body, teal, [0, 0.88, 0.585], [0.11, 0.11, 0.026]);
  line(
    [
      [-0.07, 0.88, 0.618],
      [-0.025, 0.88, 0.62],
      [0, 0.93, 0.62],
      [0.03, 0.83, 0.62],
      [0.055, 0.88, 0.62],
      [0.08, 0.88, 0.618],
    ],
    0.009,
    eyeWhite,
    body,
  );
  badge.castShadow = false;
  const book = new THREE.Group();
  book.position.set(0, 0.95, 0.72);
  book.rotation.x = -0.15;
  body.add(book);
  const cover = new THREE.MeshStandardMaterial({
    color: 0x7786b2,
    roughness: 0.9,
  });
  for (const side of [-1, 1]) {
    const page = new THREE.Group();
    page.rotation.y = side * -0.27;
    book.add(page);
    const outside = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.44, 0.055),
      cover,
    );
    outside.position.x = side * 0.17;
    page.add(outside);
    const paper = new THREE.Mesh(
      new THREE.BoxGeometry(0.305, 0.405, 0.03),
      eyeWhite,
    );
    paper.position.set(side * 0.17, 0, 0.04);
    page.add(paper);
    for (let i = 0; i < 3; i++)
      line(
        [
          [side * 0.05, 0.1 - i * 0.08, 0.063],
          [side * 0.28, 0.1 - i * 0.08, 0.063],
        ],
        0.005,
        innerEar,
        page,
      );
  }
  const garden = new THREE.Group();
  scene.add(garden);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0x7dae87,
    roughness: 1,
  });
  for (const side of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const leaf = ellipsoid(
        garden,
        leafMaterial,
        [side * (1.0 + i * 0.14), 0.2 + i * 0.16, -0.27 - i * 0.1],
        [0.07 + i * 0.015, 0.43 + i * 0.06, 0.17],
      );
      leaf.rotation.z = side * (0.3 + i * 0.25);
    }
  const butterfly = new THREE.Group();
  scene.add(butterfly);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xb9a8d9,
    roughness: 0.8,
  });
  const wings = [-1, 1].map((side) => {
    const wing = new THREE.Group();
    butterfly.add(wing);
    ellipsoid(wing, wingMat, [side * 0.11, 0.02, 0], [0.13, 0.18, 0.025]);
    ellipsoid(wing, wingMat, [side * 0.08, -0.12, 0], [0.09, 0.09, 0.02]);
    return wing;
  });
  ellipsoid(butterfly, black, [0, -0.015, 0], [0.025, 0.12, 0.025]);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1.7, 64),
    new THREE.MeshStandardMaterial({ color: 0xe8f2e4, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  scene.add(floor);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.1 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.125;
  shadow.receiveShadow = true;
  scene.add(shadow);

  let mood = initialMood,
    paused = initialPaused,
    visible = true,
    disposed = false;
  let animation = 0,
    elapsed = 0,
    entered = 0,
    previous = 0,
    lastDraw = 0,
    frames = 0;
  const pointer = { x: 0, y: 0 },
    look = { x: 0, y: 0 };
  const mix = THREE.MathUtils.lerp;
  function draw(time: number, smooth: boolean) {
    const lerp = (a: number, b: number) => (smooth ? mix(a, b, 0.11) : b);
    const quiet = mood === "concerned" || paused;
    const breathe = quiet ? 0 : Math.sin(time * 1.8) * 0.012;
    body.scale.y = 1 + breathe;
    body.rotation.x = lerp(body.rotation.x, mood === "listening" ? 0.035 : 0);
    body.position.y =
      mood === "celebrate" && time - entered < 0.9 && !quiet
        ? Math.sin(((time - entered) / 0.9) * Math.PI) * 0.075
        : 0;
    rig.rotation.y = lerp(rig.rotation.y, -0.08 + pointer.x * 0.045);
    look.x = lerp(look.x, pointer.x);
    look.y = lerp(look.y, pointer.y);
    const tilt =
      mood === "curious"
        ? -0.17
        : mood === "thinking"
          ? 0.11
          : mood === "happy"
            ? -0.06
            : 0;
    head.rotation.z = lerp(
      head.rotation.z,
      tilt + (quiet ? 0 : Math.sin(time * 0.75) * 0.025),
    );
    head.rotation.x = lerp(
      head.rotation.x,
      (mood === "reading"
        ? 0.22 + (quiet ? 0 : Math.sin(time * 1.4) * 0.018)
        : mood === "thinking" || mood === "curious"
          ? -0.09
          : mood === "listening"
            ? 0.07
            : 0) +
        look.y * 0.05,
    );
    head.rotation.y = lerp(
      head.rotation.y,
      look.x * 0.16 +
        (mood === "curious" ? 0.13 : 0) +
        (quiet ? 0 : Math.sin(time * 0.4) * 0.035),
    );
    const phase = time % 5.1;
    const blink =
      !quiet && phase > 4.65 && phase < 4.93
        ? Math.max(0.08, Math.abs((phase - 4.79) / 0.14))
        : 1;
    eyes.forEach((eye) => {
      eye.scale.y =
        mood === "resting" ? 0.08 : blink * (mood === "happy" ? 0.88 : 1);
    });
    pupils.forEach((p, i) => {
      p.position.x = (i ? -0.014 : 0.014) + look.x * 0.022;
      p.position.y =
        0.005 -
        look.y * 0.026 +
        (mood === "thinking" || mood === "curious"
          ? 0.035
          : mood === "reading"
            ? -0.033
            : 0);
    });
    brows.forEach((b, i) => {
      b.rotation.z =
        mood === "concerned"
          ? i
            ? -0.22
            : 0.22
          : mood === "curious"
            ? i
              ? 0.1
              : -0.1
            : 0;
      b.position.y = mood === "curious" ? 0.43 : 0.4;
    });
    ears.forEach((ear, i) => {
      ear.rotation.z = mood === "listening" ? (i ? -0.1 : 0.1) : 0;
    });
    let left = -0.15,
      right = 0.15;
    if (mood === "welcome")
      right = 2.15 + (quiet ? 0 : Math.sin(time * 5.2) * 0.22);
    if (mood === "thinking") right = -2.35;
    if (mood === "reading") {
      left = 0.68;
      right = -0.68;
    }
    if (mood === "celebrate") {
      left = -2.3;
      right = 2.3;
    }
    arms[0].rotation.z = lerp(arms[0].rotation.z, left);
    arms[1].rotation.z = lerp(arms[1].rotation.z, right);
    arms.forEach((arm, i) => {
      const thinkingPaw = mood === "thinking" && i === 1;
      arm.position.z = lerp(
        arm.position.z,
        thinkingPaw ? 0.57 : mood === "reading" ? 0.4 : 0.05,
      );
      arm.scale.y = lerp(arm.scale.y, thinkingPaw ? 0.75 : 1);
      arm.rotation.x = lerp(
        arm.rotation.x,
        thinkingPaw ? 0.35 : mood === "reading" ? -0.6 : 0,
      );
    });
    smile.visible = ["welcome", "happy", "celebrate", "reading"].includes(mood);
    calm.visible = ["idle", "thinking", "resting", "listening"].includes(mood);
    concern.visible = mood === "concerned";
    surprise.visible = mood === "curious";
    book.visible = mood === "reading";
    butterfly.visible = ["curious", "idle", "welcome"].includes(mood);
    butterfly.position.set(
      0.94 + (quiet ? 0 : Math.sin(time * 0.55) * 0.24),
      2.51 + (quiet ? 0 : Math.cos(time * 0.85) * 0.13),
      0.1,
    );
    wings.forEach((wing, i) => {
      wing.rotation.y =
        (i ? 1 : -1) * (quiet ? 0.4 : 0.4 + Math.sin(time * 8) * 0.6);
    });
    garden.rotation.z = quiet ? 0 : Math.sin(time * 0.55) * 0.017;
    renderer.render(scene, camera);
    host.dataset.frameCount = String(++frames);
  }
  function tick(now: number) {
    if (disposed || !visible || paused) return;
    animation = requestAnimationFrame(tick);
    if (now - lastDraw < 32) return;
    elapsed += previous ? Math.min((now - previous) / 1000, 0.08) : 0;
    previous = now;
    lastDraw = now;
    draw(elapsed, true);
  }
  function play() {
    cancelAnimationFrame(animation);
    previous = 0;
    if (!paused && visible && !disposed)
      animation = requestAnimationFrame(tick);
  }
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || disposed) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw(elapsed, false);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  draw(0, false);
  play();
  return {
    setMood(value: PandaMood) {
      if (disposed) return;
      if (mood === value) return;
      mood = value;
      entered = elapsed;
      if (paused) draw(elapsed, false);
    },
    setPaused(value: boolean) {
      if (disposed) return;
      paused = value;
      if (paused) {
        cancelAnimationFrame(animation);
        pointer.x = pointer.y = 0;
        draw(elapsed, false);
      } else play();
    },
    setVisible(value: boolean) {
      if (disposed) return;
      visible = value;
      if (!value) cancelAnimationFrame(animation);
      else {
        draw(elapsed, false);
        play();
      }
    },
    lookAt(x: number, y: number) {
      if (disposed) return;
      if (!paused) {
        pointer.x = THREE.MathUtils.clamp(x, -1, 1);
        pointer.y = THREE.MathUtils.clamp(y, -1, 1);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(animation);
      observer.disconnect();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const m = object.material;
          (Array.isArray(m) ? m : [m]).forEach((material) =>
            materials.add(material),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
