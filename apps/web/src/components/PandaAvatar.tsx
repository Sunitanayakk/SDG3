import { useId } from "react";
import type { PandaMood } from "@setu/api-contracts";

/** Light, original vector companion for compact UI and WebGL fallback. */
export function PandaAvatar({
  mood = "idle",
  className = "",
}: {
  mood?: PandaMood;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const closed = mood === "resting";
  const smile = mood !== "concerned";
  return (
    <svg
      viewBox="0 0 300 330"
      className={`panda-avatar ${className}`}
      data-mood={mood}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id}>
          <stop stopColor="#fffef7" />
          <stop offset="1" stopColor="#e9efdf" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="308" rx="83" ry="12" fill="#bfd7c5" opacity=".35" />
      <g className="panda-vector-body">
        <ellipse cx="150" cy="238" rx="76" ry="69" fill="#293933" />
        <ellipse cx="150" cy="244" rx="50" ry="54" fill={`url(#${id})`} />
        <ellipse cx="99" cy="298" rx="34" ry="19" fill="#293933" />
        <ellipse cx="201" cy="298" rx="34" ry="19" fill="#293933" />
        <g className="panda-vector-paw-left">
          <ellipse
            cx="75"
            cy="224"
            rx="22"
            ry="46"
            fill="#293933"
            transform="rotate(20 75 224)"
          />
        </g>
        <g className="panda-vector-paw-right">
          <ellipse
            cx="225"
            cy="224"
            rx="22"
            ry="46"
            fill="#293933"
            transform="rotate(-20 225 224)"
          />
        </g>
        <g className="panda-vector-head">
          <circle cx="82" cy="72" r="32" fill="#293933" />
          <circle cx="218" cy="72" r="32" fill="#293933" />
          <circle cx="82" cy="72" r="18" fill="#526459" />
          <circle cx="218" cy="72" r="18" fill="#526459" />
          <ellipse cx="150" cy="130" rx="101" ry="86" fill={`url(#${id})`} />
          <ellipse
            cx="108"
            cy="123"
            rx="26"
            ry="33"
            fill="#293933"
            transform="rotate(20 108 123)"
          />
          <ellipse
            cx="192"
            cy="123"
            rx="26"
            ry="33"
            fill="#293933"
            transform="rotate(-20 192 123)"
          />
          <g className="panda-vector-eyes">
            {closed ? (
              <>
                <path
                  d="M98 126q10 9 20 0M182 126q10 9 20 0"
                  stroke="#eef5e9"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <ellipse cx="110" cy="123" rx="11" ry="13" fill="white" />
                <ellipse cx="190" cy="123" rx="11" ry="13" fill="white" />
                <circle cx="113" cy="124" r="7" fill="#152820" />
                <circle cx="187" cy="124" r="7" fill="#152820" />
                <circle cx="115" cy="120" r="2.5" fill="white" />
                <circle cx="189" cy="120" r="2.5" fill="white" />
              </>
            )}
          </g>
          <ellipse cx="150" cy="160" rx="18" ry="12" fill="#293933" />
          <path
            d={smile ? "M126 179q24 22 48 0" : "M131 188q19 -5 38 0"}
            fill="none"
            stroke="#293933"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {mood === "happy" && (
            <>
              <ellipse
                cx="89"
                cy="164"
                rx="13"
                ry="6"
                fill="#e4b8a9"
                opacity=".6"
              />
              <ellipse
                cx="211"
                cy="164"
                rx="13"
                ry="6"
                fill="#e4b8a9"
                opacity=".6"
              />
            </>
          )}
        </g>
        <path d="M101 205q49 20 98 0l-8 24q-41 12-82 0Z" fill="#13896f" />
        <path d="m172 222 23 34-31-6Z" fill="#08705a" />
        {mood === "thinking" && (
          <ellipse
            cx="187"
            cy="187"
            rx="17"
            ry="32"
            transform="rotate(-35 187 187)"
            fill="#293933"
          />
        )}
        {mood === "reading" && (
          <g>
            <path d="m104 241 46 10 46-10v47l-46 10-46-10Z" fill="#727fa4" />
            <path d="m111 247 39 9 39-9v35l-39 10-39-10Z" fill="#fffef7" />
            <path d="M150 256v35" stroke="#bdd1c3" strokeWidth="2" />
          </g>
        )}
      </g>
    </svg>
  );
}
