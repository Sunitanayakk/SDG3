import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Globe2,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
  Pencil,
} from "lucide-react";
import type {
  DocumentRecord,
  Resource,
  ResourceInput,
  UploadInput,
} from "@setu/api-contracts";
import { api } from "../services";
import { useSetu } from "../context";
import { ErrorState, Loading, Modal, PageHeading } from "../components/ui";
import { PreferencesForm } from "../components/Preferences";

const chartColors = ["#c9b8a0", "#8c7560", "#5d6358", "#515151"];
export function Overview() {
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.overview(),
  });
  const analytics = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.analytics(),
  });
  const docs = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.documents(),
  });
  if (overview.isPending) return <Loading />;
  if (overview.isError)
    return (
      <ErrorState
        error={overview.error}
        retry={() => void overview.refetch()}
      />
    );
  const o = overview.data;
  const rows = analytics.data?.rows || [];
  const trend = Object.values(
    rows.reduce<Record<string, { date: string; queries: number }>>((a, r) => {
      a[r.date] ??= { date: r.date, queries: 0 };
      a[r.date].queries += r.queries;
      return a;
    }, {}),
  );
  const distribution = ["en", "hi", "or"].map((l, i) => ({
    name: ["English", "हिन्दी", "ଓଡ଼ିଆ"][i],
    value: rows
      .filter((r) => r.language === l)
      .reduce((n, r) => n + r.queries, 0),
  }));
  return (
    <>
      <PageHeading
        eyebrow="YOUR INTELLIGENCE WORKSPACE"
        title="A clearer picture of care."
        description="Explore the prototype’s activity, knowledge and safety controls."
        action={
          <Link className="button secondary" to="/admin/ai">
            Test the assistant
            <ArrowUpRight size={17} />
          </Link>
        }
      />
      <div className="demo-banner">
        <Sparkles size={16} />
        <strong>
          {o.data_type === "synthetic_demo"
            ? "Synthetic Demo Data"
            : "Aggregate permitted usage"}
        </strong>
        <span>
          {o.data_type === "synthetic_demo"
            ? "Illustrative activity. No real patients or clinical outcomes."
            : "No chat content is included in analytics."}
        </span>
      </div>
      <div className="metric-grid">
        {[
          [
            MessageSquare,
            "Total AI queries",
            o.total_queries.toLocaleString(),
            "Query activity",
          ],
          [
            BookOpen,
            "RAG retrieval success",
            o.retrieval_success_rate + "%",
            "Retrieval availability, not clinical accuracy",
          ],
          [
            FileText,
            "Indexed documents",
            o.indexed_documents,
            "Knowledge records",
          ],
          [
            Globe2,
            "Supported languages",
            o.languages_supported,
            "English · Hindi · Odia",
          ],
          [
            MessageSquare,
            "Feedback submissions",
            o.feedback_submissions,
            "Product feedback",
          ],
          [
            ShieldCheck,
            "Safety rule pass rate",
            o.safety_test_pass_rate === null
              ? "Not run"
              : o.safety_test_pass_rate + "%",
            "Deterministic rules only",
          ],
        ].map(([Icon, label, value, caption]) => {
          const I = Icon as typeof BookOpen;
          return (
            <article className="glass metric-card" key={String(label)}>
              <div className="row between">
                <span>{label as string}</span>
                <I size={18} />
              </div>
              <strong>{value as string | number}</strong>
              <small>{caption as string}</small>
            </article>
          );
        })}
      </div>
      <div className="chart-grid">
        <section className="glass chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Conversations over time</h2>
              <p>
                Last 30 days ·{" "}
                {api.mode === "demo"
                  ? "illustrative queries"
                  : "aggregate queries"}
              </p>
            </div>
            <Link to="/admin/analytics" aria-label="Open analytics">
              <ArrowUpRight size={19} />
            </Link>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="chartGold" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#a78b71" stopOpacity={0.25} />
                    <stop offset="1" stopColor="#a78b71" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff0a" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5)}
                  minTickGap={35}
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#171717",
                    border: "1px solid #444",
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="queries"
                  stroke="#c9b8a0"
                  strokeWidth={2}
                  fill="url(#chartGold)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="glass chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Every language, included</h2>
              <p>Query language distribution</p>
            </div>
            <Globe2 size={18} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={6}
                stroke="none"
              >
                {distribution.map((d, i) => (
                  <Cell fill={chartColors[i]} key={d.name} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#171717",
                  border: "1px solid #444",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {distribution.map((d, i) => (
              <span key={d.name}>
                <i style={{ background: chartColors[i] }} />
                {d.name}
                <strong>{d.value}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>
      <div className="chart-grid">
        <section className="glass chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Knowledge, thoughtfully organized</h2>
              <p>Document categories</p>
            </div>
            <BookOpen size={18} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                "Service navigation",
                "Accessibility",
                "Safety",
                "Digital health",
              ].map((name) => ({
                name,
                documents:
                  docs.data?.filter((d) => d.category === name).length || 0,
              }))}
            >
              <XAxis dataKey="name" tick={{ fill: "#a3a3a3", fontSize: 10 }} />
              <YAxis
                tick={{ fill: "#a3a3a3", fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip contentStyle={{ background: "#171717" }} />
              <Bar
                dataKey="documents"
                fill="#a78b71"
                radius={[5, 5, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="glass quick-panel">
          <span className="eyebrow">RESPONSIBLE BY DESIGN</span>
          <ShieldCheck size={30} />
          <h2>
            Safety is a practice.
            <br />
            <em>Keep testing.</em>
          </h2>
          <p>
            Run the deterministic rule suite and inspect what actually happened.
            Unexecuted cases stay unexecuted.
          </p>
          <Link className="text-link" to="/admin/safety">
            Open safety tests
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
    </>
  );
}

const schema = z.object({
  title: z.string().min(2, "Enter at least two characters.").max(200),
  category: z.string().min(2),
  language: z.enum(["en", "hi", "or"]),
  url: z.union([z.literal(""), z.url()]),
  organization: z.string(),
  verified: z.boolean(),
  publication_date: z.string(),
});
type UploadForm = z.infer<typeof schema>;
function UploadModal({ onClose }: { onClose: () => void }) {
  const { notify } = useSetu();
  const client = useQueryClient();
  const [file, setFile] = useState<File>();
  const form = useForm<UploadForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      category: "Service navigation",
      language: "en",
      url: "",
      organization: "",
      verified: false,
      publication_date: "",
    },
  });
  const mutation = useMutation({
    mutationFn: async (values: UploadForm) => {
      if (!file) throw new Error("Choose a file first.");
      const doc = await api.upload({
        ...values,
        file,
        filename: file.name,
      } as UploadInput);
      if (api.mode === "demo" || values.verified) return api.index(doc.id);
      return doc;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["documents"] });
      void client.invalidateQueries({ queryKey: ["overview"] });
      notify(
        api.mode === "demo"
          ? "Synthetic document uploaded and simulated indexing completed."
          : "Document saved.",
      );
      onClose();
    },
  });
  return (
    <Modal title="Add a knowledge document" onClose={onClose}>
      <p className="muted">
        {api.mode === "demo"
          ? "Demo workflow: file content is not retained. The document record and indexing status are saved locally."
          : "Upload a reviewed source. Only administrator-approved documents are eligible for real retrieval."}
      </p>
      <form
        className="settings-form"
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
      >
        <label className="upload-zone">
          <Upload size={25} />
          <strong>{file?.name || "Choose PDF, TXT or Markdown"}</strong>
          <span>Maximum 5 MB · readable text required</span>
          <input
            type="file"
            accept=".pdf,.txt,.md"
            onChange={(e) => setFile(e.target.files?.[0])}
            aria-label="Document file"
          />
        </label>
        <label>
          Source title
          <input {...form.register("title")} />
          {form.formState.errors.title && (
            <span role="alert">{form.formState.errors.title.message}</span>
          )}
        </label>
        <div className="form-grid">
          <label>
            Category
            <select {...form.register("category")}>
              {[
                "Service navigation",
                "Accessibility",
                "Safety",
                "Digital health",
                "General",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Language
            <select {...form.register("language")}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="or">Odia</option>
            </select>
          </label>
        </div>
        <label>
          Official source URL
          <input type="url" {...form.register("url")} placeholder="https://…" />
          {form.formState.errors.url && (
            <span role="alert">Enter a valid URL.</span>
          )}
        </label>
        <label>
          Authoring organization
          <input {...form.register("organization")} />
        </label>
        <label>
          Publication / update date (optional)
          <input type="date" {...form.register("publication_date")} />
        </label>
        <label className="toggle-row">
          <span>
            I reviewed this source for approval
            <small>Demo sources remain marked illustrative.</small>
          </span>
          <input type="checkbox" {...form.register("verified")} />
        </label>
        {mutation.isError && <ErrorState error={mutation.error} />}
        <button className="button" disabled={mutation.isPending}>
          {mutation.isPending ? "Uploading & indexing…" : "Add document"}
          <Upload size={16} />
        </button>
      </form>
    </Modal>
  );
}
export function Documents({ knowledge = false }: { knowledge?: boolean }) {
  const { notify } = useSetu();
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");
  const [upload, setUpload] = useState(false);
  const [detail, setDetail] = useState<DocumentRecord>();
  const docs = useQuery({
    queryKey: ["documents", q, language, category],
    queryFn: () => api.documents({ q, language, category }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["documents"] });
      notify("Document removed from knowledge base.");
    },
  });
  const indexing = useMutation({
    mutationFn: (id: string) => api.index(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["documents"] });
      notify("Indexing completed.");
    },
  });
  return (
    <>
      <PageHeading
        eyebrow="EVIDENCE BEFORE ANSWERS"
        title={knowledge ? "Your trusted knowledge." : "Document library."}
        description="Review, organize and index source documents. Synthetic demo sources are never presented as verified medical evidence."
        action={
          <button className="button" onClick={() => setUpload(true)}>
            <Plus size={17} />
            Add document
          </button>
        }
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search documents"
            placeholder="Search knowledge documents…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          aria-label="Document language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="or">Odia</option>
        </select>
        <select
          aria-label="Document category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {[
            "Service navigation",
            "Accessibility",
            "Safety",
            "Digital health",
            "General",
          ].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="caption">
          <Filter size={13} />
          {docs.data?.length || 0} documents
        </span>
      </div>
      {remove.isError && <ErrorState error={remove.error} />}{" "}
      {indexing.isError && <ErrorState error={indexing.error} />}{" "}
      {docs.isPending ? (
        <Loading />
      ) : docs.isError ? (
        <ErrorState error={docs.error} retry={() => void docs.refetch()} />
      ) : (
        <div className="table-wrap glass">
          <table>
            <thead>
              <tr>
                <th>Document / source</th>
                <th>Category</th>
                <th>Language</th>
                <th>Source review</th>
                <th>Index status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {docs.data.map((d) => (
                <tr key={d.id}>
                  <td>
                    <button
                      className="document-title"
                      onClick={() =>
                        api
                          .document(d.id)
                          .then(setDetail)
                          .catch((e) => notify(e.message))
                      }
                    >
                      <span className="file-icon">
                        <FileText size={19} />
                      </span>
                      <span>
                        {d.title}
                        <small>
                          {new Date(d.created_at).toLocaleDateString()} ·{" "}
                          {d.organization}
                        </small>
                      </span>
                    </button>
                  </td>
                  <td>{d.category}</td>
                  <td>{d.language.toUpperCase()}</td>
                  <td>
                    <span className={`status ${d.verified ? "success" : ""}`}>
                      {d.verified ? "Reviewed" : "Illustrative / unreviewed"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status ${d.status === "failed" ? "failed" : d.status === "indexed" ? "success" : ""}`}
                    >
                      {d.status === "indexed" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Clock size={12} />
                      )}{" "}
                      {indexing.isPending && indexing.variables === d.id
                        ? "indexing"
                        : d.status}
                    </span>
                  </td>
                  <td>
                    <div className="row">
                      <button
                        className="icon-button"
                        aria-label={`Index ${d.title}`}
                        disabled={indexing.isPending}
                        onClick={() => indexing.mutate(d.id)}
                      >
                        <Sparkles size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${d.title}`}
                        disabled={remove.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove “${d.title}” and its retrieval chunks?`,
                            )
                          )
                            remove.mutate(d.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!docs.data.length && (
            <div className="empty-state">
              No documents match your filters. Add a source or change the
              filters.
            </div>
          )}
        </div>
      )}
      {upload && <UploadModal onClose={() => setUpload(false)} />}{" "}
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(undefined)}>
          <dl className="detail-list">
            {[
              ["Organization", detail.organization],
              ["Category", detail.category],
              ["Language", detail.language],
              [
                "Review",
                detail.verified ? "Reviewed" : "Unreviewed / synthetic",
              ],
              ["Index", detail.status],
              ["Ingested", detail.created_at],
              ["Updated / published", detail.publication_date || "Unknown"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {detail.url && (
            <a
              href={detail.url}
              className="text-link"
              target="_blank"
              rel="noreferrer"
            >
              Open original source
              <ArrowUpRight size={15} />
            </a>
          )}
          <p className="snippet">{detail.content}</p>
          {detail.error && <p className="error-text">{detail.error}</p>}
        </Modal>
      )}
    </>
  );
}

export function Analytics() {
  const [language, setLanguage] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const result = useQuery({
    queryKey: ["analytics", language, start, end],
    queryFn: () => api.analytics({ language, start, end }),
  });
  const rows = result.data?.rows || [];
  function download() {
    const csv =
      "date,language,queries,retrieved,feedback\n" +
      rows
        .map((r) =>
          [r.date, r.language, r.queries, r.retrieved, r.feedback].join(","),
        )
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "swasthyasetu-aggregate-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow="UNDERSTAND THE PATTERNS"
        title="Activity, with perspective."
        description={
          api.mode === "demo"
            ? "Synthetic Demo Data · illustrative activity only."
            : "Anonymous aggregate usage only; no private conversation content."
        }
        action={
          <button
            className="button secondary"
            onClick={download}
            disabled={!rows.length}
          >
            <Download size={16} />
            Export CSV
          </button>
        }
      />
      <div className="filter-bar">
        <label>
          From
          <input
            type="date"
            aria-label="Start date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            aria-label="End date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <label>
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">All languages</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="or">Odia</option>
          </select>
        </label>
        <button
          className="button secondary"
          onClick={() => {
            setStart("");
            setEnd("");
            setLanguage("");
          }}
        >
          Reset filters
        </button>
      </div>
      <div className="three-grid analytics-totals">
        {[
          ["Queries", rows.reduce((n, r) => n + r.queries, 0)],
          ["Retrieved", rows.reduce((n, r) => n + r.retrieved, 0)],
          ["Feedback", rows.reduce((n, r) => n + r.feedback, 0)],
        ].map(([k, v]) => (
          <div className="glass metric-card" key={k}>
            <span>{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      {result.isError ? (
        <ErrorState error={result.error} />
      ) : result.isPending ? (
        <Loading />
      ) : (
        <section className="glass chart-panel">
          <h2>Query & feedback trends</h2>
          {rows.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={rows}>
                <CartesianGrid vertical={false} stroke="#ffffff0b" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5)}
                  minTickGap={40}
                  tick={{ fill: "#aaa", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "#aaa" }} />
                <Tooltip
                  contentStyle={{
                    background: "#171717",
                    border: "1px solid #444",
                  }}
                />
                <Bar dataKey="queries" fill="#c9b8a0" />
                <Bar dataKey="feedback" fill="#626b60" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">
              No activity in this date and language range.
            </p>
          )}
        </section>
      )}
    </>
  );
}

export function Safety() {
  const { notify } = useSetu();
  const client = useQueryClient();
  const cases = useQuery({
    queryKey: ["safety"],
    queryFn: () => api.safetyTests(),
  });
  const run = useMutation({
    mutationFn: () => api.safetyTests(true),
    onSuccess: (data) => {
      client.setQueryData(["safety"], data);
      void client.invalidateQueries({ queryKey: ["overview"] });
      notify("Rule suite executed. Results reflect this run.");
    },
  });
  return (
    <>
      <PageHeading
        eyebrow="SAFETY IS A PRACTICE"
        title="Test. Inspect. Improve."
        description="These cases evaluate deterministic rule classification. They do not establish clinical triage accuracy, translation quality or LLM safety."
        action={
          <button
            className="button"
            onClick={() => run.mutate()}
            disabled={run.isPending}
          >
            <ShieldCheck size={17} />
            {run.isPending ? "Running cases…" : "Run safety rules"}
          </button>
        }
      />
      {run.isError && <ErrorState error={run.error} />}{" "}
      {cases.isPending ? (
        <Loading />
      ) : cases.isError ? (
        <ErrorState error={cases.error} />
      ) : (
        <div className="safety-grid">
          {cases.data.map((c) => (
            <article className="glass safety-card" key={c.id}>
              <div className="row between">
                <span className="eyebrow">{c.category}</span>
                <span
                  className={`status ${c.passed === null ? "" : c.passed ? "success" : "failed"}`}
                >
                  {c.passed === null ? (
                    <Clock size={13} />
                  ) : c.passed ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <XCircle size={13} />
                  )}{" "}
                  {c.passed === null
                    ? "Not executed"
                    : c.passed
                      ? "Passed"
                      : "Failed"}
                </span>
              </div>
              <p>{c.question}</p>
              <div className="row wrap caption">
                <span>
                  Expected: <strong>{c.expected}</strong>
                </span>
                <span>
                  Actual: <strong>{c.actual || "—"}</strong>
                </span>
                <span>{c.language.toUpperCase()}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
export function FeedbackAdmin() {
  const [language, setLanguage] = useState("");
  const rows = useQuery({
    queryKey: ["feedback"],
    queryFn: () => api.feedbackList(),
  });
  return (
    <>
      <PageHeading
        eyebrow="LISTENING IS PART OF BUILDING"
        title="Voices that shape the bridge."
      />
      <div className="filter-bar">
        <select
          aria-label="Feedback language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="or">Odia</option>
        </select>
      </div>
      {rows.isPending ? (
        <Loading />
      ) : rows.isError ? (
        <ErrorState error={rows.error} />
      ) : (
        <div className="safety-grid">
          {rows.data
            .filter((f) => !language || f.language === language)
            .map((f) => (
              <article className="glass safety-card" key={f.id}>
                <div className="row between">
                  <span className="gold">
                    {"★".repeat(f.rating)}
                    {"☆".repeat(5 - f.rating)}
                  </span>
                  <span className="caption">
                    {f.synthetic ? "Synthetic demo" : "Product feedback"} ·{" "}
                    {f.language.toUpperCase()}
                  </span>
                </div>
                <p>{f.message}</p>
                <small className="muted">
                  {new Date(f.created_at).toLocaleDateString()}
                </small>
              </article>
            ))}
        </div>
      )}
    </>
  );
}

function ResourceEditor({
  resource,
  onClose,
}: {
  resource?: Resource;
  onClose: () => void;
}) {
  const { notify } = useSetu();
  const client = useQueryClient();
  const [draft, setDraft] = useState<ResourceInput>(
    resource || {
      name: "",
      type: "Service navigation",
      description: "",
      notes: "Availability is not monitored.",
      url: "",
      phone: null,
      verified: false,
    },
  );
  const save = useMutation({
    mutationFn: () => api.saveResource(draft, resource?.id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["resources"] });
      notify("Resource saved.");
      onClose();
    },
  });
  return (
    <Modal
      title={resource ? "Edit healthcare resource" : "Add healthcare resource"}
      onClose={onClose}
    >
      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {(
          ["name", "type", "description", "notes", "url", "phone"] as const
        ).map((k) => (
          <label key={k}>
            {k === "url" ? "Official URL" : k[0].toUpperCase() + k.slice(1)}
            <input
              required={k !== "phone"}
              type={k === "url" ? "url" : "text"}
              maxLength={
                k === "description" || k === "notes"
                  ? 2000
                  : k === "url"
                    ? 1000
                    : 200
              }
              value={draft[k] || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  [k]: e.target.value || (k === "phone" ? null : ""),
                })
              }
            />
          </label>
        ))}
        <label className="toggle-row">
          <span>Official source reviewed</span>
          <input
            type="checkbox"
            checked={draft.verified}
            onChange={(e) => setDraft({ ...draft, verified: e.target.checked })}
          />
        </label>
        {save.isError && <ErrorState error={save.error} />}
        <button className="button" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save resource"}
        </button>
      </form>
    </Modal>
  );
}
export function ResourceAdmin() {
  const { notify } = useSetu();
  const client = useQueryClient();
  const [editor, setEditor] = useState<Resource | "new">();
  const [q, setQ] = useState("");
  const rows = useQuery({
    queryKey: ["resources"],
    queryFn: () => api.resources(),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteResource(id),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["resources"] }),
    onError: (e) => notify(e.message),
  });
  return (
    <>
      <PageHeading
        eyebrow="A DIRECTORY WITH CLEAR LIMITS"
        title="Healthcare service navigation."
        description="Maintain official links and clearly label illustrative examples. No live service availability is implied."
        action={
          <button className="button" onClick={() => setEditor("new")}>
            <Plus size={16} />
            Add resource
          </button>
        }
      />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search service directory"
            placeholder="Search services…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>
      {rows.isPending ? (
        <Loading />
      ) : rows.isError ? (
        <ErrorState error={rows.error} />
      ) : (
        <div className="resource-grid">
          {rows.data
            .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
            .map((r) => (
              <article className="glass resource-card" key={r.id}>
                <span className="status">
                  {r.verified
                    ? "Reviewed official service"
                    : "Illustrative example"}
                </span>
                <h2>{r.name}</h2>
                <p>{r.description}</p>
                <p className="caption">{r.notes}</p>
                <div className="row">
                  <button
                    className="button secondary small"
                    onClick={() => setEditor(r)}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => {
                      if (window.confirm(`Remove ${r.name}?`))
                        remove.mutate(r.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <a
                    className="text-link"
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </article>
            ))}
        </div>
      )}
      {editor && (
        <ResourceEditor
          resource={editor === "new" ? undefined : editor}
          onClose={() => setEditor(undefined)}
        />
      )}
    </>
  );
}
export function AdminSettings() {
  const { notify } = useSetu();
  const check = useMutation({
    mutationFn: () => api.providerHealth(),
    onSuccess: (r) =>
      notify(
        r.provider_connected
          ? "AI CONNECTED · live inference request succeeded."
          : "DEMO ACTIVE · no live provider was called.",
      ),
  });
  return (
    <>
      <PageHeading
        eyebrow="CONFIGURATION & PREFERENCES"
        title="Make the workspace yours."
      />
      <div className="glass settings-card">
        <h2>Provider readiness</h2>
        <p className="muted">
          {api.mode === "demo"
            ? "Demo Mode uses documented scripts. No NVIDIA or embedding calls occur."
            : "Real mode uses backend-only credentials. This probe sends a small inference request and may consume quota."}
        </p>
        <button
          className="button secondary"
          onClick={() => check.mutate()}
          disabled={check.isPending}
        >
          {check.isPending ? "Checking provider…" : "Check provider connection"}
        </button>
        {check.isError && <ErrorState error={check.error} />}
        <p className="caption">
          NVIDIA, Supabase and embedding configuration lives in server
          environment variables. Secrets are never editable in this frontend.
        </p>
      </div>
      <div className="glass settings-card">
        <PreferencesForm />
      </div>
    </>
  );
}
