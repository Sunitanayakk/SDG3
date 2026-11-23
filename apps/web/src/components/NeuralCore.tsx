import {
  FileCheck2,
  Mic,
  HeartPulse,
  Navigation,
  Sparkles,
} from "lucide-react";
export function NeuralCore() {
  return (
    <div
      className="neural-scene"
      aria-label="Illustration: accessible healthcare information connected through AI"
    >
      <div className="orbital orbital-one" />
      <div className="orbital orbital-two" />
      <svg className="neural-paths" viewBox="0 0 700 530" aria-hidden="true">
        <defs>
          <linearGradient id="goldline">
            <stop stopColor="#a78b71" stopOpacity="0.1" />
            <stop offset=".5" stopColor="#e8d5b7" />
            <stop offset="1" stopColor="#a78b71" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {[
          "M130 110 C250 110 190 260 350 265",
          "M560 130 C430 120 485 265 350 265",
          "M120 400 C240 400 210 265 350 265",
          "M565 405 C450 405 475 265 350 265",
        ].map((d, i) => (
          <path
            key={d}
            d={d}
            stroke="url(#goldline)"
            strokeWidth="2"
            fill="none"
            className={`flow flow-${i}`}
          />
        ))}
      </svg>
      <div className="core">
        <div className="core-ring" />
        <div className="core-inner">
          <Sparkles size={43} strokeWidth={1} />
          <span>SETU</span>
          <small>INTELLIGENCE</small>
        </div>
        <span className="core-point p1" />
        <span className="core-point p2" />
        <span className="core-point p3" />
      </div>
      <div className="satellite sat-one">
        <div className="icon-tile">
          <HeartPulse />
        </div>
        <div>
          <small>UNDERSTAND</small>
          <strong>Healthcare information</strong>
          <span>A little clarity. A lot of care.</span>
        </div>
      </div>
      <div className="satellite sat-two">
        <div className="icon-tile">
          <Mic />
        </div>
        <div>
          <small>CONNECT</small>
          <strong>Your voice. Your language.</strong>
          <span>Designed around you.</span>
        </div>
      </div>
      <div className="satellite sat-three">
        <div className="icon-tile">
          <FileCheck2 />
        </div>
        <div>
          <small>TRUST</small>
          <strong>Knowledge with sources</strong>
          <span>Evidence you can explore.</span>
        </div>
      </div>
      <div className="satellite sat-four">
        <div className="icon-tile">
          <Navigation />
        </div>
        <div>
          <small>NAVIGATE</small>
          <strong>A path to the right help</strong>
          <span>Discover official services.</span>
        </div>
      </div>
      <div className="orbit-caption">HUMAN NEEDS. INTELLIGENT CONNECTIONS.</div>
    </div>
  );
}
