const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../apps/web/public/panda-reference");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "source-manifest.json")));
const clips = [];
for (const { file } of manifest.assets.filter((a) => a.file.endsWith(".json"))) {
  const data = JSON.parse(fs.readFileSync(path.join(root, file)));
  for (const [animation, timelines] of Object.entries(data.animations)) {
    const channels = [];
    function walk(node, keys) {
      if (Array.isArray(node) && node.length && node.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
        channels.push({ target: keys.join("/"), keyframes: node.length, times: node.map((v) => v.time || 0) });
        return;
      }
      if (node && typeof node === "object")
        for (const [key, value] of Object.entries(node)) walk(value, [...keys, key]);
    }
    walk(timelines, []);
    clips.push({
      file,
      animation,
      spineVersion: data.skeleton.spine,
      bones: data.bones.length,
      slots: data.slots.length,
      duration: Math.max(0, ...channels.flatMap((c) => c.times)),
      channels,
    });
  }
}
fs.writeFileSync(path.resolve(__dirname, "../artifacts/panda-motion-inventory.json"), JSON.stringify({ source: manifest.source, captured: manifest.captured, lastInspected: manifest.lastInspected, clips }, null, 2) + "\n");
console.log(JSON.stringify({ rigs: new Set(clips.map((c) => c.file)).size, clips: clips.map((c) => ({ file: c.file, animation: c.animation, duration: c.duration, channels: c.channels.length })) }));
