# Full viewport reference experience — 2026-11-25

Inspected [Bambuk Studio](https://bambukstudio.com/) in Chrome on 24 and 25
November 2026. The homepage now recreates the full viewport forest composition,
entry reveal, scroll journey and pointer interactions around SDG3 content. It
replaces the earlier white card layout. The original artwork, texture atlases,
weighted meshes and authored keyframes play through a compatible Spine 4.1
runtime. These assets are third-party Bambuk artwork, not original Setu artwork.

## Full page motion

| Element | Implemented behavior |
| --- | --- |
| Entry | Green branded loading screen, source muted intro texture, timed exit and staggered heading reveal; Skip and Escape work |
| Forest | Original forest/sky image across four viewport heights, zoom, vertical pan and subtle WebGL heat haze |
| Desktop scroll | Five viewport scroll distance within a six viewport section; native scrolling drives a pinned full screen |
| Side foliage | Original left and right rigs move outward and upward with separate rotation and scale |
| Foreground foliage | Original front rig enlarges and rotates; two source leaf images sweep diagonally with increasing blur |
| Panda | Original loops remain intact; initial shrink, crossfade to butterfly scene, later growth and exit |
| Flowers | Four original rigs rise in staggered layers at 0.15, 0.22, 0.26 and 0.32 scroll progress, with increasing ease powers |
| Blue scene | Original fish rigs swim on independent paths, with their authored tail movement |
| Mouse | Eased dot/ring cursor, expanded control hover, magnetic button text and different depth shifts across scenery |
| Interface | Full screen green navigation, clipped text reveals and section entry transitions; linked healthcare tools |

The source's composition and scroll behavior were inspected, then implemented
in SDG3-owned React, CSS and WebGL code. No downloaded vendor JavaScript is
executed or included. Website branding, copy, feature sections and routes remain
SwasthyaSetu's; this does not claim every Bambuk page or device frame is pixel
identical. Mobile layouts intentionally use a shorter, lighter scene rather
than the desktop pinned journey.

## Exact authored panda animations

| Scene | Original files | Animation | Duration | Bones / slots | Animated channels |
| --- | --- | --- | --- | --- | --- |
| Jungle / leaf crown | panda-1.json, panda-1.atlas, panda-1.avif | idle-panda | 20 seconds | 101 / 34 | 66 |
| Meadow / bow tie and butterfly | panda-2.json, panda-2.atlas, panda-2.avif | idle_panda | 20 seconds | 43 / 17 | 44 |

The complete, machine-readable catalogue is
**artifacts/panda-motion-inventory.json**. It enumerates every animated target,
timeline channel, keyframe count and keyframe time from both panda rigs and the
ten included scenery rigs. The original JSON files retain all curves and mesh
deformations, so movement is played from source data rather than approximated
with CSS or a geometric character.

Visible details include natural eyelid/blink changes, muzzle and mouth movement,
gaze and head changes, ear movement, breathing/posture, crown/leaf/feather sway
and the second panda's butterfly movement. The underlying inventory is the
authoritative list; bone names are not interpreted as a claim of human emotion.
The source has two panda idle clips, not ten independent emotion clips.

## Scene and interface behavior

- The original forest/sky background, all three foliage rigs, four flower rigs
  and three fish rigs accompany the two pandas in the landing journey. The
  gallery can hide scenery for a clean character view.
- `/app/companion` has both source scenes, pause/resume and a keyboard-accessible
  0–19.95 second scrubber. Scrubbing pauses the loop; Resume restores playback.
- Homepage scroll chapters transition from jungle through meadow to the blue
  fish scene. Normal browser scrolling remains available.
- Web chat / passport / checklist avatars use animated WebP rendered from those
  same rigs. Existing activity labels (listening, thinking, success, etc.)
  describe application state; they do not invent additional source expressions.
- Android uses GIF exports of the same original loops. GIF support was already
  enabled in the native project. Small exports are sampled at 10 fps and retain
  a 20-second duration; the large web scene renders the original rig near 30 fps.

## Accessibility and lifecycle

- OS and app reduced-motion preferences skip the entry and pinned journey,
  retain a static forest/panda and disable pointer motion.
- Pause ambient motion stops automatic poses, fish travel, haze and particles.
  Manual scrolling and pointer repositioning remain available. Urgent messages
  use a still avatar.
- Text-only mode removes decorative images and does not request the 3D/rig assets.
- Offscreen / hidden-tab web rendering stops; compact avatars switch to stills.
  Native avatars switch to a still when the app is inactive or motion is paused.
- Failed GPU initialization or context loss retains a real panda PNG, not the
  previous vector drawing. No camera, microphone or audio starts automatically.
- Unmount cancels animation frames, disconnects observers and releases loaded
  textures / render resources. Pending loads are cleaned after completion.

## Provenance and validation

The source manifest at **apps/web/public/panda-reference/source-manifest.json**
records 36 original asset URLs and SHA-256 fingerprints. The six panda
rig/atlas/texture files were byte-compared with their downloaded originals.
Run `node scripts/check-panda-media.cjs` to verify all recorded source hashes.
Run `node scripts/inventory-panda-motion.cjs` to regenerate all twelve rigs'
timeline inventories directly from the recorded original JSON files.

The left foliage source texture is KTX2. The official Three.js 0.180.0 Basis
transcoder decoded it to RGBA32; a lossless WebP preserves all 3592×2244 decoded
RGBA pixels. The compatible atlas changes only the texture filename. Both
original files remain recorded and unchanged. Texture uploads premultiply alpha
once to match the scene's blending and transparent canvas composition.

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
