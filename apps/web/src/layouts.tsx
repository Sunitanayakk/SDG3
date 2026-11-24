import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Menu,
  X,
  MessageSquare,
  BookOpen,
  LayoutDashboard,
  Files,
  ChartNoAxesCombined,
  ShieldCheck,
  Settings,
  HeartPulse,
  LogOut,
  PanelLeftClose,
  Accessibility,
  CircleHelp,
  Home,
  ClipboardList,
  Languages,
} from "lucide-react";
import {
  Brand,
  LanguageSelect,
  ModeBadge,
  ErrorState,
  Loading,
} from "./components/ui";
import { api } from "./services";
import { useSetu } from "./context";

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="public-nav">
        <Brand />
        <div className={`nav-links ${open ? "open" : ""}`}>
          {[
            ["Home", "/"],
            ["Features", "/#features"],
            ["How It Works", "/#how-it-works"],
            ["Accessibility", "/#accessibility"],
            ["SDG Impact", "/#impact"],
          ].map(([text, link]) => (
            <a key={text} href={link} onClick={() => setOpen(false)}>
              {text}
            </a>
          ))}
        </div>
        <div className="nav-actions">
          <LanguageSelect />
          <Link className="sign-in" to="/signin">
            Sign in
          </Link>
          <Link className="button small" to="/app/chat">
            Start free
            <ArrowUpRight size={15} />
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      <main id="main" key={loc.pathname}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>
            Intelligent care.
            <br />
            Accessible to everyone.
          </p>
          <span className="caption">A responsible healthcare prototype.</span>
        </div>
        {[
          [
            "Product",
            ["AI Assistant", "/app/chat"],
            ["Healthcare services", "/app/resources"],
            ["Admin workspace", "/signin?admin=1"],
          ],
          [
            "Accessibility",
            ["Preferences", "/accessibility"],
            ["Accessibility statement", "/legal/accessibility"],
          ],
          [
            "Resources",
            ["How it works", "/#how-it-works"],
            ["SDG impact", "/#impact"],
            ["Medical disclaimer", "/legal/medical"],
          ],
          [
            "Contact",
            ["Share feedback", "/feedback"],
            ["Privacy notice", "/legal/privacy"],
          ],
        ].map(([title, ...links]) => (
          <div key={String(title)}>
            <h3>{title as string}</h3>
            {(links as string[][]).map(([label, url]) => (
              <Link key={label} to={url}>
                {label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} SwasthyaSetu AI. Built with a purpose.
        </span>
        <span>
          SDG 03 · GOOD HEALTH & WELL-BEING <i /> SDG 10 · REDUCED INEQUALITIES
        </span>
      </div>
    </footer>
  );
}
const adminLinks = [
  ["Overview", "overview", LayoutDashboard],
  ["AI Assistant Testing", "ai", MessageSquare],
  ["Knowledge Base", "knowledge", BookOpen],
  ["Documents", "documents", Files],
  ["Healthcare Services", "services", HeartPulse],
  ["Analytics", "analytics", ChartNoAxesCombined],
  ["User Feedback", "feedback", CircleHelp],
  ["Safety Tests", "safety", ShieldCheck],
  ["Settings", "settings", Settings],
] as const;
export function AdminLayout() {
  const { reload } = useSetu();
  const [open, setOpen] = useState(false);
  const check = useQuery({
    queryKey: ["admin-access"],
    queryFn: () => api.overview(),
    retry: false,
  });
  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-menu"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <PanelLeftClose />
          </button>
        </div>
        <span className="eyebrow sidebar-label">ADMIN WORKSPACE</span>
        <nav>
          {adminLinks.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={"/admin/" + path}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-avatar">
            S
            <span>
              {api.mode === "demo"
                ? "Synthetic administrator"
                : "Administrator"}
              <small>
                {api.mode === "demo"
                  ? "Prototype workspace"
                  : "Authenticated workspace"}
              </small>
            </span>
          </div>
          <Link to="/app">
            <ArrowUpRight size={16} />
            Patient portal
          </Link>
          <Link
            to="/signin"
            onClick={async () => {
              await api.logout();
              await reload();
            }}
          >
            <LogOut size={16} />
            Sign out
          </Link>
        </div>
      </aside>
      {open && (
        <button
          className="drawer-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="workspace-content">
        <header className="workspace-top">
          <button
            className="icon-button mobile-menu"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> <span>Healthcare intelligence</span>
          </div>
          <div className="row">
            <ModeBadge />
            <LanguageSelect />
          </div>
        </header>
        <main id="main" className="workspace-main">
          {check.isPending ? (
            <Loading />
          ) : check.isError ? (
            <>
              <ErrorState error={check.error} />
              <Link className="button" to="/signin?admin=1">
                Sign in to administration
              </Link>
            </>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
export function PatientLayout() {
  const { t } = useSetu();
  return (
    <div className="patient-shell">
      <header className="patient-top">
        <Brand />
        <div className="row">
          <ModeBadge />
          <LanguageSelect />
        </div>
      </header>
      <div className="patient-wrap">
        <nav className="patient-nav">
          {[
            [t.home, "/app", Home],
            [t.chat, "/app/chat", MessageSquare],
            [t.resources, "/app/resources", BookOpen],
            ["Access toolkit", "/app/tools", Accessibility],
            ["Communication", "/app/communicate", Languages],
            ["Visit planner", "/app/planner", ClipboardList],
            ["Easy-read library", "/app/library", BookOpen],
            [t.profile, "/app/profile", Settings],
          ].map(([title, to, Icon]) => {
            const I = Icon as typeof Home;
            return (
              <NavLink end={to === "/app"} key={String(to)} to={String(to)}>
                <I size={19} />
                {title as string}
              </NavLink>
            );
          })}
          <Link className="emergency-link" to="/app/emergency">
            <HeartPulse size={18} />
            {t.emergency}
          </Link>
          <Link to="/app/preferences">
            <Accessibility size={18} />
            {t.accessibility}
          </Link>
        </nav>
        <main id="main" className="patient-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
