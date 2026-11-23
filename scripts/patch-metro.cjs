// Metro in Expo SDK 54 passed filenames to image-size v1. The patched v2 parser
// accepts bytes only. Read the same trusted local asset first; retain the secure
// parser version instead of downgrading it. Reapplied reproducibly by npm ci.
const fs = require("node:fs");
const path = require("node:path");
const target = path.resolve(__dirname, "../node_modules/metro/src/Assets.js");
const before =
  "const dimensions = isImage ? (0, _imageSize.default)(isImageInput) : null;";
const after =
  'const dimensions = isImage ? (0, _imageSize.default)(typeof isImageInput === "string" ? _fs.default.readFileSync(isImageInput) : isImageInput) : null;';
if (fs.existsSync(target)) {
  const source = fs.readFileSync(target, "utf8");
  if (source.includes(before))
    fs.writeFileSync(target, source.replace(before, after));
  else if (!source.includes(after))
    throw new Error(
      "Metro asset API changed: review the image-size compatibility patch.",
    );
}
