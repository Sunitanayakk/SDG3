import { useState } from "react";
import { Link } from "react-router-dom";
import type { PandaSceneName } from "../components/pandaScene";
import { PandaStage } from "../components/PandaStage";
import { PageHeading } from "../components/ui";

const scenes = [
  {
    id: "jungle" as const,
    name: "Leaf-crown panda",
    description:
      "The original realistic panda, leaf crown and feather detail. Its 20-second loop includes facial movement, blinks, breathing and crown motion.",
  },
  {
    id: "meadow" as const,
    name: "Butterfly panda",
    description:
      "The original bow-tie panda and butterfly, with the original gaze, head, ear, mouth and wing animation across a 20-second loop.",
  },
];

export default function PandaMotion() {
  const [variant, setVariant] = useState<PandaSceneName>("jungle");
  const [time, setTime] = useState<number>();
  const [scenery, setScenery] = useState(true);
  const selected = scenes.find((s) => s.id === variant)!;
  return (
    <>
      <PageHeading
        eyebrow="MEET YOUR COMPANION"
        title="The panda you had in mind."
        description="The original detailed panda artwork and animation from the reference, with realistic fur, facial detail and natural movement."
      />
      <div className="panda-lab panda-reference-lab">
        <div className="panda-lab-stage">
          <PandaStage
            mood="idle"
            variant={variant}
            time={time}
            environment={scenery}
          />
        </div>
        <div className="panda-reference-controls">
          <label className="panda-scenery-control">
            <input
              type="checkbox"
              checked={scenery}
              onChange={(e) => setScenery(e.target.checked)}
            />
            Show original scenery
          </label>
          <div
            className="panda-scene-picker"
            role="group"
            aria-label="Choose a reference scene"
          >
            {scenes.map((s) => (
              <button
                key={s.id}
                aria-pressed={variant === s.id}
                onClick={() => {
                  setVariant(s.id);
                  setTime(undefined);
                }}
              >
                <strong>{s.name}</strong>
                <span>{s.description}</span>
              </button>
            ))}
          </div>
          <div className="panda-live-description" role="status">
            <strong>{selected.name}</strong>
            <p>{selected.description}</p>
          </div>
          <div className="panda-timeline">
            <label htmlFor="panda-time">
              Inspect the original animation, frame by frame
            </label>
            <input
              id="panda-time"
              type="range"
              min="0"
              max="19.95"
              step="0.05"
              value={time ?? 0}
              onChange={(e) => setTime(Number(e.target.value))}
            />
            <div className="row between">
              <output htmlFor="panda-time">
                {time === undefined
                  ? "20-second original loop"
                  : `${time.toFixed(2)}s / 20s`}
              </output>
              {time !== undefined && (
                <button
                  className="button secondary small"
                  onClick={() => setTime(undefined)}
                >
                  Resume original motion
                </button>
              )}
            </div>
          </div>
          <p className="caption">
            Reference artwork and animation:{" "}
            <a
              href="https://bambukstudio.com/"
              target="_blank"
              rel="noreferrer"
            >
              Bambuk Studio
            </a>
            .
          </p>
        </div>
      </div>
      <p className="privacy-hint">
        The two original animation loops are preserved. App labels such as
        “thinking” describe interface activity; they do not claim additional
        original expressions or assess your emotions. Reduced-motion and
        text-only preferences take priority.
      </p>
      <Link className="button secondary" to="/app/chat">
        Meet Setu in the chat
      </Link>
    </>
  );
}
