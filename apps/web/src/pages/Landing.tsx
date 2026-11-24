import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  BookOpen,
  Check,
  Ear,
  Eye,
  Heart,
  HeartPulse,
  Languages,
  MessageCircle,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { PandaStage } from "../components/PandaStage";
import { PandaStory } from "../components/PandaStory";

const paths = [
  {
    icon: Eye,
    label: "I need clearer text",
    title: "A little bigger. A lot clearer.",
    message:
      "Adjust text size and contrast. Listen when reading feels difficult.",
    to: "/app/preferences",
    action: "Adjust my reading settings",
  },
  {
    icon: Ear,
    label: "I prefer to type",
    title: "Your words. Your way.",
    message:
      "Show a message at reception. Communicate without needing to speak or hear.",
    to: "/app/communicate",
    action: "Open communication board",
  },
  {
    icon: Accessibility,
    label: "I need easier access",
    title: "Make the next visit easier.",
    message:
      "Prepare your access requests before a visit, with a checklist you can bring along.",
    to: "/app/planner",
    action: "Plan my next visit",
  },
  {
    icon: Languages,
    label: "My language matters",
    title: "Understanding comes first.",
    message:
      "Read short explainers in English, Hindi or Odia, at your own pace.",
    to: "/app/library",
    action: "Explore the easy-read library",
  },
];
export default function Landing() {
  const [selected, setSelected] = useState(0);
  const path = paths[selected];
  return (
    <div className="light-home">
      <section className="care-hero">
        <div className="care-hero-copy">
          <span className="care-kicker">
            <span className="care-kicker-icon">
              <Heart size={13} />
            </span>{" "}
            ACCESSIBLE HEALTHCARE FOR ALL
          </span>
          <h1>
            Better care starts
            <br />
            with being
            <br />
            <span>understood.</span>
            <svg
              className="heading-swoosh"
              viewBox="0 0 330 18"
              aria-hidden="true"
            >
              <path d="M4 12 Q155 -4 324 9" />
            </svg>
          </h1>
          <p>
            Health information in your language. Tools that adapt to your needs.
            A clearer path to care, for every body and every ability.
          </p>
          <div className="hero-buttons">
            <Link className="button" to="/app/chat">
              <MessageCircle size={19} />
              Ask Setu AI
            </Link>
            <Link className="button secondary" to="/app/tools">
              Find your access tools
            </Link>
          </div>
          <div className="hero-reassurance">
            <span>
              <ShieldCheck size={16} />
              Source-linked information
            </span>
            <span>
              <Check size={16} />
              Free to explore
            </span>
          </div>
        </div>
        <div className="panda-hero">
          <span className="panda-hero-note">
            <Heart size={16} /> A little support. A friendly face.
          </span>
          <PandaStage mood="welcome" />
          <div className="panda-hero-links">
            <Link to="/app/companion">Meet Setu’s expressions</Link>
            <Link to="/app/chat">Start a conversation</Link>
          </div>
        </div>
      </section>
      <div className="care-values">
        <span>Built for real-life barriers</span>
        <span>
          <Eye size={19} />
          Visual
        </span>
        <span>
          <Ear size={19} />
          Hearing
        </span>
        <span>
          <Accessibility size={19} />
          Mobility
        </span>
        <span>
          <Languages size={19} />
          Language
        </span>
      </div>
      <PandaStory />
      <section id="accessibility" className="care-section access-paths">
        <div className="section-intro">
          <span className="eyebrow">YOUR ACCESS NEEDS COME FIRST</span>
          <h2>
            Different needs.
            <br />
            <em>Equally important.</em>
          </h2>
          <p>
            You shouldn’t have to fit the technology. Start with what makes care
            easier for you.
          </p>
        </div>
        <div className="path-demo">
          <div
            className="path-options"
            role="group"
            aria-label="Explore accessibility support"
          >
            {paths.map((p, i) => (
              <button
                key={p.label}
                aria-pressed={i === selected}
                className={i === selected ? "active" : ""}
                onClick={() => setSelected(i)}
              >
                <p.icon size={21} />
                {p.label}
                {i === selected && <Check size={17} />}
              </button>
            ))}
          </div>
          <div className="path-result" key={selected}>
            <path.icon size={35} />
            <h3>{path.title}</h3>
            <p>{path.message}</p>
            <Link className="button small" to={path.to}>
              {path.action}
            </Link>
          </div>
        </div>
      </section>
      <section id="features" className="care-section feature-section">
        <div className="section-intro centered">
          <span className="eyebrow">MORE THAN A CHAT WINDOW</span>
          <h2>
            A little support.
            <br />
            <em>A world of possibility.</em>
          </h2>
          <p>
            Practical tools for before, during and between healthcare visits.
          </p>
        </div>
        <div className="feature-mosaic">
          <Link to="/app/passport" className="care-feature passport-feature">
            <span className="feature-icon">
              <Accessibility />
            </span>
            <span className="feature-tag">TAKE YOUR NEEDS WITH YOU</span>
            <h3>
              Your Accessibility
              <br />
              Passport.
            </h3>
            <p>
              A printable card for the way you prefer to communicate and receive
              help. Explain your needs without starting over.
            </p>
            <div className="mini-passport" aria-hidden="true">
              <span>
                <HeartPulse size={18} /> MY ACCESS CARD
              </span>
              <strong>Please write it down.</strong>
              <small>Preferred language: हिन्दी</small>
              <div>
                <Check size={15} />
                Please ask before assisting me.
              </div>
            </div>
            <span className="feature-link">Create my passport</span>
          </Link>
          <Link to="/app/communicate" className="care-feature talk-feature">
            <span className="feature-icon">
              <MessageCircle />
            </span>
            <span className="feature-tag">BE HEARD WITHOUT SPEAKING</span>
            <h3>The Communication Board.</h3>
            <p>
              Tap a useful phrase. Show a large message. Let your device read it
              aloud.
            </p>
            <div className="mini-phrases" aria-hidden="true">
              <span>✍ Please write it down.</span>
              <span>♡ I need assistance.</span>
              <span>◷ Please explain slowly.</span>
            </div>
            <span className="feature-link">Find my words</span>
          </Link>
          <Link to="/app/planner" className="care-feature">
            <span className="feature-icon">
              <Check />
            </span>
            <h3>Arrive a little more prepared.</h3>
            <p>
              A visit checklist that responds to your access needs. Keep your
              progress and download the next steps.
            </p>
            <span className="feature-link">Build my visit plan</span>
          </Link>
          <Link to="/app/library" className="care-feature">
            <span className="feature-icon">
              <BookOpen />
            </span>
            <h3>Understand, at your pace.</h3>
            <p>
              Short, source-linked health explainers. Read in three languages or
              listen with a device voice.
            </p>
            <span className="feature-link">Open the easy-read library</span>
          </Link>
        </div>
      </section>
      <section id="how-it-works" className="care-section care-steps">
        <div className="section-intro">
          <span className="eyebrow">A CLEARER PATH TO CARE</span>
          <h2>
            Less friction.
            <br />
            <em>More understanding.</em>
          </h2>
        </div>
        <div className="care-steps-grid">
          {[
            [
              Languages,
              "Make it feel familiar",
              "Choose your language, reading size and how you prefer to communicate.",
            ],
            [
              MessageCircle,
              "Find a useful next step",
              "Ask the assistant, read a short guide or prepare for a consultation.",
            ],
            [
              Heart,
              "Bring your needs along",
              "Take your access card and checklist to a real healthcare professional.",
            ],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof Heart;
            return (
              <article key={String(title)}>
                <span>
                  <I size={25} />
                </span>
                <h3>{String(title)}</h3>
                <p>{String(body)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section id="impact" className="care-section care-impact">
        <div>
          <span className="sdg-square">
            3
            <small>
              GOOD HEALTH
              <br />
              AND WELL-BEING
            </small>
            <HeartPulse size={30} />
          </span>
          <span className="eyebrow">
            CHALLENGE 08 · ACCESSIBLE HEALTHCARE FOR ALL
          </span>
          <h2>
            Access is part
            <br />
            <em>of good health.</em>
          </h2>
          <p>
            Designed around SDG 3 and reducing barriers to care. Every feature
            helps someone see, hear, understand or navigate health information
            more easily.
          </p>
          <p className="caption">
            A working prototype. No claims of clinical outcomes or guaranteed
            service availability.
          </p>
        </div>
        <div className="impact-quote">
          <span aria-hidden="true">“</span>
          <h3>
            Care should begin with
            <br />
            “How can we help?”
            <br />
            Not “Can you use this?”
          </h3>
          <div className="row">
            <ShieldCheck size={21} />
            <p>
              General health education.
              <br />
              Human care stays at the centre.
            </p>
          </div>
        </div>
      </section>
      <section className="care-closing">
        <span className="eyebrow">A BRIDGE TO UNDERSTANDING</span>
        <h2>
          Care that meets you
          <br />
          <em>where you are.</em>
        </h2>
        <p>Start with a question, a preference, or one small next step.</p>
        <div className="hero-buttons">
          <Link className="button" to="/app/chat">
            <MessageCircle size={19} />
            Start a conversation
          </Link>
          <Link className="button secondary" to="/app/tools">
            <Volume2 size={18} />
            Explore the access toolkit
          </Link>
        </div>
      </section>
    </div>
  );
}
