import { useEffect, useId, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  LoaderCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useSetu } from "../context";
import { api } from "../services";
import { languages, type Language } from "@setu/api-contracts";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="SwasthyaSetu AI home">
      <span className="brand-mark">
        <Activity size={21} />
      </span>
      {!compact && (
        <span>
          SwasthyaSetu <small>AI</small>
        </span>
      )}
    </Link>
  );
}
export function ModeBadge() {
  return (
    <span className="mode-badge">
      <i />
      {api.mode === "demo" ? "DEMO ACTIVE" : "REAL MODE · CONNECTION UNCHECKED"}
    </span>
  );
}
export function LanguageSelect() {
  const { prefs, save, t } = useSetu();
  return (
    <label className="language-select">
      <span className="sr-only">{t.language}</span>
      <select
        aria-label={t.language}
        value={prefs.language}
        onChange={(e) => {
          void save({ ...prefs, language: e.target.value as Language });
        }}
      >
        {languages.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function ArrowLink({
  to,
  children,
  className = "",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={`button ${className}`}>
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Loading() {
  return (
    <div role="status" className="skeleton-wrap">
      <LoaderCircle className="spin" />
      <span>Loading your workspace…</span>
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle />
      <div>
        <strong>Something needs attention</strong>
        <p>
          {error instanceof Error
            ? error.message
            : "Unable to load this information."}
        </p>
        {api.mode === "real" && (
          <p>
            A free backend can take a minute to wake up. Check your connection
            and sign-in.
          </p>
        )}
        {retry && (
          <button className="button secondary" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => opener?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="modal"
      aria-labelledby={titleId}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Notice() {
  const { t } = useSetu();
  return (
    <p className="safety-notice">
      <Activity size={16} />
      {t.safety}
    </p>
  );
}
