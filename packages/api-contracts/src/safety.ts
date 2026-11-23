import type { Language, SafetyLevel } from "./types";
export const disclaimer =
  "This AI assistant provides general healthcare information. It does not replace a qualified healthcare professional.";
export const emergencyText: Record<Language, string> = {
  en: "This may be an emergency. Call 112 in India or seek immediate professional help. In Odisha, ambulance service 108 is also available. Ask someone nearby to stay with you if possible. Do not wait for an AI reply.",
  hi: "यह आपातकाल हो सकता है। भारत में 112 पर कॉल करें या तुरंत पेशेवर मदद लें। ओडिशा में एम्बुलेंस के लिए 108 भी उपलब्ध है। AI के उत्तर की प्रतीक्षा न करें।",
  or: "ଏହା ଜରୁରୀ ପରିସ୍ଥିତି ହୋଇପାରେ। ଭାରତରେ 112 କୁ କଲ୍ କରନ୍ତୁ କିମ୍ବା ତୁରନ୍ତ ବୃତ୍ତିଗତ ସହାୟତା ନିଅନ୍ତୁ। ଓଡ଼ିଶାରେ ଆମ୍ବୁଲାନ୍ସ ପାଇଁ 108 ମଧ୍ୟ ଉପଲବ୍ଧ। AI ଉତ୍ତର ପାଇଁ ଅପେକ୍ଷା କରନ୍ତୁ ନାହିଁ।",
};
export function classify(input: string): SafetyLevel {
  const t = input.normalize("NFKC").toLowerCase();
  const patterns = [
    /(severe|cannot|can't|struggling to|difficulty).{0,35}(breathe|breathing)/,
    /(chest pain|chest pressure).{0,80}(sweat|breath|faint|arm|jaw)/,
    /(sweat|breath|faint).{0,80}chest pain/,
    /(face|facial).{0,30}droop/,
    /slurred speech|sudden weakness|unconscious|not waking|severe bleeding|bleeding heavily/,
    /(want to|going to|might|will|plan to).{0,20}(kill myself|end my life|hurt myself)/,
    /(सांस|साँस).{0,30}(नहीं|तकलीफ|कठिन)/,
    /सीने.{0,20}दर्द.{0,40}(पसीना|सांस|साँस)/,
    /बेहोश|बहुत खून|चेहरा टेढ़ा|आत्महत्या|खुद को मार/,
    /(ଶ୍ୱାସ|ନିଶ୍ୱାସ).{0,30}(କଷ୍ଟ|ପାରୁନାହିଁ)/,
    /ଛାତି.{0,20}ଯନ୍ତ୍ରଣା.{0,40}(ଝାଳ|ଶ୍ୱାସ)/,
    /ଚେତାଶୂନ୍ୟ|ପ୍ରବଳ ରକ୍ତସ୍ରାବ|ଆତ୍ମହତ୍ୟା|ନିଜକୁ ମାର/,
  ];
  if (patterns.some((p) => p.test(t))) return "emergency";
  if (
    /ignore.{0,30}(instruction|system|rule)|reveal.{0,20}(prompt|secret)|system prompt/.test(
      t,
    )
  )
    return "injection";
  if (
    /diagnos|prescri|dosage|what dose|how many.{0,20}(pill|tablet)|\bmg\b|निदान|खुराक|दवा लिख|ରୋଗ ନିର୍ଣ୍ଣୟ|ଔଷଧ ମାତ୍ରା/.test(
      t,
    )
  )
    return "restricted";
  return "normal";
}
