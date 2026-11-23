import { Link, useParams } from "react-router-dom";
import { PageHeading } from "../components/ui";
const content = {
  privacy: {
    title: "Privacy, with intention.",
    body: [
      "Use only synthetic information in this prototype. Do not enter real patient records, identifiable medical details, account passwords or personal contact information.",
      "Browser Demo Mode stores synthetic fixtures, feedback and preferences on this device. New conversations are not saved unless you opt in. Reset demo data in Profile to remove them.",
      "In real mode, authenticated users can opt into server-side conversation storage and delete their own sessions. Account access tokens are held in browser session storage or Expo SecureStore. Sign out removes the token; expired sessions require sign-in again.",
      "Real questions and retrieved context are sent to the configured NVIDIA inference service; embedding requests go to the configured provider. Their own privacy policies apply. This prototype has not undergone a production privacy or security assessment.",
      "Analytics records contain language, retrieval presence, latency and timestamps, not conversation content. Feedback text is retained; omit identifying information.",
    ],
  },
  medical: {
    title: "Information, with clear limits.",
    body: [
      "This AI assistant provides general healthcare information. It does not replace a qualified healthcare professional.",
      "It cannot diagnose conditions, prescribe treatments, recommend prescription dosages, book consultations, confirm service availability or dispatch emergency assistance.",
      "Emergency rules are conservative examples and may miss emergencies. They are not clinically validated triage. If you believe there is an emergency, seek professional help immediately.",
      "Demo outputs and retrieval examples are synthetic. Real-mode answers may still be incomplete or incorrect. Check original sources and seek advice from a qualified professional. Hindi and Odia medical accuracy requires professional validation.",
    ],
  },
  accessibility: {
    title: "Access is part of care.",
    body: [
      "We aim to follow WCAG 2.2 AA practices through semantic structure, keyboard navigation, visible focus, dialog controls, readable contrast and touch targets. This prototype has not been independently certified.",
      "You can choose larger text, higher contrast, reduced motion, text-only presentation and your preferred interface language. Operating-system reduced motion preferences are also respected.",
      "Voice playback depends on the browser or device and installed language voices. It is optional; text remains available. Native screens support platform text scaling and accessibility labels.",
      "Use the feedback form to report a barrier without including sensitive personal or medical information.",
    ],
  },
};
export default function Legal() {
  const { kind } = useParams();
  const page = content[kind as keyof typeof content];
  if (!page)
    return (
      <div className="standalone section-shell">
        <h1>Page not found</h1>
        <Link to="/">Return home</Link>
      </div>
    );
  return (
    <div className="standalone section-shell prose">
      <PageHeading eyebrow="RESPONSIBLE BY DESIGN" title={page.title} />
      {page.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <Link to="/feedback" className="button secondary">
        Share product feedback
      </Link>
    </div>
  );
}
