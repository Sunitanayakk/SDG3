# SwasthyaSetu AI

**Intelligent Care. Accessible to Everyone.**
Bridging Healthcare Through Responsible Artificial Intelligence.

A React website, patient portal, administrator workspace, native Expo patient
application, and shared FastAPI backend. SDG 3 / SDG 10. This is a hackathon
prototype, not a clinical service. Demo Mode uses synthetic profiles, conversations
and metrics. Real Mode connects Supabase Auth/PostgreSQL and NVIDIA inference.

## This workspace's connected setup — 2026-11-21

### Realistic reference panda — 2026-11-24

The geometric panda has been replaced with Bambuk Studio's actual detailed
panda artwork, original texture atlases and skeletal animations. The two
20-second authored loops preserve the leaf-crown panda and bow-tie/butterfly
panda. Original scenery layers accompany them in SDG3's white healthcare UI.
Open **http://localhost:5173/app/companion** for both scenes, pause controls,
optional scenery and a frame-by-frame animation timeline.

Web chat/task avatars use small animated WebP exports of those same loops;
native Android uses GIF exports. Reduced motion, text-only, background/offscreen
handling and still emergency avatars are supported. Ten application activity
labels remain distinct from the source's two authored animation clips.

See [MOTION_STUDY.md](MOTION_STUDY.md) and
**artifacts/panda-motion-inventory.json** for every authored timeline target and
keyframe time. Run `node scripts/check-panda-media.cjs` to compare the 25 source
asset hashes. Current validation and captures are in [VALIDATION.md](VALIDATION.md).

These are third-party Bambuk assets, not original Setu artwork. Their separate
redistribution rights have not been verified. Retained attribution and the Spine
runtime's evaluation/distribution license are in
**apps/web/public/panda-reference/CREDITS.txt** and
**SPINE-RUNTIME-LICENSE.txt**. Confirm applicable rights before external release.

### Accessibility redesign — 2026-11-24

Greeting handling update: casual messages such as **hii**, **hellooo**, **Hi Setu**,
**good morning** and **thanks** receive conversational replies without a medical
evidence warning. English, Hindi and Odia are supported in the live backend and
shared web/native demo. A health question following a greeting still uses the
normal safety and retrieval path; matching is never based only on a `hi` prefix.

The web app now uses a white, teal and sage design, animated illustrations and
responsive reading layouts. Reduced-motion preferences stop decorative animation.
The same light palette and access toolkit are available in the native app.

- **Accessibility Passport** (/app/passport): select access needs and preferred
  communication; preview, print or download a handover card. Local saving is opt-in.
- **Communication Board** (/app/communicate): nine phrases in English, Hindi and
  Odia, temporary typed messages, a large accessible dialog and device read-aloud.
- **Visit Planner** (/app/planner): online/clinic preparation checklists adapt to
  selected access needs. Save progress locally and download the checklist.
- **Easy-read Library** (/app/library): four short guides with original summaries,
  official source links, three reading languages, search and read-aloud.
- **AI chat**: MiniMax remains the generator. The old embedding model disappeared
  from NVIDIA's current catalog; the replacement **nvidia/nemotron-3.5-embed-1b**
  was tested and all six reviewed source documents were reindexed at 2048 dimensions.
  This includes WHO activity, diet and blood-pressure education. Live EN/HI/OR
  answers and the redesigned browser's WHO-cited answer were verified again.

These tools support communication and service navigation; they do not provide
diagnosis, sign-language interpretation, appointment booking or live facility
accessibility verification. New phrase/medical translations need community and
professional validation. Library pages work without the AI service once loaded;
a first page load still needs connectivity. Local data is not encrypted; avoid
personal medical information, especially on shared devices.

The local web app and backend are now in **Real Mode**. The requested administrator
was created and password sign-in verified. Open **http://localhost:5173/signin?admin=1**.
Find your email/password in the ignored **backend/.env.admin.local** file; do not
commit or share that file. No account email was sent. Server secrets are in ignored
backend/.env, and only public Supabase configuration is in frontend environment files.

Live English, Hindi and Odia retrieval/cited answers, authorization, uploads,
indexing, preference storage, session ownership/deletion and safety rules passed.
See **artifacts/live-validation.json** and **artifacts/live-web-validation.json**.
These are synthetic workflow checks; medical translation is not clinically validated.

Start the connected website and API together:

```powershell
cd D:\SDG3
npm run dev
```

The launcher starts the local API in Real Mode, waits for health, then starts Vite.
It reuses an already healthy API and stops only processes it owns on Ctrl+C.
For the default browser Demo Mode it starts Vite alone. Only close project-owned
servers before relaunching; a conflicting website port is reported explicitly.

The standalone Android APK is **artifacts/SwasthyaSetu-AI-demo-arm64.apk**. It uses
explicitly labeled Demo Mode and needs no Metro server. A live phone build requires
a deployed HTTPS backend. Public hosting and physical-device checks remain pending.
Rotate the credentials previously pasted into chat before public deployment.

## Start the demonstration

Prerequisites: Node 22.13+ (tested with 22.19), npm, Python 3.11+ (tested with 3.13.7).
No account, API key, database server, credit card or subscription is needed for
Demo Mode. On a fresh checkout it is the default. This configured workspace uses
Real Mode; temporarily set VITE_DEMO_MODE=true in apps/web/.env.local and
DEMO_MODE=true with a separate SQLite DATABASE_URL to run the full demo.

Patched transitive dependencies are locked. The root postinstall script adapts
SDK 54 Metro's local-asset filename calls to the secure image-size v2 byte API;
the Android bundle is verified with this compatibility patch.

```powershell
cd D:\SDG3
npm ci
npm run web
```

Open **http://localhost:5173**. The browser demo works independently of the backend.
Select **Sign in → Continue as demo guest** or **Enter demo admin**. No password is
required. Direct patient access: /app/chat. Admin starts at /admin/overview after
explicit demo entry; the production authentication mechanism is separate.

In a second terminal:

```powershell
cd D:\SDG3\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-access-log
```

The backend creates and seeds SQLite automatically in Demo Mode.
**API docs: http://localhost:8000/docs** · **Health: http://localhost:8000/health**.

For native mobile:

```powershell
cd D:\SDG3
npm run mobile
```

Scan the QR code using a compatible Expo Go build or run an Android emulator.
This project targets **Expo SDK 54 / React Native 0.81.5**. Get a matching Expo Go
client from [Expo downloads](https://expo.dev/go); the current store client may
support a different SDK. These are native screens, not a WebView.

## Demo walkthrough

1. Try the landing page's live large-text / contrast preview.
2. Ask **How can I access a doctor online?** for a deterministic demo answer with
   an explicitly illustrative retrieval citation.
3. Ask **How can I use large text?** for the second script. Arbitrary questions
   clearly state that real AI is not configured. No model is called in Demo Mode.
4. Try a fictional emergency example such as **I cannot breathe**. Emergency rules
   bypass retrieval/generation. Dialer links require deliberate user action.
5. Choose Hindi or Odia and change accessibility preferences.
6. Enter demo administration, upload a PDF/TXT/Markdown file, filter/search its
   record, view details, index it and delete it. Browser demo uploads simulate
   extraction/indexing, persist metadata, and do not retain file contents.
   Backend demo uploads validate/extract real text but use simulated vectors.
7. Run Safety Tests: seeded cases start **Not executed**. The executed results
   measure rule classification only, not clinical triage or model safety.
8. Filter Analytics, export CSV, submit feedback, and review it as demo admin.

Fixtures include 12 chat sessions, 24 knowledge records, 15 feedback records,
30 days of analytics, 14 safety definitions and 10 resources. Five resources
describe official services; five are explicitly illustrative workflows.
No fictional hospitals or live provider availability are claimed.

## Structure

```text
SDG3/
├── apps/
│   ├── web/
│   │   ├── src/components/       # UI, dialogs, preferences, neural artwork
│   │   ├── src/pages/            # public, patient, admin, auth and policy pages
│   │   ├── src/services.ts       # environment-selected API adapter
│   │   ├── src/context.tsx       # accessibility and localization
│   │   ├── src/test/             # component workflows
│   │   ├── e2e/                  # responsive browser workflows
│   │   └── public/_redirects     # Cloudflare SPA routes
│   └── mobile/
│       ├── app/(tabs)/           # home, chat, resources, profile
│       ├── app/                  # onboarding, emergency, preferences, sign-in
│       ├── components/           # native accessible controls
│       ├── services/             # shared adapter, secure token storage
│       ├── __tests__/            # native component interactions
│       └── eas.json              # Android APK profile
├── packages/
│   ├── api-contracts/src/        # shared types, adapters, dictionaries, fixtures
│   └── design-tokens/            # obsidian / gold palette
├── backend/
│   ├── app/api/                  # public and authorized admin routes
│   ├── app/core/                 # settings, JWT validation, rate limiting
│   ├── app/models/               # relational schema
│   ├── app/schemas/              # validated requests
│   ├── app/repositories/         # source and aggregate queries
│   ├── app/services/             # chat and independent safety layer
│   ├── app/ai/                   # NVIDIA provider
│   ├── app/rag/                  # extraction, embeddings, vectors, citations
│   ├── app/database/             # sessions and synthetic seeds
│   ├── migrations/               # Alembic, pgvector, table isolation
│   ├── scripts/                  # seed/reset, role grant, ingestion
│   ├── examples/                 # original service-navigation summary
│   └── tests/                    # API, safety, provider and retrieval
├── .env.example
├── render.yaml
├── package-lock.json
└── .github/workflows/ci.yml
```

## Implemented features

- Editorial landing page, animated neural core, working feature navigation, SDG
  methodology, accessibility preview, mission, free-access cards and feedback.
- Patient chat with clear demo/real labeling, loading/error/retry, citations, copy,
  optional device read-aloud, consent-based history, reset and emergency guidance.
- Resource directory with official links, geographic limits and illustrative labels.
- Admin overview, charts, document metadata/detail/upload/filter/delete/index,
  AI test console, retrieval scores, feedback, safety runs and resource CRUD.
- Analytics date/language filters and CSV export; synthetic data is labeled.
- Native onboarding, bottom tabs, chat, source links, phone intent, SecureStore,
  AsyncStorage preferences, profile, feedback and demo reset.
- Semantic forms, visible keyboard focus, modal focus containment, high contrast,
  text sizes, reduced motion and text alternatives. No WCAG certification is claimed.

Device-local browser/mobile demo state does not synchronize with the backend.
Both use shared fixture definitions and contracts. In real mode, both adapters
share backend state. Admin APIs always verify authorization on the server.

## Environment variables

```powershell
Copy-Item .env.example .env
Copy-Item .env.example apps\web\.env.local
Copy-Item .env.example apps\mobile\.env.local
```

The backend reads root .env or backend/.env. Vite and Expo read app-local files.
Restart servers after changes. Only VITE_* and EXPO_PUBLIC_* values are public.
Never put private credentials under these prefixes. The example contains blank
server-secret placeholders only.

| Variable                                                 | Purpose                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------ |
| DEMO_MODE                                                | true for scripts, synthetic auth and SQLite seed; false for real backend |
| DATABASE_URL                                             | SQLite demo or postgresql+psycopg://... in real mode                     |
| NVIDIA_API_KEY                                           | server-only hosted inference key                                         |
| NVIDIA_BASE_URL                                          | https://integrate.api.nvidia.com/v1                                      |
| NVIDIA_MODEL                                             | minimaxai/minimax-m3.1-flash                                             |
| SUPABASE_URL                                             | project URL / JWT issuer                                                 |
| SUPABASE_ANON_KEY                                        | public project configuration placeholder                                 |
| SUPABASE_SERVICE_ROLE_KEY                                | server-only account provisioning; ordinary API runtime does not need it  |
| EMBEDDING_PROVIDER                                       | nvidia (default), external or optional local                              |
| EMBEDDING_MODEL                                          | exact multilingual provider model ID                                     |
| EMBEDDING_DIMENSIONS                                     | 2048 for hosted Nemotron 3 and migration 002                              |
| EMBEDDING_BASE_URL                                       | OpenAI-compatible base URL without /embeddings                           |
| EMBEDDING_API_KEY                                        | server-only embedding credential                                         |
| CORS_ORIGINS                                             | JSON allowlist, e.g. ["https://your-project.pages.dev"]                  |
| VITE_DEMO_MODE                                           | only exact false selects real web adapter                                |
| VITE_API_BASE_URL                                        | deployed API URL or http://localhost:8000                                |
| VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY               | public web authentication configuration                                  |
| EXPO_PUBLIC_DEMO_MODE                                    | native adapter selection                                                 |
| EXPO_PUBLIC_API_BASE_URL                                 | URL reachable from the physical device                                   |
| EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY | public native auth config                                                |

A physical phone's localhost is the phone itself. Use the computer's LAN address,
such as http://192.168.1.20:8000. Android emulator host access is usually
http://10.0.2.2:8000. Use a trusted local network for development and HTTPS when hosted.

## Real Supabase authentication and migrations

Local setup update (2026-11-21): the supplied Supabase Session pooler connection
is stored in ignored backend/.env with TLS required. Revision 002 is applied;
13 application tables, pgvector, a 2048-dimension embedding column, halfvec HNSW and table
access protections were verified. Backend demo authentication is disabled.
Revision 002 is now applied, the administrator is provisioned and live RAG passed.
Web uses Real Mode; the standalone mobile demo uses synthetic state. Inspect
current database readiness with:

```powershell
cd D:\SDG3\backend
.\.venv\Scripts\python.exe -m scripts.check_database
```

1. Create a free Supabase project and a synthetic test user. Configure asymmetric
   JWT signing (ES256/RS256); legacy shared HS256 signing is not supported.
2. Set DEMO_MODE=false, SUPABASE_URL and DATABASE_URL. Use a session pooler if the
   host cannot reach direct IPv6. Include ?sslmode=require, and use the SQLAlchemy
   postgresql+psycopg:// driver prefix.
3. From backend, apply migrations and grant an operator-selected user admin:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m scripts.manage grant-admin --user-id YOUR_SUPABASE_USER_UUID
.\.venv\Scripts\python.exe -m scripts.manage init-safety
```

4. Set client demo flags to false and configure public Supabase and API variables.
   Sign in with the test account. The backend validates signature, issuer,
   audience and expiry and checks its own role table. User metadata cannot grant
   administration. Demo authentication returns 404 in real mode.

Tables: users, user_preferences, roles, chat_sessions, chat_messages,
knowledge_sources, knowledge_documents, document_chunks, healthcare_resources,
feedback, ai_usage_events, safety_test_cases and safety_test_runs.
UUID-style IDs, relationships and indexes are defined in the SQLAlchemy models.
On PostgreSQL, migrations enable pgvector and HNSW cosine indexing, enable RLS
and revoke direct anon/authenticated access. The trusted backend database
connection owns all table access. Database extension privileges are required.

Fresh real databases contain no synthetic patients or metrics. Add resources
through admin and ingest reviewed sources. The automatic seed runs in demo only.
Migration 001 freezes the original 384 dimensions; migration 002 changes an empty
chunk table to vector(2048) with a halfvec cosine HNSW expression index. Changing dimensions
requires an explicit follow-up migration and complete reindex. Do not change
dimensions against an existing column. The initial downgrade drops prototype
tables; back up any database before considering it.

## NVIDIA and genuine RAG

The default model is now **minimaxai/minimax-m3.1-flash**. A synthetic live
provider check succeeded on 2026-11-21. Local credentials are stored in ignored
backend/.env; only public Supabase configuration is present in client-local files.
The supplied PostgreSQL and embedding integration is now live-tested end to end;
the browser also passed real account login, indexed-document display and cited chat.

```powershell
cd D:\SDG3\backend
.\.venv\Scripts\python.exe -m scripts.check_provider
```

1. Generate a hosted key on the official
   [NVIDIA model page](https://build.nvidia.com/minimaxai/minimax-m3.1-flash/build).
   Configure NVIDIA_API_KEY server-side. MiniMax inference runs on NVIDIA, not Render.
2. The configured hosted embeddings use **nvidia/nemotron-3.5-embed-1b**, native
   **2048 dimensions**, at **https://integrate.api.nvidia.com/v1/embeddings**.
   Query/passage input types are explicit. The server NVIDIA key is reused when
   EMBEDDING_API_KEY is blank. Three reviewed official-service navigation summaries
   are indexed. Run **python -m scripts.bootstrap_reference** from backend to
   idempotently install these sources, five official resources and safety definitions.
   Document/query vectors must use the same model. Invalid vectors are rejected.
3. Optional local development:

```powershell
cd D:\SDG3\backend
.\.venv\Scripts\python.exe -m pip install sentence-transformers
$env:EMBEDDING_PROVIDER = "local"
$env:EMBEDDING_MODEL = "intfloat/multilingual-e5-small"
$env:EMBEDDING_DIMENSIONS = "384"
```

Local E5 uses query/passage prefixes and normalization and downloads weights on
first use. Use a separate database and matching schema for this optional 384-dimension
configuration; do not apply it to the connected 2048-dimension database.
Do not load it on a small free Render instance. Hosted embeddings may
have their own quotas; no paid provider is required for the credential-free demo.

4. Review a source and ingest it, or use Admin → Documents:

```powershell
.\.venv\Scripts\python.exe -m scripts.manage ingest --file examples\official-service-guide.md --title "eSanjeevani service navigation" --url https://esanjeevani.mohfw.gov.in/ --organization "MoHFW / C-DAC"
```

The upload pipeline restricts size/extensions, validates PDF signatures, extracts
PDF/UTF-8 text, cleans whitespace, chunks with overlap, embeds in batches and
stores source metadata and vectors. Scanned PDFs need external OCR. Unapproved
real sources cannot be indexed. File content is never executed or fetched by URL.

Real retrieval uses pgvector cosine search and filters out synthetic, unreviewed,
unindexed and incompatible-model content. The prompt treats documents as untrusted
data. Only cited retrieved source IDs are returned; missing/invalid references
cause an evidence-limitation reply. This checks citation identity, not clinical
truth or semantic entailment. The isolated SQLite retrieval test uses genuine
cosine ranking with injected vectors; no claim of live embedding evaluation is made.

NVIDIA has a 90-second request timeout, no automatic retry, token limits and error normalization.
MiniMax uses low reasoning effort, a 16384-token generation budget, temperature 1.0 and top_p 0.95;
NVIDIA_MAX_TOKENS, NVIDIA_TEMPERATURE and NVIDIA_TOP_P configure these values.
The patient chat remains text-only; the sample vision request is not added to healthcare flows.
Reasoning fields are not exposed. Quota/timeout/upstream errors are explicit;
no demo answer is silently substituted. Without evidence, the model is not called.
The admin Settings probe sends a small real inference call before reporting
AI CONNECTED. The normal public health endpoint checks the database only.

## Seed/reset commands

```powershell
cd D:\SDG3\backend
.\.venv\Scripts\python.exe -m scripts.manage seed
.\.venv\Scripts\python.exe -m scripts.export_fixtures
```

The second command regenerates shared synthetic fixture JSON. For an intentional
local reset that removes the configured demo schema:

```powershell
.\.venv\Scripts\python.exe -m scripts.manage reset-demo
```

These commands refuse real mode. Profile → Reset demo data resets only the device
adapter, independently of the backend.

## Validation commands

```powershell
cd D:\SDG3
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e -w @setu/web
cd backend
.\.venv\Scripts\python.exe -m ruff check app tests scripts migrations
.\.venv\Scripts\python.exe -m pytest -q
```

Browser tests use installed Chrome and widths 320, 360, 390, 430, 768, 1024, 1280,
1440 and 1920. Native component tests mock OS boundaries and do not replace
physical-device or APK tests. **Actual results and remaining verification are
recorded in VALIDATION.md.**

## Free deployment preparation

Public deployment needs your hosting/repository accounts. Local Demo Mode is the
credential-free demonstration. Free tiers and inference trial quotas
can change; indefinitely free real inference is not promised.

**Cloudflare Pages:** repository root is this directory, build command
**npm ci && npm run build**, output **apps/web/dist**, Node 22.19+. Configure
VITE_DEMO_MODE=true for a browser demo or real API/Supabase public variables for
real mode. The SPA fallback is included. Rebuild after environment changes.

```powershell
npm run build
npx wrangler pages deploy apps/web/dist --project-name swasthyasetu-ai
```

**Render:** connect/install Render in Codex or use its dashboard, connect your
GitHub repository, create a Blueprint from render.yaml and select free compute.
The blueprint now defaults to Real Mode with hosted embeddings. Set DATABASE_URL,
SUPABASE_URL, SUPABASE_ANON_KEY and NVIDIA_API_KEY from ignored backend/.env using
the hosting secret inputs. CORS_ORIGINS must be the exact web origin JSON array.
Do not upload any .env file to GitHub. Build command:
**pip install -r requirements.lock.txt && python -m alembic upgrade head**.
Start command: **uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --no-access-log**.
Health path: **/health**. One worker matches the in-process prototype limiter.
Render free instances sleep on inactivity, take time to wake, and have no durable
local disk. Use Supabase for durable data. Do not select paid options to demo.

After Render is healthy, set VITE_DEMO_MODE=false, VITE_API_BASE_URL to its HTTPS
URL and both public Supabase variables in Cloudflare Pages, then deploy/rebuild.
If using Direct Upload instead, build locally with those public environment values
and upload apps/web/dist. Set Render CORS_ORIGINS to the resulting Pages origin
and restart. Verify sign-in and cited chat at the deployed URL before sharing it.

**Android APK:** Android Studio, JDK and SDK are prerequisites for a free local build:

```powershell
cd D:\SDG3
.\scripts\build-android.ps1
```

Output: **artifacts/SwasthyaSetu-AI-demo-arm64.apk**, a standalone arm64 release
build signed with the standard development key. This is for direct demo installation,
not a Play Store production release. The script explicitly selects Demo Mode and
keeps large caches on the project drive. Signing keystores are ignored by Git;
the script creates a local demo signing key when needed on a fresh checkout.
For live native testing, set the mobile
public demo flag to false and API URL to deployed HTTPS, then use Expo Go or a
separate release build; the demo build script intentionally overrides that flag.
Optional EAS preview, subject to free account
quota:

```powershell
cd D:\SDG3\apps\mobile
npx eas-cli build --platform android --profile preview
```

No paid EAS plan is mandatory. A JavaScript bundle alone does not verify an APK.

To test the delivered APK, copy it to an arm64 Android phone running Android 7.0
or newer, open it from Files and allow installation from that app when Android
asks. Install and launch SwasthyaSetu AI. Confirm the Demo Mode label, send a
scripted chat, change Hindi/Odia and accessibility settings, and check that an
emergency action opens the dialer without placing a call. With an authorized USB
debugging connection, **adb install -r artifacts/SwasthyaSetu-AI-demo-arm64.apk**
is an alternative. No physical-device test has been performed here.

## Safety and limitations

- General information only: no diagnosis, prescription dosage, booking, dispatch
  or clinician availability. Consult a qualified professional for medical care.
- Conservative emergency examples span supported languages but can miss phrases.
  This is not clinically validated triage. Seek help whenever you believe urgent
  care is needed, regardless of the assistant's reply.
- Hindi/Odia medical translations, device voices and screen-reader behavior need
  professional/device validation. Interface localization is not medical validation.
- Chats are transient by default. Saving requires explicit preference and real-mode
  authentication. Access/deletion is scoped to the signed-in user.
- Web tokens use session storage; native tokens use SecureStore. Expired sessions
  require sign-in. Automatic token refresh/recovery is outside this prototype.
- Real questions/context go to configured inference/embedding providers; their
  policies apply. Never use real patient records in this evaluation.
- Logging omits bodies/secrets. Analytics store language, latency, retrieval presence
  and timestamps, not chat contents. Feedback must omit identifiable information.
- Rate limits are single-process, not a distributed production abuse defense.
  Add ingress safeguards, retention jobs and security/privacy review before real use.
- Synthetic metrics are illustrative, not achieved clinical or social outcomes.
- Real NVIDIA, Supabase, pgvector hosting and physical-device behavior require
  external credentials/hardware; see the executed verification report.

## Official references

Navigation/geography checked 2026-11-17; these are not live availability feeds:

- [India ERSS / Ministry of Home Affairs](https://www.mha.gov.in/emergency-response-support-system-erss)
- [Odisha NHM transport](https://nhmodisha.gov.in/patient_transport_2/)
- [C-DAC eSanjeevani](https://www.cdac.gov.in/index.aspx?id=product_details&productId=eSanjeevaniNationalTelemedicineService)
- [Beneficiary portal reference](https://health.delhi.gov.in/health/ab-pm-jay-scheme)
- [ABDM consent guidance](https://abdm.gov.in/strapicms/uploads/HIP_HIU_Guidelines_f85df336ec.pdf)
- [NVIDIA model API](https://build.nvidia.com/minimaxai/minimax-m3.1-flash/build)
- [Supabase JWT validation](https://supabase.com/docs/guides/auth/jwts)
- [Cloudflare React deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)
- [Render free limitations](https://render.com/docs/free)
- [NativeWind setup](https://www.nativewind.dev/docs/getting-started/installation)
- [Expo client compatibility](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)
