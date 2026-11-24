const fs = require("node:fs");
const path = require("node:path");
const source = path.resolve(__dirname, "../apps/web/public/panda-reference");
const destination = path.resolve(__dirname, "../apps/mobile/assets/panda");
fs.mkdirSync(destination, { recursive: true });
for (const file of [
  "jungle-poster.png",
  "jungle-motion.gif",
  "meadow-poster.png",
  "meadow-motion.gif",
  "CREDITS.txt",
  "SPINE-RUNTIME-LICENSE.txt",
])
  fs.copyFileSync(path.join(source, file), path.join(destination, file));
console.log("Synchronized the native panda animation assets.");
