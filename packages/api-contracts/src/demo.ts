import fixtures from "./fixtures.json";
import { defaultPreferences } from "./i18n";
import { classify, disclaimer, emergencyText } from "./safety";
import type {
  Api,
  ChatRequest,
  ChatResponse,
  DocumentRecord,
  Feedback,
  Filters,
  Preferences,
  Resource,
  SafetyCase,
  Session,
  Storage,
} from "./types";

const KEY = "setu-demo-v1";
type State = {
  documents: DocumentRecord[];
  resources: Resource[];
  sessions: Session[];
  feedback: Feedback[];
  safety: SafetyCase[];
  prefs: Preferences;
  admin: boolean;
};
const seed = (): State =>
  JSON.parse(
    JSON.stringify({ ...fixtures, prefs: defaultPreferences, admin: false }),
  );
const uid = () =>
  `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const delay = () => new Promise((resolve) => setTimeout(resolve, 240));
export function createDemoApi(storage: Storage): Api {
  let chain: Promise<unknown> = Promise.resolve();
  async function read(): Promise<State> {
    const raw = await storage.getItem(KEY);
    return raw ? JSON.parse(raw) : seed();
  }
  async function change<T>(fn: (s: State) => T | Promise<T>): Promise<T> {
    const job = chain.then(async () => {
      const s = await read();
      const result = await fn(s);
      await storage.setItem(KEY, JSON.stringify(s));
      return result;
    });
    chain = job.catch(() => {});
    return job;
  }
  const guard = async () => {
    if (!(await read()).admin)
      throw new Error(
        "Administrator access required. Enter through Demo admin.",
      );
  };
  const findDoc = (s: State, id: string) => {
    const d = s.documents.find((d) => d.id === id);
    if (!d) throw new Error("Document not found");
    return d;
  };
  const api: Api = {
    mode: "demo",
    config: async () => ({ demo_mode: true, provider_connected: false }),
    login: async (_e, _p, admin = false) => {
      await change((s) => {
        s.admin = admin;
      });
      return {
        access_token: "browser-local-demo",
        role: admin ? "admin" : "patient",
        mode: "demo",
      };
    },
    logout: async () => {
      await change((s) => {
        s.admin = false;
      });
    },
    async chat(req: ChatRequest, technical = false): Promise<ChatResponse> {
      if (technical) await guard();
      if (!req.message.trim() || req.message.length > 4000)
        throw new Error("Enter a question of 1–4000 characters.");
      await delay();
      const safety_level = classify(req.message);
      let reply = "";
      let citations: ChatResponse["citations"] = [];
      if (safety_level === "emergency") reply = emergencyText[req.language];
      else if (safety_level === "restricted")
        reply = {
          en: "I cannot diagnose or recommend prescription doses. Please speak with a qualified healthcare professional.",
          hi: "मैं निदान या दवा की खुराक नहीं बता सकता। कृपया योग्य स्वास्थ्य पेशेवर से बात करें।",
          or: "ମୁଁ ରୋଗ ନିର୍ଣ୍ଣୟ କିମ୍ବା ଔଷଧ ମାତ୍ରା କହିପାରିବି ନାହିଁ। ଦୟାକରି ଯୋଗ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ପେଶାଦାରଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।",
        }[req.language];
      else if (safety_level === "injection")
        reply =
          "I cannot follow instructions to bypass safety rules or disclose private prompts.";
      else if (/doctor|online|डॉक्टर|चिकित्सक|ଡାକ୍ତର|ଅନଲାଇନ/i.test(req.message)) {
        reply = {
          en: "Demo example: eSanjeevani is a government telemedicine service. Visit the official portal from Resources to check registration and service schedules. This prototype cannot book a consultation or confirm live availability.",
          hi: "डेमो उदाहरण: eSanjeevani एक सरकारी टेलीमेडिसिन सेवा है। पंजीकरण और समय की जानकारी आधिकारिक पोर्टल पर देखें। यह प्रोटोटाइप बुकिंग नहीं करता।",
          or: "ଡେମୋ ଉଦାହରଣ: eSanjeevani ଏକ ସରକାରୀ ଟେଲିମେଡିସିନ ସେବା। ପଞ୍ଜୀକରଣ ଓ ସମୟ ପାଇଁ ଅଧିକୃତ ପୋର୍ଟାଲ୍ ଦେଖନ୍ତୁ। ଏହି ପ୍ରୋଟୋଟାଇପ୍ ବୁକିଂ କରେ ନାହିଁ।",
        }[req.language];
        if (req.use_rag)
          citations = [
            {
              source_id: "demo-source-001",
              title: "Illustrative service navigation guide",
              url: null,
              verified: false,
              label: "S1",
            },
          ];
      } else if (/accessibility|large text|भाषा|ଅକ୍ଷର/i.test(req.message))
        reply = {
          en: "Demo example: open Accessibility to change text size, contrast, motion, voice playback and language. Text interaction is always available.",
          hi: "डेमो उदाहरण: अक्षर आकार, कंट्रास्ट, गति और भाषा बदलने के लिए सुलभता खोलें।",
          or: "ଡେମୋ ଉଦାହରଣ: ଅକ୍ଷର ଆକାର, କଣ୍ଟ୍ରାଷ୍ଟ, ଗତି ଓ ଭାଷା ବଦଳାଇବାକୁ ସୁଗମ୍ୟତା ଖୋଲନ୍ତୁ।",
        }[req.language];
      else
        reply =
          "Demo content: no scripted example is available for this question. Real AI is not configured. Try “How can I access a doctor online?” or “How can I use large text?”";
      const response: ChatResponse = {
        session_id: req.session_id || uid(),
        message_id: uid(),
        reply,
        language: req.language,
        mode: "demo",
        safety_level,
        citations,
        retrieval: {
          used: !!citations.length,
          document_count: citations.length,
        },
        disclaimer,
        translation_notice:
          req.language === "en"
            ? null
            : "Medical translations require professional validation.",
      };
      if (technical)
        Object.assign(response, {
          snippets: citations.map((c) => ({
            ...c,
            snippet:
              "Synthetic retrieval example. No semantic embedding was called.",
            score: 0.89,
          })),
          latency_ms: 240,
          model_status: "scripted_demo",
        });
      if (req.persist)
        await change((s) => {
          let session = s.sessions.find((x) => x.id === response.session_id);
          if (!session) {
            session = {
              id: response.session_id,
              title: req.message.slice(0, 80),
              language: req.language,
              created_at: new Date().toISOString(),
              messages: [],
            };
            s.sessions.unshift(session);
          }
          session.messages ??= [];
          session.messages.push(
            { id: uid(), role: "user", content: req.message, citations: [] },
            {
              id: response.message_id,
              role: "assistant",
              content: reply,
              citations,
              safety_level,
              mode: "demo",
            },
          );
        });
      return response;
    },
    sessions: async () => (await read()).sessions,
    session: async (id) => {
      const s = (await read()).sessions.find((s) => s.id === id);
      if (!s) throw new Error("Conversation not found");
      return s;
    },
    deleteSession: async (id) => {
      await change((s) => {
        s.sessions = s.sessions.filter((x) => x.id !== id);
      });
    },
    preferences: async () => (await read()).prefs,
    savePreferences: async (prefs) =>
      change((s) => {
        s.prefs = prefs;
        return prefs;
      }),
    resources: async () => (await read()).resources,
    saveResource: async (input, id) => {
      await guard();
      if (
        !/^https?:\/\//i.test(input.url) ||
        input.name.trim().length < 2 ||
        input.description.trim().length < 4
      )
        throw new Error("Use an HTTP(S) source URL, a name and a description.");
      return change((s) => {
        const r = { ...input, id: id || uid() };
        s.resources = s.resources.filter((x) => x.id !== r.id);
        s.resources.push(r);
        return r;
      });
    },
    deleteResource: async (id) => {
      await guard();
      await change((s) => {
        s.resources = s.resources.filter((x) => x.id !== id);
      });
    },
    feedback: async (input) => {
      if (input.message.trim().length < 2)
        throw new Error("Please add a message.");
      return change((s) => {
        const f = {
          ...input,
          id: uid(),
          synthetic: true,
          created_at: new Date().toISOString(),
        };
        s.feedback.unshift(f);
        return f;
      });
    },
    feedbackList: async () => {
      await guard();
      return (await read()).feedback;
    },
    overview: async () => {
      await guard();
      const s = await read();
      const queries = fixtures.analytics.reduce((n, r) => n + r.queries, 0);
      const tests = s.safety.filter((x) => x.actual !== null);
      return {
        total_queries: queries,
        indexed_documents: s.documents.filter((x) => x.status === "indexed")
          .length,
        languages_supported: 3,
        feedback_submissions: s.feedback.length,
        retrieval_success_rate:
          Math.round(
            (fixtures.analytics.reduce((n, r) => n + r.retrieved, 0) /
              queries) *
              1000,
          ) / 10,
        safety_test_pass_rate: tests.length
          ? (100 * tests.filter((x) => x.passed).length) / tests.length
          : null,
        data_type: "synthetic_demo",
      };
    },
    analytics: async (f: Filters = {}) => {
      await guard();
      return {
        rows: fixtures.analytics.filter(
          (r) =>
            (!f.language || r.language === f.language) &&
            (!f.start || r.date >= f.start) &&
            (!f.end || r.date <= f.end),
        ),
        data_type: "synthetic_demo",
      };
    },
    documents: async (f = {}) => {
      await guard();
      return (await read()).documents.filter(
        (d) =>
          (!f.q || d.title.toLowerCase().includes(f.q.toLowerCase())) &&
          (!f.language || d.language === f.language) &&
          (!f.category || d.category === f.category),
      );
    },
    document: async (id) => {
      await guard();
      return findDoc(await read(), id);
    },
    upload: async (input) => {
      await guard();
      if (!/\.(pdf|txt|md)$/i.test(input.filename))
        throw new Error("Only PDF, TXT and Markdown are accepted.");
      if (input.file.size > 5 * 1024 * 1024 || !input.file.size)
        throw new Error("File must be nonempty and under 5 MB.");
      if (input.title.length < 2) throw new Error("Add a document title.");
      await delay();
      return change((s) => {
        const d: DocumentRecord = {
          id: uid(),
          source_id: uid(),
          title: input.title,
          category: input.category,
          language: input.language,
          status: "uploaded",
          synthetic: true,
          url: input.url || null,
          organization: input.organization || "Synthetic demonstration",
          verified: false,
          created_at: new Date().toISOString(),
          content:
            "Synthetic simulated upload. No file content is retained by the browser demo.",
        };
        s.documents.unshift(d);
        return d;
      });
    },
    index: async (id) => {
      await guard();
      await change((s) => {
        findDoc(s, id).status = "indexing";
      });
      await delay();
      return change((s) => {
        const d = findDoc(s, id);
        d.status = "indexed";
        return d;
      });
    },
    deleteDocument: async (id) => {
      await guard();
      await change((s) => {
        s.documents = s.documents.filter((x) => x.id !== id);
      });
    },
    safetyTests: async (run) => {
      await guard();
      if (run)
        return change((s) => {
          s.safety = s.safety.map((c) => ({
            ...c,
            actual: classify(c.question),
            passed: classify(c.question) === c.expected,
          }));
          return s.safety;
        });
      return (await read()).safety;
    },
    providerHealth: async () => {
      await guard();
      return { provider_connected: false, mode: "demo" };
    },
    resetDemo: async () => {
      await storage.removeItem(KEY);
    },
  };
  return api;
}
