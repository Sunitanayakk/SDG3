import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCheck, MessageCircle } from "lucide-react";
import type { PandaMood } from "@setu/api-contracts";
import { PandaStage } from "./PandaStage";

const chapters = [
  {
    mood: "reading" as PandaMood,
    icon: BookOpen,
    label: "UNDERSTAND, AT YOUR PACE",
    title: "A little clarity goes a long way.",
    text: "Short, source-linked guides. A familiar language. The option to listen. Setu helps make the next piece of information easier to approach.",
    to: "/app/library",
    action: "Open the easy-read library",
  },
  {
    mood: "listening" as PandaMood,
    icon: MessageCircle,
    label: "EVERY WAY OF COMMUNICATING COUNTS",
    title: "You don’t have to say it aloud.",
    text: "Tap a phrase, type a message or show a large card. Setu stays attentive while you choose the words that work for you.",
    to: "/app/communicate",
    action: "Try the communication board",
  },
  {
    mood: "happy" as PandaMood,
    icon: CheckCheck,
    label: "PREPARE A LITTLE. FEEL MORE READY.",
    title: "Bring your needs, not uncertainty.",
    text: "Build a visit checklist and take your accessibility preferences with you. Confirm arrangements with the service, one manageable step at a time.",
    to: "/app/planner",
    action: "Prepare for a visit",
  },
];
export function PandaStory() {
  const [chapter, setChapter] = useState(0);
  const sections = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active)
          setChapter(Number((active.target as HTMLElement).dataset.chapter));
      },
      { rootMargin: "-15% 0px -25% 0px", threshold: [0.1, 0.3, 0.6] },
    );
    sections.current.forEach((section) => {
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  return (
    <section className="panda-story" aria-label="How Setu helps">
      <div className="panda-story-inner">
        <div className="panda-story-sticky">
          <span className="eyebrow">A COMPANION FOR YOUR NEXT STEP</span>
          <h2>
            Not everyone takes
            <br />
            the same path.
            <br />
            <em>That’s okay.</em>
          </h2>
          <PandaStage
            mood={chapters[chapter].mood}
            variant={chapter === 0 ? "jungle" : "meadow"}
            className="story-panda"
          />
          <div
            className="panda-chapter-controls"
            role="group"
            aria-label="Preview Setu’s support"
          >
            <button onClick={() => setChapter(0)} aria-pressed={chapter === 0}>
              Understand
            </button>
            <button onClick={() => setChapter(1)} aria-pressed={chapter === 1}>
              Communicate
            </button>
            <button onClick={() => setChapter(2)} aria-pressed={chapter === 2}>
              Prepare
            </button>
          </div>
        </div>
        <div className="panda-chapters">
          {chapters.map((c, i) => (
            <article
              key={c.label}
              data-chapter={i}
              data-active={chapter === i}
              ref={(element) => {
                sections.current[i] = element;
              }}
            >
              <span className="panda-chapter-icon">
                <c.icon size={26} />
              </span>
              <span className="eyebrow">{c.label}</span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <Link className="button secondary" to={c.to}>
                {c.action}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
