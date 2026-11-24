const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../apps/web/public/panda-reference");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "source-manifest.json")),
);
const mismatches = [];
for (const asset of manifest.assets) {
  const file = path.join(root, asset.file);
  if (
    !fs.existsSync(file) ||
    crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") !==
      asset.sha256
  )
    mismatches.push(asset.file);
}
console.log(
  JSON.stringify({
    originalAssetsChecked: manifest.assets.length,
    originalHashesMatch: mismatches.length === 0,
    mismatches,
  }),
);
if (mismatches.length) process.exitCode = 1;
