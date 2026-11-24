# Panda companion and motion study — 2026-11-24

Inspected the Bambuk Studio homepage forest and meadow panda scenes in Chrome.
The motion catalogue and limits of that visual audit are in `MOTION_STUDY.md`.
Implemented an original Three.js character, ten selectable poses, scroll
chapters, pointer-following gaze, web chat and task reactions, and a lightweight
native SVG companion / expression screen.

Executed on the final source:

| Check | Result |
| --- | --- |
| Shared contracts Vitest | 53 passed |
| Web Vitest | 7 passed |
| Native Jest | 7 passed |
| Chrome acceptance | 14 passed |
| Workspace TypeScript / web and native ESLint | Passed |
| Web production build | Passed |
| Native arm64 standalone demo APK build | Passed |
| APK v2 signature / embedded bundle | Verified |
| Configured server credentials in built clients / source candidates | No matches |

**81 client/shared regression tests passed.** The backend was not modified or
retested for this animation change. Earlier backend/provider results below are
historical evidence, not fresh execution in this run.

Chrome tests confirm real WebGL rendering, all ten pose selections, frame
cessation / resumption on pause, offscreen suspension, scroll-driven poses,
GPU-context-loss fallback, static OS reduced-motion poses, text-only canvas
removal, keyboard selection, chat state / emergency reactions, and passport /
checklist success reactions. Existing multilingual, admin, responsive and
access-tool workflows also pass. Narrow layouts include 320 pixels and enlarged
text. Tests use isolated synthetic browser state.

The admin viewport assertion now waits for chart resize completion with a bounded
poll. A 15-cycle diagnostic observed Recharts' previous SVG width briefly causing
806 px of document width at a 768 px viewport; it settled to 768 px within 150 ms.
The original immediate assertion intermittently sampled that intermediate frame.
No admin production CSS was changed; persistent overflow still fails the check.

Separately captured the real-mode local app in Chrome: all ten 3D poses rendered
with zero page errors. See `artifacts/companion-validation.json`,
`artifacts/setu-panda-*.png` and `artifacts/setu-motion-tour.webm`.
Desktop/mobile-viewport captures are not physical-device performance tests.

The separately loaded 3D chunk is approximately 552 kB minified / 138 kB gzip.
Vite reports a non-fatal large-chunk advisory; the scene is already dynamically
imported and text-only mode does not request it. Rollup removes two dependency
comment annotations from Zod; the build completes successfully.

Rebuilt the standalone Android demo with `scripts/build-android.ps1`:
`artifacts/SwasthyaSetu-AI-demo-arm64.apk`, 32,380,841 bytes, SHA-256
`DEAB94EAB5ED444B599D4AAAF374BF181A55CBA026CE5D176B400F327DFCA3B4`.
APK signing verification passed (v2) and the embedded app bundle is present.
Compared configured private server/admin credentials against the built web/APK
assets and 204 Git candidate files: no matches. The structured client result is
in `artifacts/client-secret-check.json`. Signing keys and APK remain ignored.

Android remains visibly labeled Demo Mode. No physical phone was connected;
physical-device performance and public hosting remain unverified. The local
real-mode website/API configuration was preserved.

---

# Greeting handling correction — 2026-11-24

Reproduced the exact live `hii` message returning an evidence refusal. The previous
code recognised only exact greetings such as `hi` and `hello`. Whole-turn
conversation handling now accepts common elongated spellings, punctuation,
greeting emoji, check-ins, help requests, thanks and farewells. English/Hindi/Odia
replies are supplied consistently in the backend and shared web/native demo.
These are application conversation replies, not generated medical information.

A greeting alone skips retrieval/inference and creates no citations. A greeting
followed by a health question stays intact for retrieval; emergency, restricted
and injection rules take priority. Both implementations run the same example
fixture, including negative cases such as `high blood pressure` and mixed turns.

Executed checks: **91 backend**, **50 shared-contract**, **7 web**, **6 native**
and **8 Chrome acceptance tests** passed (162 total). Typechecks, ESLint, Ruff,
web build and native APK build passed. Sent `hii` through the real browser/API:
HTTP 200, friendly welcome displayed, retrieval false and zero citations.
Evidence: artifacts/greeting-validation.json and artifacts/chat-greeting.png.
The owned local app was restarted so new requests use the fix immediately.

Refreshed standalone demo APK SHA-256: `C63109FE30D68DB2E1C25EAEF9718F71AFB5F0DB93B8F95BC1B49CB403EA7B8C`.
Older test totals and APK hashes below describe earlier builds.

---

# Accessibility redesign and chatbot repair — 2026-11-24

The white/teal web redesign and native light palette are implemented. Added the
Accessibility Passport, Communication Board, Visit Planner and Easy-read Library
on the web, plus a native Access Toolkit screen using shared data and logic.
These are functioning local workflows; no real appointment booking is claimed.

## Chatbot repair

Both local servers were stopped. In addition, NVIDIA no longer listed the old
nvidia/nemotron-3-embed-1b model. Its embedding request failed before inference.
MiniMax itself still worked (live provider smoke check: 2.37 seconds).

Replaced embeddings with nvidia/nemotron-3.5-embed-1b, confirmed HTTP 200 and 2048
returned dimensions, then reindexed all six reviewed guides. The existing database
shape is unchanged. Added three original WHO-based summaries reviewed today:
physical activity, healthy diet and hypertension. No patient records were added.

The full live workflow passed again in English, Hindi and Odia, including real
JWT authorization, retrieved citations, ownership, upload/index/delete, feedback
and all 14 safety-rule cases. See artifacts/live-validation.json. A real Chrome
sign-in and an answer citing the new WHO blood-pressure guide also passed; see
artifacts/live-web-validation.json. Provider speed/availability is not guaranteed.

The npm run dev launcher now starts both local services in Real Mode, waits for
API health and stops only processes it owns. Demo Mode runs without a backend.
The UI reports disconnected service status and offers the library/access tools.
Greeting replies explain app capabilities without inventing sources. Chat
read-aloud is directly available on each assistant response.

## Current executed checks

| Check | Result |
| --- | --- |
| Backend pytest | 47 passed |
| Shared contracts Vitest | 13 passed |
| Web Vitest | 7 passed |
| Native Jest | 6 passed |
| Chrome acceptance | 7 passed |
| TypeScript, web/native ESLint, backend Ruff | Passed |
| Web production build | Passed |
| Native arm64 standalone demo APK build | Passed |
| APK signature / embedded Hermes bundle | Verified |
| Configured server secrets in built clients | No matches |

**80 automated regression tests passed**, separate from live vendor checks.
The browser suite verifies passport opt-in storage/export, multilingual board
selection and temporary custom messages, large-message dialog, checklist
adaptation and persistence, library search/Odia reading/source links, old admin
workflows, widths 320–1920 and extra-large text at 320 pixels. Visual inspection
covered the white landing page and access toolkit. Native tests cover explicit
speech actions and opt-in access-data storage; OS speech/share boundaries are
not physical-device validation.

The updated APK is artifacts/SwasthyaSetu-AI-demo-arm64.apk (about 31 MiB).
SHA-256: 5F876A6A3461566D201A064E6964FB8304BDFB0E1453C68AE96BB5CD734DC2E4
It remains labeled Demo Mode. A live phone build needs a deployed HTTPS API.

## Practical limits

Passport/checklist storage is browser/device-local, opt-in and not encrypted.
Custom board messages are transient. Text export, printing and sharing happen
only on deliberate user action. Avoid personal medical data on shared devices.
Library summaries do not require the AI service, but the first page load still
requires connectivity. Offline installation/service-worker caching is not claimed.
Device voices vary, and Hindi/Odia phrase and medical translations require review.
The text board does not translate sign language. Visit plans request access
arrangements; they do not verify facilities or make appointments. Physical-device,
screen-reader and clinical evaluations and public hosting remain outstanding.

The sections below are historical results from 21 November, before this update.
Their older model, test totals, APK hash and remote-repository status are superseded.

---

# Executed verification — 2026-11-21

Windows / PowerShell, Node 22.19, Python 3.13.7, Expo SDK 54 / React Native 0.81.5.
These checks verify a healthcare education prototype using synthetic questions
and disposable test records. They do not establish clinical safety or efficacy.

## Connected backend and browser

- Supabase PostgreSQL connected with TLS. Alembic **002** is applied.
- Verified 13 application tables, pgvector 0.8.2, vector(2048), a halfvec cosine
  HNSW index, RLS on all application tables and no direct anon/authenticated CRUD.
- Created the explicitly requested administrator and granted the backend admin
  role. Verified Supabase password login and signed ES256 JWT authorization.
  Password is stored only in ignored backend/.env.admin.local; no email was sent.
- NVIDIA inference uses **minimaxai/minimax-m3.1-flash**, low reasoning effort,
  16384-token budget and a 90-second timeout without automatic retries.
- Hosted embeddings use **nvidia/nemotron-3-embed-1b**, native 2048 dimensions,
  with query/passage input types. No local Transformer runtime is needed.
- Three original summaries of official service-navigation sources are indexed;
  five official directory entries and 14 safety-case definitions are installed.
  No patient fixtures or invented analytics were seeded into the real database.
- Backend/web are in Real Mode. The mobile APK remains explicitly Demo Mode.

**artifacts/live-validation.json: all checks passed.** The executed workflow covers:

1. Real administrator sign-in; unauthenticated access denied; demo auth disabled.
2. Disposable patient cannot access administrator endpoints.
3. Official directory and approved, indexed source records.
4. Live English, Hindi and Odia retrieval, final answers and matching citations.
5. No conversation persistence without consent.
6. Emergency bypass in all three languages.
7. Unsupported fictional question returns no fabricated citations.
8. Consented history is owner-scoped, with unauthorized access/deletion denied.
9. Real upload, hosted embedding, indexing and document deletion.
10. Preference round trip, feedback submission and administrator feedback view.
11. Resource creation/deletion and execution of all 14 safety-rule cases.
12. Disposable Auth user and temporary records cleaned up.

Initial Hindi/Odia inference requests timed out. Low reasoning effort and a bounded
90-second provider timeout allowed the final multilingual run to pass. Translation
quality remains unvalidated, and hosted-provider latency/quota failures are still
possible. Errors are explicit; no demo response substitutes for a failed real call.

**artifacts/live-web-validation.json: all three Chrome checks passed:** actual
Supabase administrator form login, indexed-document display and a real retrieved,
cited answer in the patient chat. Screenshots: artifacts/live-admin.png and
artifacts/live-chat.png. Browser tests never record credential traces or storage.

## Regression and builds

| Check executed | Result |
| --- | --- |
| Backend pytest, isolated SQLite with synthetic provider credentials | 46 passed |
| Shared contracts/adapters Vitest | 13 passed |
| React web Vitest, including login/logout identity and consent isolation | 7 passed |
| Native screen Jest | 4 passed |
| Chrome demo acceptance workflows | 3 passed |
| TypeScript across all workspaces | Passed |
| ESLint web/native | Passed |
| Ruff source/tests/scripts/migrations | Passed |
| Web production build in Real Mode | Passed |
| Fresh isolated SQLite migrations 001 → 002 | Passed |
| Android arm64 release build, embedded Hermes bundle | Passed |
| APK signature verification | Passed, APK Signature Scheme v2 |
| Built web/APK server-secret comparison | Passed, no configured private credentials found |

**73 automated regression tests** (46 backend + 24 TypeScript + 3 browser),
separate from the live service checks. Unit provider requests use mocked HTTP.
Native OS speech, dialer, clipboard and routing boundaries are mocked.

The browser acceptance suite checks widths 320, 360, 390, 430, 768, 1024, 1280,
1440 and 1920; narrow admin layouts; extra-large text at 320px; navigation, chat,
emergency links, demo upload/indexing, safety runs and saved preferences.
It uses an isolated demo server on port 5174, leaving local Real Mode intact.

## Android artifact

**artifacts/SwasthyaSetu-AI-demo-arm64.apk** — approximately 31 MiB, package
org.swasthyasetu.prototype, version 1.0.0, arm64-v8a, minimum Android API 24,
target API 36. The JavaScript bundle is embedded and Metro is not required.

SHA-256: `0AA47102E04D2E2A6C2A5A978749E26ED85B7263C72CC7150F14D499471F5C99`

Signed with the standard development key for direct demo installation, not a
Play Store production release. Reproduce with scripts/build-android.ps1.
The script keeps Gradle/temp files on the project drive and handles Expo's
monorepo entry resolution. Build log: artifacts/android-build.log.

No physical device was connected when adb devices was checked. Installation,
runtime performance, talkback, device speech/dialer and iOS remain unverified.

## Remaining external work

- Connect the hosting/repository accounts and deploy Render + Cloudflare Pages.
  render.yaml now configures real PostgreSQL, MiniMax and hosted embeddings.
  README.md contains exact environment/build steps. No public deployment or remote
  CI run has been performed, and no remote Git repository is configured here.
- Rotate credentials previously pasted into chat before public deployment.
- After HTTPS deployment, configure and build a separate live mobile client;
  the delivered APK intentionally uses labeled synthetic workflows.
- Install the APK on an arm64 Android phone and verify native device behavior.
- Obtain professional Hindi/Odia medical-language review, clinical/privacy/security
  assessment and independent accessibility testing before any real patient use.

The project cannot book consultations, dispatch an ambulance, diagnose, prescribe
dosages, verify current provider availability or claim improved clinical outcomes.
Free hosting/inference quotas may change; no indefinite free production claim is made.
