# Setu panda motion study

Reference: [Bambuk Studio](https://bambukstudio.com/), inspected in Chrome on
24 November 2026. The study covers the homepage forest and meadow panda scenes,
their scroll transition, project panels and footer. About/Culture/project detail
pages and every possible frame of the animation loops were not audited. Exact
source easing, rig settings and event bindings are not available from visual
inspection.

## Observed reference motions and expressions

| # | Scene / detail | What was observed | SDG3 adaptation |
| --- | --- | --- | --- |
| 1 | Forest panda eyes | Brief closed-eye blink amid open-eyed idle frames | Periodic eyelid blink, also available in the vector companion |
| 2 | Forest head | Small turns and changes in head angle | Smoothed head yaw, pitch and pose-specific tilt |
| 3 | Forest gaze | Eye direction changes across sampled frames | Small pupil movement; local pointer following in SDG3 |
| 4 | Forest expression | Soft smile / muzzle variations | Separate calm, smiling, curious and concerned mouth shapes |
| 5 | Forest posture | Gentle upper-body idle movement | Low-amplitude breathing and head sway |
| 6 | Forest styling | Leaf crown and surrounding foliage give layered depth | Original teal scarf, pulse badge and small sage garden |
| 7 | Forest atmosphere | Small floating light particles | Sparse floating decorative marks, independently stoppable with scene pause |
| 8 | Scene transition | Foreground leaves cross and blur as the view changes | Native-scroll chapters with a sticky character; no scroll interception |
| 9 | Meadow setting | Sky, flowers and a flower bow tie replace the jungle scene | A light sage environment that suits the existing white healthcare UI |
| 10 | Meadow gaze / pose | Panda looks upward with changing head angles | Curious pose looks up toward a small original butterfly |
| 11 | Meadow butterfly | Butterfly movement and wing flutter near the panda | A slow curved orbit and alternating wing motion |
| 12 | Meadow face | Blinks and gentle expression changes continue | Shared blink / face system across all applicable poses |
| 13 | Project sections | Animated butterfly, robot, bee and space imagery accompany editorial panels | Three health-access chapters: understand, communicate, prepare |
| 14 | Lower homepage | Service typography, company grid, large eye image and dark green footer | Existing SDG3 service content remains; added companion links and gallery |

The reference panda's gaze changed during pointer exploration, but a causal
pointer-tracking rule was **not established**. SDG3's pointer behavior is our own
explicit interaction. No nose-click reaction, exact loop duration, skeletal
animation or emotion-recognition capability is attributed to the reference.

## Implemented Setu expressions

Setu is an original procedural soft-toy-style panda. No Bambuk models, textures,
videos, audio or source code are bundled. This is an adaptation of the motion
language, with a different character and healthcare-specific behavior.

| Pose | Web 3D motion / expression | Where it is used |
| --- | --- | --- |
| At ease | Breathing, blinking and quiet sway | Passport before saving; expression gallery |
| A warm hello | Raised right paw, gentle wave and smile | Homepage, empty chat, native home |
| Curious | Tilted head, lifted gaze, small round mouth and butterfly | Expression gallery |
| Listening | Slight forward lean, attentive eyes and relaxed mouth | Focused chat composer; communication chapter |
| Thinking | Paw toward chin, upward glance and a small head tilt | Pending chat response |
| Reading | Open book, lowered gaze and subtle reading nod | Library chapter; unfinished visit checklist |
| Glad to help | Soft smile, relaxed arms and bright eyes | Reply available; preparation chapter; partial checklist |
| A small success | Raised paws and one short, gentle bounce | Expression gallery; saved passport / finished checklist use compact poses |
| Here for you | Still posture, attentive brows and neutral concern | Chat error or an emergency-classified response |
| Taking a breath | Closed eyes and relaxed posture | Expression gallery |

The compact web SVG and native SVG versions share pose names and simplified
visual cues. They do not reproduce the full 3D rig, butterfly, pointer following
or all joint movements. Native adds a small breathing lift and a single success
bounce, stops in the background and has a dedicated expression screen.

Poses reflect **interface activity**. They do not infer patient emotions,
diagnosis, recovery or treatment success. Success is reserved for actions such as
saving preferences or completing preparation tasks. Urgent guidance takes
priority over pending/focus/reply expressions.

## Motion and accessibility rules

- Web: lazy-loaded Three.js scene, original geometry, soft lighting/shadows,
  capped device pixel ratio (1.6) and a target of approximately 30 rendered fps.
- Idle breathing is small; blinks occur about every 5.1 seconds. The welcome paw
  wave is gentle. Success has a single 0.9-second lift rather than repeated hops.
  Pointer changes interpolate instead of snapping. These are SDG3 timings.
- Each full scene has a keyboard-accessible pause control. OS/app reduced-motion
  preferences render static poses; manual play cannot override them. Changing
  poses still works. Decorative SVG animations also stop under these settings.
- Offscreen / hidden-tab 3D scenes stop rendering. Unmount disconnects observers,
  cancels frames and disposes mesh/material/renderer resources.
- Unavailable WebGL, failed scene loading or lost GPU context uses a vector
  fallback. Text-only mode removes decorative characters and avoids a 3D canvas.
- Chapter links and expression buttons work with keyboard and touch. Narrow
  screens use normal document flow. Native scrolling is never hijacked.
- Screen-reader text describes the selected expression; compact decorative
  characters are hidden. No sound, microphone or camera starts automatically.
- Pointer coordinates are transient local animation inputs and are not saved or
  sent to the backend.

## Files and review paths

- `/app/companion`: all ten expressions, descriptions and motion control.
- Homepage: welcome scene and three scroll chapters.
- Chat: composer focus, pending request, reply, error and urgent-message states.
- Passport / Visit Planner: compact reactions to real local actions.
- Native `/companion`: lightweight expression gallery linked from home.
- `apps/web/src/components/pandaScene.ts`: geometry, rig and render lifecycle.
- `apps/web/src/components/PandaStage.tsx`: lazy loading, visibility, fallback,
  motion preferences and controls.
- `packages/api-contracts/src/companion.ts`: shared pose metadata and chat rules.
- `apps/mobile/components/Panda.tsx`: native lightweight companion.

Executed verification and artifact references are recorded in `VALIDATION.md`.
Physical Android device performance and every reference-site animation frame
remain unverified.
