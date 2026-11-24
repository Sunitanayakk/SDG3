import { useState } from "react";
import { Link } from "react-router-dom";
import { pandaMoods, type PandaMood } from "@setu/api-contracts";
import { PandaStage } from "../components/PandaStage";
import { PageHeading } from "../components/ui";

export default function PandaMotion() {
  const [mood, setMood] = useState<PandaMood>("welcome");
  const selected = pandaMoods.find((m) => m.id === mood)!;
  return (
    <>
      <PageHeading
        eyebrow="MEET YOUR COMPANION"
        title="A little character. A lot of care."
        description="Explore Setu’s expressions. Move your pointer over the panda, choose a pose, or pause the animation."
      />
      <div className="panda-lab">
        <div className="panda-lab-stage">
          <PandaStage mood={mood} />
          <div className="panda-live-description" role="status">
            <strong>{selected.label}</strong>
            <p>{selected.description}</p>
          </div>
        </div>
        <div
          className="panda-mood-list"
          role="group"
          aria-label="Choose a panda expression"
        >
          {pandaMoods.map((m) => (
            <button
              key={m.id}
              aria-pressed={mood === m.id}
              onClick={() => setMood(m.id)}
            >
              <span>{m.label}</span>
              <small>{m.description}</small>
            </button>
          ))}
        </div>
      </div>
      <p className="privacy-hint">
        Setu’s poses reflect interface activity, not an assessment of your
        emotions or health. In chat, urgent messages get a calm, attentive pose.
        Reduced-motion and text-only preferences always take priority.
      </p>
      <Link className="button secondary" to="/app/chat">
        Meet Setu in the chat
      </Link>
    </>
  );
}
