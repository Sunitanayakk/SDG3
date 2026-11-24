# Panda reference implementation

Inspected [Bambuk Studio](https://bambukstudio.com/) in Chrome on 24 November
2026 after website permission was granted. The earlier geometric panda has been
replaced. The web renderer now plays the reference's actual artwork, texture
atlases, weighted meshes and authored keyframes using a compatible Spine 4.1
runtime. These assets are third-party Bambuk artwork, not original Setu artwork.

## Exact authored panda animations

| Scene | Original files | Animation | Duration | Bones / slots | Animated channels |
| --- | --- | --- | --- | --- | --- |
| Jungle / leaf crown | panda-1.json, panda-1.atlas, panda-1.avif | idle-panda | 20 seconds | 101 / 34 | 66 |
| Meadow / bow tie and butterfly | panda-2.json, panda-2.atlas, panda-2.avif | idle_panda | 20 seconds | 43 / 17 | 44 |

The complete, machine-readable catalogue is
**artifacts/panda-motion-inventory.json**. It enumerates every animated target,
timeline channel, keyframe count and keyframe time from both panda rigs and the
six included scenery rigs. The original JSON files retain all curves and mesh
deformations, so movement is played from source data rather than approximated
with CSS or a geometric character.

Visible details include natural eyelid/blink changes, muzzle and mouth movement,
gaze and head changes, ear movement, breathing/posture, crown/leaf/feather sway
and the second panda's butterfly movement. The underlying inventory is the
authoritative list; bone names are not interpreted as a claim of human emotion.
The source has two panda idle clips, not ten independent emotion clips.

## Scene and interface behavior

- The original forest/sky background, moving right/front leaves and four flower
  layers accompany the two pandas. The gallery can hide scenery for a clean
  character view. SDG3's camera framing, layer placement and healthcare layout
  are its own composition; the entire Bambuk website is not a pixel-identical
  clone.
- `/app/companion` has both source scenes, pause/resume and a keyboard-accessible
  0–19.95 second scrubber. Scrubbing pauses the loop; Resume restores playback.
- Homepage scroll chapters transition from jungle to meadow. Normal browser
  scrolling remains available.
- Web chat / passport / checklist avatars use animated WebP rendered from those
  same rigs. Existing activity labels (listening, thinking, success, etc.)
  describe application state; they do not invent additional source expressions.
- Android uses GIF exports of the same original loops. GIF support was already
  enabled in the native project. Small exports are sampled at 10 fps and retain
  a 20-second duration; the large web scene renders the original rig near 30 fps.

## Accessibility and lifecycle

- OS and app reduced-motion preferences select stills / static rig frames.
- Explicit pause controls stop animation. Urgent messages use a still avatar.
- Text-only mode removes decorative images and does not request the 3D/rig assets.
- Offscreen / hidden-tab web rendering stops; compact avatars switch to stills.
  Native avatars switch to a still when the app is inactive or motion is paused.
- Failed GPU initialization or context loss retains a real panda PNG, not the
  previous vector drawing. No camera, microphone or audio starts automatically.
- Unmount cancels animation frames, disconnects observers and releases loaded
  textures / render resources. Pending loads are cleaned after completion.

## Provenance and validation

The source manifest at **apps/web/public/panda-reference/source-manifest.json**
records the 25 original asset URLs and SHA-256 fingerprints. The six panda
rig/atlas/texture files were byte-compared with their downloaded originals.
Run `node scripts/check-panda-media.cjs` to verify all recorded source hashes.

Posters and small animated WebP/GIF files are rendered exports of these rigs,
not source files. The web exports are 160×176; Android exports are 192×211. Each
contains 200 frames at 100 ms per frame. Original-resolution textures remain
available to the full web renderer.

Artwork attribution and the runtime license are retained in
**apps/web/public/panda-reference/CREDITS.txt** and
**SPINE-RUNTIME-LICENSE.txt**. No separate redistribution license for Bambuk's
artwork was supplied or verified. Spine runtime distribution must comply with
its license; a working local evaluation does not establish distribution rights.

Executed checks, screenshots, video and current APK details are in
**VALIDATION.md**. Physical Android device QA remains unverified.
