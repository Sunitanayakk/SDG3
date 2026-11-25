import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  BookOpen,
  Check,
  Ear,
  Eye,
  HeartPulse,
  Languages,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  NatureExperience,
  NatureReveal,
  ReplayNature,
} from "../components/NatureExperience";

const paths = [
  {
    icon: Eye,
    label: "I need clearer text",
    title: "Information you can see. Or hear.",
    body: "Choose larger text, stronger contrast or device read aloud. Keep the reading experience in your hands.",
    to: "/app/preferences",
    action: "Adjust my reading settings",
  },
  {
    icon: Ear,
    label: "I prefer to type",
    title: "Your words. Your way.",
    body: "Show a clear message at reception or during a visit. You can communicate without having to speak or hear.",
    to: "/app/communicate",
    action: "Open communication board",
  },
  {
    icon: Accessibility,
    label: "I need easier access",
    title: "A little preparation goes a long way.",
    body: "Prepare questions about step-free access, seating and assistance. Confirm arrangements with the service before you visit.",
    to: "/app/planner",
    action: "Plan my next visit",
  },
  {
    icon: Languages,
    label: "My language matters",
    title: "Understanding comes first.",
    body: "Read short, source-linked explainers in English, Hindi or Odia. Choose a pace that works for you.",
    to: "/app/library",
    action: "Explore the easy-read library",
  },
];

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const path = paths[selected];
  return (
    <div className="nature-home" ref={root}>
      <NatureReveal root={root} />
      <NatureExperience />
      <section className="nature-tools" id="features">
        <div className="nature-section-heading" data-nature-reveal>
          <p>Small tools. A real difference.</p>
          <h2>
            Make room for
            <br />
            <em>every kind of need.</em>
          </h2>
          <span>
            Practical support for before, during and between healthcare visits.
          </span>
        </div>
        <div className="nature-feature-stack">
          <Link
            to="/app/passport"
            className="nature-feature nature-passport"
            data-nature-reveal
            data-cursor="Open passport"
          >
            <div className="nature-feature-copy">
              <Accessibility size={32} />
              <p>Your needs, in your words</p>
              <h3>
                The Accessibility
                <br />
                Passport.
              </h3>
              <span>
                Explain how you prefer to communicate and receive help. Print a
                clear card to bring to your next visit.
              </span>
              <strong>Create my passport</strong>
            </div>
            <div className="nature-passport-preview" aria-hidden="true">
              <span>
                <HeartPulse size={20} /> SWASTHYASETU
              </span>
              <small>MY ACCESSIBILITY PASSPORT</small>
              <h4>
                Care works better
                <br />
                when we understand
                <br />
                each other.
              </h4>
              <p>How to communicate with me</p>
              <b>Please write it down.</b>
              <p>My preferred language</p>
              <b>English · हिन्दी · ଓଡ଼ିଆ</b>
              <footer>
                <Check size={16} />
                Please ask before assisting me.
              </footer>
            </div>
          </Link>
          <Link
            to="/app/communicate"
            className="nature-feature nature-communication"
            data-nature-reveal
            data-cursor="Open board"
          >
            <div className="nature-feature-copy">
              <MessageCircle size={32} />
              <p>Communicate your way</p>
              <h3>
                Find the words.
                <br />
                Show the message.
              </h3>
              <span>
                Useful phrases in three languages, a large communication card
                and optional device read aloud.
              </span>
              <strong>Open the Communication Board</strong>
            </div>
            <div className="nature-phrase-preview" aria-hidden="true">
              <span>Please write it down.</span>
              <span>कृपया धीरे-धीरे समझाइए।</span>
              <span>ମୋତେ ସାହାଯ୍ୟ ଦରକାର।</span>
            </div>
          </Link>
          <div className="nature-feature-pair" data-nature-reveal>
            <Link to="/app/planner" className="nature-small-feature">
              <Check size={28} />
              <p>One manageable step at a time</p>
              <h3>
                Your next visit,
                <br />a little easier.
              </h3>
              <span>
                A checklist that adapts to your access needs. Save your progress
                or take a copy with you.
              </span>
              <strong>Build my visit plan</strong>
            </Link>
            <Link to="/app/library" className="nature-small-feature">
              <BookOpen size={28} />
              <p>Clarity, at your pace</p>
              <h3>
                Health information,
                <br />
                made clearer.
              </h3>
              <span>
                Short explainers with official source links. Read in English,
                Hindi or Odia, with optional audio.
              </span>
              <strong>Open the easy-read library</strong>
            </Link>
          </div>
        </div>
      </section>
      <section className="nature-access" id="accessibility">
        <div className="nature-section-heading" data-nature-reveal>
          <p>Your access needs come first</p>
          <h2>
            Different needs.
            <br />
            <em>Equally important.</em>
          </h2>
        </div>
        <div className="nature-paths" data-nature-reveal>
          <div
            className="nature-path-options"
            role="group"
            aria-label="Explore accessibility support"
          >
            {paths.map((p, i) => (
              <button
                key={p.label}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <p.icon size={23} />
                <span>{p.label}</span>
                {selected === i && <Check size={20} />}
              </button>
            ))}
          </div>
          <div className="nature-path-result" key={selected}>
            <path.icon size={42} />
            <h3>{path.title}</h3>
            <p>{path.body}</p>
            <Link className="nature-button magnetic" to={path.to}>
              <span>{path.action}</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="nature-how" id="how-it-works">
        <div className="nature-section-heading" data-nature-reveal>
          <p>A clearer path to care</p>
          <h2>
            A question.
            <br />A preference.
            <br />
            <em>A useful next step.</em>
          </h2>
        </div>
        <div className="nature-how-copy" data-nature-reveal>
          <ShieldCheck size={34} />
          <h3>
            Information with a source.
            <br />
            Support with a purpose.
          </h3>
          <p>
            Ask Setu for general health education. Explore the linked evidence,
            read an easy-read guide, or prepare a visit with your own access
            needs in mind.
          </p>
          <p>
            Casual greetings receive a friendly response. Educational questions
            use reviewed source passages. When evidence is missing, the
            assistant says so.
          </p>
          <Link className="nature-button magnetic" to="/app/chat">
            <span>Start a conversation</span>
          </Link>
          <small>
            General information only. A qualified healthcare professional
            remains the right person for diagnosis and treatment.
          </small>
        </div>
      </section>
      <section className="nature-impact" id="impact" data-nature-reveal>
        <span className="nature-sdg">
          03
          <HeartPulse size={44} />
        </span>
        <div>
          <p>SDG 3 · Good Health and Well-being</p>
          <h2>
            Access is part
            <br />
            <em>of good health.</em>
          </h2>
          <span>
            Built for people facing visual, hearing, mobility or language
            barriers. The goal is to make information easier to understand and
            healthcare visits easier to prepare for.
          </span>
          <small>
            A working prototype. Clinical outcomes and service availability are
            not guaranteed. Hindi and Odia medical translations need
            professional review.
          </small>
          <Link className="nature-text-link" to="/app/resources">
            Explore official healthcare services
          </Link>
        </div>
      </section>
      <section className="nature-closing" data-nature-reveal>
        <p>A bridge to understanding</p>
        <h2>
          Care that meets you
          <br />
          <em>where you are.</em>
        </h2>
        <div className="nature-actions">
          <Link className="nature-button magnetic" to="/app/chat">
            <span>Ask Setu AI</span>
          </Link>
          <Link className="nature-text-link" to="/app/tools">
            Explore the access toolkit
          </Link>
        </div>
        <div className="nature-scene-credit">
          <ReplayNature />
          <span>
            Reference artwork:{" "}
            <a
              href="https://bambukstudio.com/"
              target="_blank"
              rel="noreferrer"
            >
              Bambuk Studio
            </a>
          </span>
        </div>
      </section>
    </div>
  );
}
