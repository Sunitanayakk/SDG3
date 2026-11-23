import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../services";
import { Brand, ErrorState } from "../components/ui";
import { useSetu } from "../context";
export default function Auth() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const admin = search.has("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<Error>();
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();
  const { reload } = useSetu();
  async function enter(asAdmin: boolean) {
    setBusy(true);
    setError(undefined);
    try {
      await api.login(email, password, asAdmin);
      await reload();
      client.clear();
      navigate(asAdmin ? "/admin/overview" : "/app");
    } catch (e) {
      setError(e as Error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <Link to="/" className="auth-back">
        ← Back to SwasthyaSetu
      </Link>
      <div className="auth-story">
        <span className="eyebrow">A BRIDGE TO UNDERSTANDING</span>
        <h1>
          Care begins
          <br />
          with <em>connection.</em>
        </h1>
        <p>Intelligent care. Accessible to everyone.</p>
        <div className="auth-art">
          <Sparkles size={65} strokeWidth={0.7} />
        </div>
        <span className="caption">RESPONSIBLE AI · HUMAN PURPOSE</span>
      </div>
      <div className="auth-form glass">
        <Brand />
        <span className="eyebrow">
          {api.mode === "demo" ? "EXPLORE THE PROTOTYPE" : "WELCOME BACK"}
        </span>
        <h2>
          {admin ? "Your intelligence workspace." : "A clearer next step."}
        </h2>
        <p>
          {api.mode === "demo"
            ? "No account, credentials or personal information needed. Everything in this demo is synthetic."
            : "Sign in with an existing Supabase account. Contact the project owner to provision access."}
        </p>
        {api.mode === "demo" ? (
          <div className="settings-form">
            <button
              className="button"
              disabled={busy}
              onClick={() => void enter(false)}
            >
              Continue as demo guest
              <ArrowUpRight size={17} />
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void enter(true)}
            >
              Enter demo admin
              <ShieldCheck size={17} />
            </button>
            <small>
              Demo administration changes only local synthetic data.
            </small>
          </div>
        ) : (
          <form
            className="settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              void enter(admin);
            }}
          >
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
              <ArrowUpRight size={17} />
            </button>
            <Link
              className="text-link"
              to={admin ? "/signin" : "/signin?admin=1"}
            >
              {admin ? "Patient sign in" : "Administrator sign in"}
            </Link>
          </form>
        )}
        {error && <ErrorState error={error} />}
        <div className="auth-notice">
          <ShieldCheck size={17} />
          <span>
            General information. Never diagnosis.
            <br />
            Your wellbeing comes before an answer.
          </span>
        </div>
      </div>
    </main>
  );
}
