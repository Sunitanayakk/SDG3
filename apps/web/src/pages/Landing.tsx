import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowUpRight,
  ArrowDown,
  ShieldCheck,
  Globe2,
  HeartPulse,
  AudioLines,
  BookOpen,
  Compass,
  Check,
  Sparkles,
  Users,
  HandHeart,
  Accessibility,
  ArrowRight,
} from "lucide-react";
import { ArrowLink, ModeBadge } from "../components/ui";
import { NeuralCore } from "../components/NeuralCore";
import { useSetu } from "../context";
const features = [
  {
    Icon: HeartPulse,
    num: "01",
    title: "A little understanding.\nA healthier beginning.",
    name: "Intelligent AI Health Assistant",
    body: "Ask in your own words. Find understandable healthcare information, with clear limits and thoughtful guidance.",
    to: "/app/chat",
    tag: "CONVERSATIONAL INTELLIGENCE",
  },
  {
    Icon: BookOpen,
    num: "02",
    title: "Answers connected\nto their sources.",
    name: "Trusted Knowledge Through RAG",
    body: "Go beyond an answer. Explore the documents behind it and understand where your information comes from.",
    to: "/app/resources",
    tag: "GROUNDED IN KNOWLEDGE",
  },
  {
    Icon: AudioLines,
    num: "03",
    title: "Your language.\nYour way of connecting.",
    name: "Multilingual Accessibility",
    body: "English, हिन्दी, ଓଡ଼ିଆ. Adjustable text, contrast, and voice playback help make information more accessible.",
    to: "/accessibility",
    tag: "BUILT FOR INCLUSION",
  },
  {
    Icon: Compass,
    num: "04",
    title: "The next step,\nmade a little clearer.",
    name: "Healthcare Service Navigation",
    body: "Find official healthcare portals and public services. Clear directions, without promises of availability.",
    to: "/app/resources",
    tag: "A BRIDGE TO CARE",
  },
];
export default function Landing() {
  const hero = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { prefs, save } = useSetu();
  const loc = useLocation();
  useEffect(() => {
    if (loc.hash)
      document.querySelector(loc.hash)?.scrollIntoView({ behavior: "smooth" });
  }, [loc]);
  useEffect(() => {
    if (reduce || prefs.reduced_motion) return;
    const ctx = gsap.context(
      () =>
        gsap.from(".hero-reveal", {
          opacity: 0,
          y: 25,
          stagger: 0.11,
          duration: 1.2,
          ease: "power4.out",
        }),
      hero,
    );
    return () => ctx.revert();
  }, [reduce, prefs.reduced_motion]);
  return (
    <>
      <section className="hero section-shell" ref={hero}>
        <div className="hero-kicker hero-reveal">
          <span className="tiny-cross">+</span> A BRIDGE TO BETTER HEALTHCARE{" "}
          <span className="kicker-line" />
        </div>
        <div className="hero-top">
          <div className="hero-copy">
            <h1 className="hero-reveal">
              Healthcare
              <br />
              Intelligence,
              <br />
              <em>For Everyone.</em>
            </h1>
            <p className="hero-reveal hero-description">
              An accessible AI companion connecting people with trustworthy
              health information through multilingual conversations, intelligent
              retrieval, and inclusive design.
            </p>
            <div className="hero-ctas hero-reveal">
              <ArrowLink to="/app/chat">Explore AI assistant</ArrowLink>
              <a className="text-link" href="#how-it-works">
                Discover how it works
                <ArrowDown size={16} />
              </a>
            </div>
            <div className="hero-proof hero-reveal">
              <div className="proof-icon">
                <ShieldCheck size={17} />
              </div>
              <span>
                Thoughtful by design.
                <br />
                <strong>Information. Never diagnosis.</strong>
              </span>
              <ModeBadge />
            </div>
          </div>
          <div className="hero-visual">
            <NeuralCore />
            <span className="visual-coordinate">01 / CONNECTED CARE</span>
          </div>
        </div>
        <div className="hero-baseline">
          <span>BUILT FOR EVERY PERSON. EVERY POSSIBILITY.</span>
          <span>
            <Globe2 size={15} />
            ENGLISH <i /> हिन्दी <i /> ଓଡ଼ିଆ
          </span>
          <a href="#features" aria-label="Explore features">
            <ArrowDown size={18} />
          </a>
        </div>
      </section>
      <div className="trust-strip">
        <span>RESPONSIBLE INTELLIGENCE</span>
        <div>
          <ShieldCheck size={18} />
          Safety before answers
        </div>
        <div>
          <BookOpen size={18} />
          Source-grounded guidance
        </div>
        <div>
          <Accessibility size={18} />
          Accessible by intention
        </div>
        <div>
          <HandHeart size={18} />
          Free to explore
        </div>
      </div>
      <section id="features" className="section-shell section-space">
        <div className="section-heading">
          <div>
            <span className="eyebrow">INTELLIGENCE WITH A HUMAN PURPOSE</span>
            <h2>
              Good care starts
              <br />
              with <em>being understood.</em>
            </h2>
          </div>
          <p>
            Healthcare can feel complicated.
            <br />
            Finding your next step shouldn’t.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(({ Icon, num, title, name, body, to, tag }, i) => (
            <motion.article
              initial={
                reduce || prefs.reduced_motion ? false : { opacity: 0, y: 24 }
              }
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="feature-card"
              key={num}
            >
              <div className="feature-card-top">
                <div className="icon-tile">
                  <Icon size={24} />
                </div>
                <span className="card-number">/{num}</span>
              </div>
              <span className="eyebrow">{tag}</span>
              <h3>
                {title.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </h3>
              <p>{body}</p>
              <Link
                to={to}
                className="feature-action"
                aria-label={`Explore Feature: ${name}`}
              >
                Explore feature{" "}
                <span>
                  <ArrowUpRight size={18} />
                </span>
              </Link>
            </motion.article>
          ))}
        </div>
      </section>
      <section
        id="how-it-works"
        className="how-section section-shell section-space"
      >
        <div className="how-intro">
          <span className="eyebrow">FROM A QUESTION TO A CLEARER PATH</span>
          <h2>
            Simple steps.
            <br />
            <em>Meaningful support.</em>
          </h2>
          <p>
            Technology works best when it feels simple. Here’s how SwasthyaSetu
            helps you connect the dots.
          </p>
          <ArrowLink to="/app/chat" className="secondary">
            Start a conversation
          </ArrowLink>
          <div className="quiet-art" aria-hidden="true">
            <span />
            <Sparkles size={48} strokeWidth={0.7} />
            <span />
          </div>
        </div>
        <div className="journey">
          {[
            [
              "Ask your question.",
              "Type naturally in your preferred language. No medical vocabulary required.",
            ],
            [
              "Retrieve trusted information.",
              "The real-mode pipeline retrieves relevant passages from administrator-approved sources.",
            ],
            [
              "Understand the answer.",
              "Get plain-language guidance with sources and clear evidence limitations.",
            ],
            [
              "Explore your next step.",
              "Discover official healthcare services and connect with qualified professionals.",
            ],
          ].map(([title, body], i) => (
            <motion.div
              className="journey-step"
              key={title}
              initial={{ opacity: 0.45 }}
              whileInView={{ opacity: 1 }}
              viewport={{ amount: 0.8 }}
            >
              <span className="step-number">0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      <section id="accessibility" className="section-shell section-space">
        <div className="accessibility-panel">
          <div>
            <span className="eyebrow">ACCESS IS NOT AN AFTERTHOUGHT</span>
            <h2>
              Different needs.
              <br />
              <em>The same dignity.</em>
            </h2>
            <p>
              For a grandparent reading larger text. A family finding
              information in their language. A person who prefers listening.
              Built to meet people where they are.
            </p>
            <div className="check-list">
              {[
                "Adjustable text & high contrast",
                "Keyboard-friendly navigation",
                "Text interaction, always available",
              ].map((x) => (
                <span key={x}>
                  <Check size={16} />
                  {x}
                </span>
              ))}
            </div>
            <ArrowLink to="/accessibility" className="secondary">
              Explore accessibility
            </ArrowLink>
          </div>
          <div className="live-preview">
            <div className="preview-top">
              <span className="eyebrow">TRY IT. MAKE IT YOURS.</span>
              <span className="dot-live" />
            </div>
            <div className="preview-message">
              <span className="icon-tile">
                <HeartPulse />
              </span>
              <h3>
                Care should be
                <br />
                easy to understand.
              </h3>
              <p>Your preferences, your experience.</p>
            </div>
            <div className="preview-controls">
              <button
                className={prefs.text_size !== "normal" ? "selected" : ""}
                aria-pressed={prefs.text_size !== "normal"}
                onClick={() =>
                  void save({
                    ...prefs,
                    text_size:
                      prefs.text_size === "normal" ? "large" : "normal",
                  })
                }
              >
                Aa <span>Large text</span>
              </button>
              <button
                className={prefs.high_contrast ? "selected" : ""}
                aria-pressed={prefs.high_contrast}
                onClick={() =>
                  void save({ ...prefs, high_contrast: !prefs.high_contrast })
                }
              >
                <span className="contrast-circle" />
                High contrast
              </button>
            </div>
            <span className="caption">
              Live preview · changes apply across your experience
            </span>
          </div>
        </div>
      </section>
      <section id="impact" className="section-shell section-space">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TECHNOLOGY IN SERVICE OF PEOPLE</span>
            <h2>
              A small bridge.
              <br />
              <em>A shared ambition.</em>
            </h2>
          </div>
          <p>
            Aligned with the UN Sustainable
            <br />
            Development Goals.
          </p>
        </div>
        <div className="impact-grid">
          <article className="impact-card">
            <div className="sdg-number">
              03
              <span>
                GOOD HEALTH
                <br />& WELL-BEING
              </span>
              <HeartPulse />
            </div>
            <h3>
              Make health information
              <br />
              more accessible.
            </h3>
            <p>
              Help people understand information and navigate existing services,
              without replacing professional care.
            </p>
            <a
              href="https://sdgs.un.org/goals/goal3"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Explore SDG 3<ArrowUpRight size={16} />
            </a>
          </article>
          <article className="impact-card">
            <div className="sdg-number">
              10
              <span>
                REDUCED
                <br />
                INEQUALITIES
              </span>
              <Users />
            </div>
            <h3>
              Reduce the barriers
              <br />
              to understanding.
            </h3>
            <p>
              Design for language, literacy, age and accessibility needs, so
              more people can take part.
            </p>
            <a
              href="https://sdgs.un.org/goals/goal10"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              Explore SDG 10
              <ArrowUpRight size={16} />
            </a>
          </article>
          <div className="impact-method">
            <span className="eyebrow">HOW WE MEASURE POTENTIAL</span>
            <strong>3</strong>
            <span>interface languages</span>
            <strong>1</strong>
            <span>shared mission</span>
            <p>
              Prototype scope only. Dashboard metrics are synthetic
              demonstrations. No clinical outcomes or real-world impact are
              claimed.
            </p>
          </div>
        </div>
      </section>
      <section className="section-shell section-space">
        <div className="center-heading">
          <span className="eyebrow">ACCESS WITHOUT A PRICE TAG</span>
          <h2>
            For you. For your family.
            <br />
            <em>For your community.</em>
          </h2>
          <p>No subscription plans. Just a shared starting point.</p>
        </div>
        <div className="three-grid">
          {[
            [
              HeartPulse,
              "Individuals",
              "Free healthcare information guidance",
              "/app/chat",
            ],
            [
              Users,
              "Families",
              "Assisted access and shared understanding",
              "/app/preferences",
            ],
            [
              HandHeart,
              "Community health workers",
              "Guided navigation to official services",
              "/app/resources",
            ],
          ].map(([Icon, title, body, to]) => {
            const I = Icon as typeof HeartPulse;
            return (
              <article className="glass access-card" key={String(title)}>
                <I size={27} />
                <h3>{title as string}</h3>
                <p>{body as string}</p>
                <ArrowLink to={String(to)} className="secondary">
                  Explore free
                  <ArrowUpRight />
                </ArrowLink>
              </article>
            );
          })}
        </div>
      </section>
      <section className="mission section-shell section-space">
        <span className="eyebrow">THE REASON BEHIND THE BRIDGE</span>
        <h2>
          Not everyone has the same access.
          <br />
          <em>Everyone deserves a starting point.</em>
        </h2>
        <div className="three-grid">
          {[
            [
              "01 / THE PROBLEM",
              "Healthcare is hard to navigate.",
              "Distance, unfamiliar language, and inaccessible interfaces can make finding trustworthy information difficult.",
            ],
            [
              "02 / THE APPROACH",
              "Understanding comes first.",
              "Combine accessible design, careful AI and evidence retrieval to make the next step easier to understand.",
            ],
            [
              "03 / THE AMBITION",
              "More people, included.",
              "Support human decisions and existing healthcare services. Build responsibly, test honestly, and learn from the people we hope to help.",
            ],
          ].map(([label, title, body]) => (
            <article key={label}>
              <span className="eyebrow">{label}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="closing section-shell">
        <span className="eyebrow">
          INTELLIGENT CARE. ACCESSIBLE TO EVERYONE.
        </span>
        <h2>
          Your next step
          <br />
          can start <em>with a question.</em>
        </h2>
        <ArrowLink to="/app/chat">Meet your AI companion</ArrowLink>
        <p>Free to explore. Thoughtfully built. Always human at heart.</p>
        <Link to="/feedback" className="text-link">
          Help shape the bridge
          <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
