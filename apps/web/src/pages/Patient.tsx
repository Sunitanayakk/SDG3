import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  Copy,
  HeartPulse,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Volume2,
  Accessibility,
  Search,
  ExternalLink,
  LoaderCircle,
} from "lucide-react";
import {
  type ChatMessage,
  type ChatResponse,
  type Language,
  pandaMoodForChat,
  languages,
} from "@setu/api-contracts";
import { api } from "../services";
import { useSetu } from "../context";
import {
  ErrorState,
  Loading,
  ModeBadge,
  Notice,
  PageHeading,
} from "../components/ui";
import { PreferencesForm } from "../components/Preferences";
import { ConnectionNotice } from "../components/Connection";
import { PandaMini } from "../components/PandaStage";

export function PatientHome() {
  const { prefs, t } = useSetu();
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.sessions(),
    retry: false,
  });
  return (
    <>
      <PageHeading
        eyebrow="YOUR HEALTHCARE COMPANION"
        title={t.welcome}
        description={`Hello, ${prefs.display_name}. A clearer next step starts here.`}
      />
      <Link to="/app/chat" className="patient-hero glass">
        <div>
          <span className="eyebrow">A SPACE FOR YOUR QUESTIONS</span>
          <h2>
            Let’s find a little
            <br />
            <em>clarity, together.</em>
          </h2>
          <p>Start with “How can I access a doctor online?”</p>
          <span className="button">
            {t.ask}
            <ArrowUpRight size={18} />
          </span>
        </div>
        <div className="patient-orb" aria-hidden="true">
          <Sparkles size={54} strokeWidth={1} />
        </div>
      </Link>
      <div className="three-grid patient-quick">
        <Link className="glass" to="/app/tools">
          <Accessibility />
          <h3>Your access toolkit</h3>
          <p>Passport, communication board and a personalised visit plan.</p>
        </Link>
        {[
          [
            BookOpen,
            t.resources,
            "Official healthcare portals",
            "/app/resources",
          ],
          [
            HeartPulse,
            t.emergency,
            "112 · India / 108 · Odisha",
            "/app/emergency",
          ],
          [
            Accessibility,
            t.accessibility,
            "Make this space yours",
            "/app/preferences",
          ],
        ].map(([Icon, title, body, to]) => {
          const I = Icon as typeof BookOpen;
          return (
            <Link className="glass" to={String(to)} key={String(to)}>
              <I />
              <h3>{title as string}</h3>
              <p>{body as string}</p>
              <ArrowUpRight size={16} />
            </Link>
          );
        })}
      </div>
      <div className="section-heading compact">
        <h2>{t.recent}</h2>
        <Link className="text-link" to="/app/chat">
          {t.newChat}
          <Plus size={16} />
        </Link>
      </div>
      {sessions.isError ? (
        <p className="muted">
          Sign in and opt into saving to access your conversation history.
        </p>
      ) : sessions.isPending ? (
        <Loading />
      ) : (
        <div className="recent-grid">
          {sessions.data.slice(0, 6).map((s) => (
            <Link
              key={s.id}
              className="glass recent-card"
              to={"/app/chat?session=" + s.id}
            >
              <MessageSquare size={18} />
              <span>
                {s.title}
                <small>
                  {s.language.toUpperCase()} ·{" "}
                  {api.mode === "demo"
                    ? "Synthetic example"
                    : "Saved conversation"}
                </small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      )}
      <Notice />
    </>
  );
}

const suggestions = [
  "How can I access a doctor online?",
  "Why is checking blood pressure important?",
  "What are the basics of a healthy diet?",
];
export function Chat({ technical = false }: { technical?: boolean }) {
  const { prefs, t, notify } = useSetu();
  const queryClient = useQueryClient();
  const [search, setSearch] = useSearchParams();
  const [question, setQuestion] = useState(
    search.get("question")?.slice(0, 4000) || "",
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [lang, setLang] = useState<Language>(prefs.language);
  const [rag, setRag] = useState(true);
  const [topK, setTopK] = useState(4);
  const [detail, setDetail] = useState<ChatResponse>();
  const [failed, setFailed] = useState("");
  const [focused, setFocused] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => setLang(prefs.language), [prefs.language]);
  const saved = search.get("session");
  useEffect(() => {
    if (saved) {
      api
        .session(saved)
        .then((s) => {
          setSessionId(s.id);
          setMessages(s.messages || []);
        })
        .catch((e) => notify(e.message));
    }
  }, [saved, notify]);
  const mutation = useMutation({
    mutationFn: (message: string) =>
      api.chat(
        {
          message,
          language: lang,
          use_rag: rag,
          top_k: topK,
          persist: prefs.persist_chats,
          session_id: sessionId,
        },
        technical,
      ),
    onSuccess: (result) => {
      setSessionId(result.session_id);
      setDetail(result);
      setFailed("");
      setMessages((m) => [
        ...m,
        {
          id: result.message_id,
          role: "assistant",
          content: result.reply,
          citations: result.citations,
          safety_level: result.safety_level,
          mode: result.mode,
        },
      ]);
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e, question) => setFailed(question),
  });
  useEffect(() => {
    end.current?.scrollIntoView({
      behavior: prefs.reduced_motion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [messages, mutation.isPending, prefs.reduced_motion]);
  function send(value: string, retry = false) {
    if (!value.trim() || mutation.isPending) return;
    if (!retry)
      setMessages((m) => [
        ...m,
        {
          id: "user-" + Date.now(),
          role: "user",
          content: value.trim(),
          citations: [],
        },
      ]);
    setQuestion("");
    mutation.mutate(value.trim());
  }
  function reset() {
    setMessages([]);
    setSessionId(undefined);
    setDetail(undefined);
    setSearch({});
    mutation.reset();
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      notify("Read-aloud is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = { en: "en-IN", hi: "hi-IN", or: "or-IN" }[lang];
    if (
      !window.speechSynthesis.getVoices().some((v) => v.lang.startsWith(lang))
    )
      notify("A matching voice may not be installed on this device.");
    window.speechSynthesis.speak(utter);
  }
  return (
    <>
      <PageHeading
        eyebrow={technical ? "DEVELOPER CONSOLE" : "YOUR SPACE TO ASK"}
        title={
          technical ? "AI Assistant Testing" : "A conversation, with care."
        }
        description={
          technical
            ? "Inspect retrieval, safety classification and provider status."
            : "General information, grounded in sources. Always with your wellbeing in mind."
        }
        action={
          <button className="button secondary" onClick={reset}>
            <Plus size={16} />
            {t.newChat}
          </button>
        }
      />
      <ConnectionNotice />
      {technical && (
        <div className="glass console-controls">
          <label>
            Response language
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Retrieval mode
            <select
              value={String(rag)}
              onChange={(e) => setRag(e.target.value === "true")}
            >
              <option value="true">RAG enabled</option>
              <option value="false">No retrieval · evidence limitation</option>
            </select>
          </label>
          <label>
            Top-k passages
            <input
              type="number"
              min={1}
              max={10}
              value={topK}
              onChange={(e) =>
                setTopK(Math.max(1, Math.min(10, Number(e.target.value))))
              }
            />
          </label>
        </div>
      )}
      <div className="chat-shell">
        <header className="chat-header">
          <div className="row">
            <PandaMini
              mood={pandaMoodForChat({
                pending: mutation.isPending,
                error: mutation.isError,
                focused,
                hasReply: !!detail,
                safety: detail?.safety_level,
              })}
            />
            <div>
              <strong>SwasthyaSetu companion</strong>
              <small>{lang.toUpperCase()} · Educational information</small>
            </div>
          </div>
          <ModeBadge />
        </header>
        <div
          className="chat-messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {!messages.length && (
            <div className="chat-empty">
              <PandaMini mood="welcome" />
              <span className="eyebrow">A LITTLE CLARITY STARTS HERE</span>
              <h2>
                What’s on <em>your mind?</em>
              </h2>
              <p>
                Ask about healthcare access, services or accessibility.
                <br />
                Please use only fictional information in this prototype.
              </p>
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}>
                    {s}
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <article
              key={m.id}
              className={`message ${m.role} ${m.safety_level === "emergency" ? "emergency-message" : ""}`}
            >
              <div className="message-label">
                {m.role === "user"
                  ? "YOU"
                  : m.mode === "demo"
                    ? "SETU · DEMO CONTENT"
                    : "SETU · GENERAL INFORMATION"}
              </div>
              <p>{m.content}</p>
              {m.safety_level === "emergency" && (
                <Link to="/app/emergency" className="button danger">
                  {t.emergency}
                  <ArrowUpRight size={16} />
                </Link>
              )}
              {m.citations.length > 0 && (
                <div className="citations">
                  {m.citations.map((c) => (
                    <div className="citation" key={c.source_id}>
                      <BookOpen size={16} />
                      <div>
                        {c.url ? (
                          <a href={c.url} target="_blank" rel="noreferrer">
                            {c.title}
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <strong>{c.title}</strong>
                        )}
                        <small>
                          {c.verified
                            ? "Reviewed source"
                            : "Illustrative / unverified source"}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {m.role === "assistant" && (
                <div className="message-actions">
                  <button
                    aria-label={t.copy}
                    onClick={() =>
                      navigator.clipboard
                        .writeText(m.content)
                        .then(() => notify("Copied response."))
                        .catch(() =>
                          notify(
                            "Clipboard is unavailable. Select the text to copy.",
                          ),
                        )
                    }
                  >
                    <Copy size={14} />
                    {t.copy}
                  </button>
                  {
                    <button onClick={() => speak(m.content)}>
                      <Volume2 size={14} />
                      {t.read}
                    </button>
                  }
                </div>
              )}
            </article>
          ))}
          {mutation.isPending && (
            <div className="chat-loading" role="status">
              <LoaderCircle size={18} className="spin" />
              {api.mode === "demo"
                ? "Preparing a labeled demo example…"
                : "Retrieving information and preparing a reply…"}
            </div>
          )}
          {mutation.isError && (
            <ErrorState
              error={mutation.error}
              retry={() => send(failed, true)}
            />
          )}
          <div ref={end} />
        </div>
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(question);
          }}
        >
          <label className="sr-only" htmlFor="chat-question">
            {t.ask}
          </label>
          <textarea
            id="chat-question"
            value={question}
            maxLength={4000}
            rows={2}
            placeholder={t.placeholder}
            onChange={(e) => setQuestion(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(question);
              }
            }}
          />
          <button
            className="send-button"
            disabled={mutation.isPending || !question.trim()}
            aria-label={t.send}
          >
            <Send size={20} />
          </button>
        </form>
        <div className="chat-bottom">
          <ShieldCheck size={13} />
          {prefs.persist_chats
            ? "Saving enabled by your preference."
            : "Conversations are not saved by default."}
          <Link to="/app/preferences">Privacy preferences</Link>
        </div>
      </div>
      <div className="row wrap" style={{ marginTop: 16 }}>
        {sessionId && prefs.persist_chats && (
          <button
            className="button secondary small"
            onClick={async () => {
              if (!window.confirm("Delete this saved conversation?")) return;
              try {
                await api.deleteSession(sessionId);
                reset();
                void queryClient.invalidateQueries({ queryKey: ["sessions"] });
                notify("Saved conversation deleted.");
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <Trash2 size={14} />
            Delete saved conversation
          </button>
        )}
      </div>
      <Notice />
      {prefs.language !== "en" && <p className="caption">{t.translation}</p>}
      {technical && detail && (
        <section className="glass technical-results">
          <span className="eyebrow">EXECUTION DETAILS</span>
          <dl className="result-grid">
            <div>
              <dt>Provider status</dt>
              <dd>{detail.model_status}</dd>
            </div>
            <div>
              <dt>Response time</dt>
              <dd>{detail.latency_ms} ms</dd>
            </div>
            <div>
              <dt>Safety class</dt>
              <dd>{detail.safety_level}</dd>
            </div>
            <div>
              <dt>Retrieved passages</dt>
              <dd>{detail.retrieval.document_count}</dd>
            </div>
          </dl>
          {detail.snippets?.map((s, i) => (
            <div className="snippet" key={i}>
              <strong>
                {s.title} · Similarity {s.score}
              </strong>
              <p>{s.snippet}</p>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

export function Resources() {
  const { t } = useSetu();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const resources = useQuery({
    queryKey: ["resources"],
    queryFn: () => api.resources(),
  });
  const rows = resources.data?.filter(
    (r) =>
      (!type || r.type === type) &&
      (r.name + " " + r.description).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="A BRIDGE TO EXISTING SERVICES"
        title={t.resources}
        description="Explore official portals and clearly marked illustrative examples. Service availability is not monitored."
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search resources"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search healthcare services…"
          />
        </label>
        <select
          aria-label="Service type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All types</option>
          {[...new Set(resources.data?.map((r) => r.type))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {resources.isPending ? (
        <Loading />
      ) : resources.isError ? (
        <ErrorState
          error={resources.error}
          retry={() => void resources.refetch()}
        />
      ) : (
        <div className="resource-grid">
          {rows?.map((r) => (
            <article key={r.id} className="glass resource-card">
              <div className="row between">
                <div className="icon-tile">
                  <HeartPulse />
                </div>
                <span className={`status ${r.verified ? "success" : ""}`}>
                  {r.verified ? "Official service" : "Illustrative example"}
                </span>
              </div>
              <span className="eyebrow">{r.type}</span>
              <h2>{r.name}</h2>
              <p>{r.description}</p>
              <p className="caption">{r.notes}</p>
              <a
                className="text-link"
                href={r.url}
                target="_blank"
                rel="noreferrer"
              >
                {r.verified
                  ? "Open official portal"
                  : "Related official information"}
                <ArrowUpRight size={17} />
              </a>
              {r.phone && (
                <a className="button secondary" href={"tel:" + r.phone}>
                  Call {r.phone} · {r.phone === "108" ? "Odisha" : "India"}
                </a>
              )}
            </article>
          ))}
          {!rows?.length && (
            <p className="empty-state">No services match these filters.</p>
          )}
        </div>
      )}
      <Notice />
    </>
  );
}

export function Emergency() {
  const { t } = useSetu();
  return (
    <>
      <PageHeading eyebrow="PLEASE SEEK IMMEDIATE HELP" title={t.emergency} />
      <section className="emergency-panel">
        <HeartPulse size={40} />
        <h2>
          If you think this is an emergency,
          <br />
          seek professional help now.
        </h2>
        <p>
          This prototype cannot assess your condition or dispatch help. Do not
          wait for an AI response. If possible, ask someone nearby to stay with
          you.
        </p>
        <div className="emergency-actions">
          <a className="button danger" href="tel:112">
            Call 112 · India emergency
          </a>
          <a className="button secondary" href="tel:108">
            Call 108 · Odisha ambulance
          </a>
        </div>
        <p className="caption">
          These links open your device’s dialer when supported. They never call
          automatically. 108 is listed here specifically for Odisha.
        </p>
        <div className="row wrap">
          <a
            className="text-link"
            href="https://www.mha.gov.in/emergency-response-support-system-erss"
            target="_blank"
            rel="noreferrer"
          >
            Official 112 information
            <ExternalLink size={14} />
          </a>
          <a
            className="text-link"
            href="https://nhmodisha.gov.in/patient_transport_2/"
            target="_blank"
            rel="noreferrer"
          >
            Odisha transport information
            <ExternalLink size={14} />
          </a>
        </div>
      </section>
      <Notice />
    </>
  );
}
export function Profile() {
  const { prefs, t, notify, reload } = useSetu();
  const navigate = useNavigate();
  const client = useQueryClient();
  return (
    <>
      <PageHeading eyebrow="YOUR SPACE, YOUR PREFERENCES" title={t.profile} />
      <div className="glass profile-card">
        <div className="profile-avatar">
          {prefs.display_name[0]?.toUpperCase() || "G"}
        </div>
        <h2>{prefs.display_name}</h2>
        <ModeBadge />
        <p>
          {api.mode === "demo"
            ? "Fictional demo profile · no medical records collected"
            : "Signed-in preferences are managed through your account."}
        </p>
      </div>
      <div className="glass settings-card">
        <PreferencesForm />
      </div>
      <div className="row wrap">
        <button
          className="button secondary"
          onClick={async () => {
            await api.logout();
            await reload();
            client.clear();
            navigate("/signin");
          }}
        >
          {t.signOut}
        </button>
        {api.mode === "demo" && (
          <button
            className="button danger-outline"
            onClick={async () => {
              if (
                !window.confirm(
                  "Reset all synthetic documents, feedback, chats and demo preferences on this device?",
                )
              )
                return;
              await api.resetDemo();
              localStorage.removeItem("setu-prefs");
              notify("Demo data reset.");
              window.location.assign("/app");
            }}
          >
            <Trash2 size={16} />
            {t.reset}
          </button>
        )}
        <Link to="/legal/privacy" className="text-link">
          Privacy notice
        </Link>
      </div>
    </>
  );
}
export function AccessibilityPage() {
  const { t } = useSetu();
  return (
    <div className="standalone section-shell">
      <PageHeading
        eyebrow="DESIGNED AROUND YOU"
        title={t.accessibility}
        description="Make this space easier to read and navigate. Your preferences persist on this device."
      />
      <div className="glass settings-card">
        <PreferencesForm />
      </div>
      <p className="muted">
        Keyboard: use Tab to move between controls, Enter to activate, and
        Escape to close dialogs. Voice playback depends on available device
        voices. Text always remains available.
      </p>
    </div>
  );
}
export function FeedbackPage() {
  const { prefs, notify } = useSetu();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      api.feedback({ rating, message, language: prefs.language }),
    onSuccess: () => {
      setSubmitted(true);
      notify("Feedback saved. Thank you for helping shape the prototype.");
    },
  });
  return (
    <div className="standalone section-shell">
      <PageHeading
        eyebrow="HELP SHAPE THE BRIDGE"
        title="Your perspective matters."
        description="Share product feedback using synthetic information only. Please leave out medical records and personal contact details."
      />
      <form
        className="glass settings-card settings-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <label>
          Overall experience
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label>
          Your feedback
          <textarea
            required
            minLength={2}
            maxLength={2000}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSubmitted(false);
            }}
            rows={5}
          />
        </label>
        {mutation.isError && <ErrorState error={mutation.error} />}
        <button className="button" disabled={mutation.isPending || submitted}>
          {submitted
            ? "Feedback saved"
            : mutation.isPending
              ? "Saving…"
              : "Submit feedback"}
          <Send size={16} />
        </button>
        {api.mode === "demo" && (
          <p className="caption">
            Demo feedback is saved locally and appears in the demo admin
            workspace.
          </p>
        )}
      </form>
    </div>
  );
}
