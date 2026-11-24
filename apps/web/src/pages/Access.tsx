import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  BookOpen,
  Check,
  CheckCheck,
  ClipboardList,
  Download,
  Ear,
  Eye,
  Languages,
  MessageCircle,
  Printer,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import {
  accessNeeds,
  buildVisitChecklist,
  communicationPhrases,
  healthLibrary,
  languages,
  type Language,
} from "@setu/api-contracts";
import { Modal, PageHeading } from "../components/ui";
import { useSetu } from "../context";
import { PandaMini } from "../components/PandaStage";

function download(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
function readSaved(key: string): Record<string, unknown> {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
function useVoice() {
  const { notify } = useSetu();
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  return (text: string, language: Language) => {
    if (!window.speechSynthesis) {
      notify(
        "Read aloud is not supported here. The full text is always available.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = { en: "en-IN", hi: "hi-IN", or: "or-IN" }[language];
    if (
      !window.speechSynthesis
        .getVoices()
        .some((v) => v.lang.startsWith(language))
    )
      notify("A matching device voice may need to be installed.");
    window.speechSynthesis.speak(utterance);
  };
}
function NeedsPicker({
  selected,
  change,
}: {
  selected: string[];
  change: (needs: string[]) => void;
}) {
  const icons = [Eye, Ear, Accessibility, Languages];
  return (
    <fieldset className="needs-picker">
      <legend>What would make care easier for you?</legend>
      <div className="needs-grid">
        {accessNeeds.map((need, i) => {
          const Icon = icons[i];
          return (
            <label
              className={
                selected.includes(need.id)
                  ? "need-option chosen"
                  : "need-option"
              }
              key={need.id}
            >
              <input
                type="checkbox"
                checked={selected.includes(need.id)}
                onChange={(e) =>
                  change(
                    e.target.checked
                      ? [...selected, need.id]
                      : selected.filter((n) => n !== need.id),
                  )
                }
              />
              <Icon size={23} />
              <strong>{need.title}</strong>
              <span>{need.detail}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
export function AccessTools() {
  return (
    <>
      <PageHeading
        eyebrow="DESIGNED AROUND YOU"
        title="Your access toolkit."
        description="Small tools that remove real barriers. No account needed to get started."
      />
      <div className="tool-grid">
        {[
          [
            Accessibility,
            "Accessibility Passport",
            "Explain how you prefer to receive care, once. Print a clear card to bring to your next visit.",
            "/app/passport",
            "For your next visit",
          ],
          [
            MessageCircle,
            "Communication Board",
            "Tap a phrase, show a large message or have your device read it aloud. Three languages, zero pressure to speak.",
            "/app/communicate",
            "When words need a bridge",
          ],
          [
            ClipboardList,
            "Visit Planner",
            "Build a practical checklist around your needs before an online consultation or clinic visit.",
            "/app/planner",
            "One manageable step at a time",
          ],
          [
            BookOpen,
            "Easy-read Library",
            "Short, source-linked health explainers in English, Hindi and Odia, with optional read aloud.",
            "/app/library",
            "Clarity at your pace",
          ],
        ].map(([Icon, title, body, to, tag]) => {
          const I = Icon as typeof Eye;
          return (
            <Link to={String(to)} className="tool-card" key={String(to)}>
              <span className="tool-icon">
                <I size={27} />
              </span>
              <span className="eyebrow">{String(tag)}</span>
              <h2>{String(title)}</h2>
              <p>{String(body)}</p>
              <span className="tool-open">
                Open tool <span aria-hidden="true">＋</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="access-note">
        <ShieldCheck />
        <p>
          Your access needs are yours to share. Passport and checklist data
          stays on this browser only when you choose to save it.
        </p>
      </div>
    </>
  );
}
export function Passport() {
  const { prefs, notify } = useSetu();
  const saved = readSaved("setu-passport-v1");
  const [needs, setNeeds] = useState<string[]>(
    Array.isArray(saved.needs)
      ? saved.needs.filter((n) => accessNeeds.some((a) => a.id === n))
      : [],
  );
  const [language, setLanguage] = useState<Language>(
    languages.some((l) => l.id === saved.language)
      ? (saved.language as Language)
      : prefs.language,
  );
  const [method, setMethod] = useState(
    typeof saved.method === "string" ? saved.method : "Written instructions",
  );
  const [savedNotice, setSavedNotice] = useState(false);
  const content = [
    "MY ACCESSIBILITY PASSPORT",
    "Preferred language: " + languages.find((l) => l.id === language)?.name,
    "Communication: " + method,
    ...accessNeeds.filter((n) => needs.includes(n.id)).map((n) => n.request),
    "Please ask before assisting me. These are communication preferences, not a medical record.",
  ].join("\n\n");
  return (
    <>
      <PageHeading
        eyebrow="YOUR NEEDS, IN YOUR WORDS"
        title="Accessibility Passport"
        description="A simple handover card. Help a clinician understand how to communicate and assist you."
      />
      <div className="access-split">
        <section className="tool-panel">
          <NeedsPicker
            selected={needs}
            change={(n) => {
              setNeeds(n);
              setSavedNotice(false);
            }}
          />
          <div className="settings-form">
            <label>
              Preferred language
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferred communication
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {[
                  "Written instructions",
                  "Read information aloud",
                  "Speak face to face",
                  "With an interpreter or companion",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="privacy-hint">
            No diagnosis, identity number or medical history is collected.
            Saving is optional.
          </p>
          <button
            className="button"
            onClick={() => {
              localStorage.setItem(
                "setu-passport-v1",
                JSON.stringify({ needs, language, method }),
              );
              setSavedNotice(true);
              notify("Passport saved on this browser.");
            }}
          >
            <Check size={17} />
            Save on this device
          </button>
          {savedNotice && (
            <p role="status">Saved locally. Changes can be saved again.</p>
          )}
        </section>
        <section
          className="passport-preview print-card"
          aria-label="Passport preview"
        >
          <div className="passport-head">
            <PandaMini mood={savedNotice ? "celebrate" : "idle"} />
            <span>
              SwasthyaSetu
              <br />
              <small>MY ACCESSIBILITY PASSPORT</small>
            </span>
          </div>
          <h2>
            Care works better
            <br />
            when we understand
            <br />
            <em>each other.</em>
          </h2>
          <dl>
            <dt>My preferred language</dt>
            <dd>{languages.find((l) => l.id === language)?.name}</dd>
            <dt>How to communicate with me</dt>
            <dd>{method}</dd>
          </dl>
          <ul>
            {accessNeeds
              .filter((n) => needs.includes(n.id))
              .map((n) => (
                <li key={n.id}>
                  <CheckCheck size={18} />
                  {n.request}
                </li>
              ))}
          </ul>
          {!needs.length && <p>Select your needs to personalise this card.</p>}
          <p className="caption">
            Please ask before assisting me. This card is not a medical record.
          </p>
        </section>
      </div>
      <div className="row wrap tool-actions">
        <button className="button secondary" onClick={() => window.print()}>
          <Printer size={18} />
          Print passport
        </button>
        <button
          className="button secondary"
          onClick={() => download("my-accessibility-passport.txt", content)}
        >
          <Download size={18} />
          Download text
        </button>
        <button
          className="text-link"
          onClick={() => {
            localStorage.removeItem("setu-passport-v1");
            setNeeds([]);
            setMethod("Written instructions");
            setSavedNotice(false);
            notify("Saved passport removed from this browser.");
          }}
        >
          Clear saved passport
        </button>
      </div>
    </>
  );
}
export function CommunicationBoard() {
  const { prefs } = useSetu();
  const speak = useVoice();
  const [language, setLanguage] = useState<Language>(prefs.language);
  const [selected, setSelected] = useState(communicationPhrases[0].id);
  const [custom, setCustom] = useState("");
  const [present, setPresent] = useState(false);
  const phrase = communicationPhrases.find((p) => p.id === selected)!;
  const message = selected === "custom" ? custom : phrase?.[language] || "";
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresent(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="COMMUNICATE YOUR WAY"
        title="You don’t have to say it aloud."
        description="Tap a phrase and show it. Useful at reception, during a visit or with someone helping you."
      />
      <div className="tool-toolbar">
        <label>
          Board language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <p>English · हिन्दी · ଓଡ଼ିଆ</p>
      </div>
      <div className="phrase-grid">
        {communicationPhrases.map((p) => (
          <button
            key={p.id}
            className={
              selected === p.id ? "phrase-button selected" : "phrase-button"
            }
            aria-pressed={selected === p.id}
            onClick={() => setSelected(p.id)}
          >
            <span aria-hidden="true">{p.icon}</span>
            <strong lang={language}>{p[language]}</strong>
            {language !== "en" && <small>{p.en}</small>}
          </button>
        ))}
      </div>
      <div className="tool-panel">
        <label>
          Or type your own message
          <textarea
            value={custom}
            maxLength={300}
            onChange={(e) => {
              setCustom(e.target.value);
              setSelected("custom");
            }}
            placeholder="What would you like someone to know?"
          />
        </label>
        <p className="caption">
          Your typed message is temporary. Nothing here is sent to an AI or
          saved.
        </p>
      </div>
      <section
        className="message-display"
        aria-label="Selected communication message"
      >
        <span className="eyebrow">PLEASE READ MY MESSAGE</span>
        <p lang={language} aria-live="polite">
          {message || "Type a message above."}
        </p>
        <div className="row wrap">
          <button
            className="button"
            disabled={!message}
            onClick={() => speak(message, language)}
          >
            <Volume2 size={18} />
            Read this aloud
          </button>
          <button
            className="button secondary"
            onClick={() => window.speechSynthesis?.cancel()}
          >
            Stop audio
          </button>
          <button
            className="button secondary"
            onClick={() => setPresent(!present)}
          >
            <Eye size={18} />
            Show large message
          </button>
        </div>
      </section>
      {present && (
        <Modal title="Communication card" onClose={() => setPresent(false)}>
          <div className="large-communication">
            <p lang={language}>{message || "Type a message first."}</p>
            <button className="button" onClick={() => speak(message, language)}>
              <Volume2 size={18} />
              Read message aloud
            </button>
            <button
              className="button secondary"
              onClick={() => window.speechSynthesis?.cancel()}
            >
              Stop audio
            </button>
          </div>
        </Modal>
      )}
      <p className="caption">
        Phrase translations are for prototype evaluation and need community
        validation. This is a text communication aid, not sign-language
        interpretation.
      </p>
    </>
  );
}
export function VisitPlanner() {
  const { notify } = useSetu();
  const saved = readSaved("setu-visit-v1");
  const [channel, setChannel] = useState<"online" | "clinic">(
    saved.channel === "clinic" ? "clinic" : "online",
  );
  const [needs, setNeeds] = useState<string[]>(
    Array.isArray(saved.needs)
      ? saved.needs.filter((n) => accessNeeds.some((a) => a.id === n))
      : [],
  );
  const [done, setDone] = useState<string[]>(
    Array.isArray(saved.done)
      ? saved.done.filter((n) => typeof n === "string")
      : [],
  );
  const steps = buildVisitChecklist(channel, needs);
  const complete = steps.filter((s) => done.includes(s)).length;
  return (
    <>
      <PageHeading
        eyebrow="LESS UNCERTAINTY. MORE CONFIDENCE."
        title="Your next visit, made simpler."
        description="Prepare for a consultation around your access needs. This planner does not book visits or provide medical triage."
      />
      <div className="access-split">
        <div className="tool-panel">
          <fieldset className="channel-picker">
            <legend>How would you like to access care?</legend>
            {["online", "clinic"].map((c) => (
              <label key={c}>
                <input
                  type="radio"
                  name="channel"
                  checked={channel === c}
                  onChange={() => {
                    setChannel(c as "online" | "clinic");
                    setDone([]);
                  }}
                />
                {c === "online" ? "Online consultation" : "Visit a clinic"}
              </label>
            ))}
          </fieldset>
          <NeedsPicker
            selected={needs}
            change={(n) => {
              setNeeds(n);
              setDone([]);
            }}
          />
          <Link className="text-link" to="/app/passport">
            Create a card to explain your needs
          </Link>
        </div>
        <section className="tool-panel visit-checklist print-card">
          <div className="row between">
            <div className="row">
              <PandaMini
                mood={
                  complete === steps.length
                    ? "celebrate"
                    : complete
                      ? "happy"
                      : "reading"
                }
              />
              <h2>Your preparation checklist</h2>
            </div>
            <span className="status success">
              {complete} / {steps.length}
            </span>
          </div>
          <progress
            max={steps.length}
            value={complete}
            aria-label="Visit preparation progress"
          />
          {steps.map((step) => (
            <label className="checklist-item" key={step}>
              <input
                type="checkbox"
                checked={done.includes(step)}
                onChange={(e) =>
                  setDone(
                    e.target.checked
                      ? [...done, step]
                      : done.filter((s) => s !== step),
                  )
                }
              />
              <span>{step}</span>
            </label>
          ))}
          <div className="access-note">
            <ShieldCheck size={20} />
            <p>
              Accessibility arrangements are requests. Confirm them directly
              with the service.
            </p>
          </div>
          {channel === "online" && (
            <a
              className="button"
              href="https://esanjeevani.mohfw.gov.in/"
              target="_blank"
              rel="noreferrer"
            >
              Open official eSanjeevani portal
            </a>
          )}
          {channel === "clinic" && (
            <Link className="button" to="/app/resources">
              Find official service information
            </Link>
          )}
        </section>
      </div>
      <div className="row wrap tool-actions">
        <button
          className="button"
          onClick={() => {
            localStorage.setItem(
              "setu-visit-v1",
              JSON.stringify({ channel, needs, done }),
            );
            notify("Checklist saved on this browser.");
          }}
        >
          <Check size={17} />
          Save checklist locally
        </button>
        <button
          className="button secondary"
          onClick={() =>
            download(
              "my-visit-checklist.txt",
              steps
                .map((s) => (done.includes(s) ? "[x] " : "[ ] ") + s)
                .join("\n\n"),
            )
          }
        >
          <Download size={18} />
          Download checklist
        </button>
        <button
          className="text-link"
          onClick={() => {
            localStorage.removeItem("setu-visit-v1");
            setDone([]);
            notify("Saved checklist cleared.");
          }}
        >
          Clear progress
        </button>
      </div>
    </>
  );
}
export function HealthLibrary() {
  const { prefs } = useSetu();
  const speak = useVoice();
  const [language, setLanguage] = useState<Language>(prefs.language);
  const [query, setQuery] = useState("");
  const entries = healthLibrary.filter((a) =>
    (a.title + a.category + a.summary[language])
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="SMALL READS. USEFUL KNOWLEDGE."
        title="Health information, made clearer."
        description="Original plain-language summaries with direct links to WHO and official government sources. Reviewed 24 November 2026."
      />
      <div className="tool-toolbar">
        <label>
          Search the library
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try nutrition or blood pressure"
          />
        </label>
        <label>
          Reading language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="library-grid">
        {entries.map((a) => (
          <article className="library-card" key={a.id}>
            <div className="row between">
              <span className="status">{a.category}</span>
              <span className="caption">{a.reading} read</span>
            </div>
            <h2>{a.title}</h2>
            <p lang={language}>{a.summary[language]}</p>
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="source-link"
            >
              <ShieldCheck size={16} />
              {a.organization} · Read source
            </a>
            <div className="row wrap">
              <button
                className="button secondary small"
                onClick={() => speak(a.summary[language], language)}
              >
                <Volume2 size={17} />
                Listen
              </button>
              <Link
                className="button secondary small"
                to={"/app/chat?question=" + encodeURIComponent(a.question)}
              >
                Ask a follow-up
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!entries.length && (
        <p role="status">No articles match. Try a different search.</p>
      )}
      <button
        className="text-link"
        onClick={() => window.speechSynthesis?.cancel()}
      >
        Stop read aloud
      </button>
      <p className="privacy-hint">
        General education, not personalised medical advice. Hindi/Odia summaries
        need professional language review. The library remains usable if the AI
        backend is unavailable; a first page load still needs connectivity.
      </p>
    </>
  );
}
