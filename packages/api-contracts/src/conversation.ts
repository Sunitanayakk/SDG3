import type { Language } from "./types";

const greeting =
  "(?:h+i+|he+y+|he+l+o+|namaste|namaskar|नमस्ते|नमस्कार|ନମସ୍କାର|good (?:morning|afternoon|evening))";
const recipient = "(?:there|setu(?: ai)?|swasthyasetu(?: ai)?)";
const checkIn =
  "(?:how are you(?: doing)?|how is it going|can you help(?: me)?)";
const rules = [
  [
    new RegExp(
      `^(?:${greeting}(?: ${recipient})?(?: ${checkIn})?|${checkIn})$`,
    ),
    "greeting",
  ],
  [/^(?:help(?: me)?|what can you do|what do you do|who are you)$/, "help"],
  [/^(?:(?:thanks|thank you)(?: so much| a lot)?|धन्यवाद|ଧନ୍ୟବାଦ)$/, "thanks"],
  [/^(?:bye+|goodbye|see you|take care|अलविदा|ବିଦାୟ)$/, "goodbye"],
] as const;
const replies: Record<(typeof rules)[number][1], Record<Language, string>> = {
  greeting: {
    en: "Hi! I’m Setu, your healthcare access companion. How can I help you today? You can ask about health information, find care services, or explore tools that make a visit easier.",
    hi: "नमस्ते! मैं सेतु हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ? आप स्वास्थ्य जानकारी, स्वास्थ्य सेवाओं या अपने अगले दौरे की तैयारी के बारे में पूछ सकते हैं।",
    or: "ନମସ୍କାର! ମୁଁ ସେତୁ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି? ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ, ସ୍ୱାସ୍ଥ୍ୟ ସେବା କିମ୍ବା ଡାକ୍ତରଙ୍କ ପାଖକୁ ଯିବା ପ୍ରସ୍ତୁତି ବିଷୟରେ ପଚାରନ୍ତୁ।",
  },
  help: {
    en: "I’m Setu. I can explain source-linked health information, help you find official care services, and guide you to the Accessibility Passport, Communication Board and Visit Planner. What would you like help with?",
    hi: "मैं स्वास्थ्य जानकारी और आधिकारिक सेवाएँ समझने में सहायता कर सकता हूँ। Accessibility Passport, Communication Board और Visit Planner भी उपलब्ध हैं। आपको किसमें मदद चाहिए?",
    or: "ମୁଁ ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ ଓ ଅଧିକୃତ ସେବା ବିଷୟରେ ବୁଝିବାରେ ସାହାଯ୍ୟ କରିପାରିବି। Accessibility Passport, Communication Board ଓ Visit Planner ମଧ୍ୟ ଉପଲବ୍ଧ। ଆପଣଙ୍କୁ କେଉଁଥିରେ ସାହାଯ୍ୟ ଦରକାର?",
  },
  thanks: {
    en: "You’re welcome! Is there anything else I can help you with?",
    hi: "आपका स्वागत है! क्या मैं किसी और बात में मदद कर सकता हूँ?",
    or: "ଆପଣଙ୍କୁ ସ୍ୱାଗତ! ମୁଁ ଆଉ କିଛି ସାହାଯ୍ୟ କରିପାରିବି କି?",
  },
  goodbye: {
    en: "Take care! You can come back whenever you need help understanding health information or finding care services.",
    hi: "अपना ध्यान रखें! स्वास्थ्य जानकारी या सेवाओं के बारे में मदद चाहिए तो फिर आइए।",
    or: "ନିଜ ଯତ୍ନ ନିଅନ୍ତୁ! ସ୍ୱାସ୍ଥ୍ୟ ତଥ୍ୟ କିମ୍ବା ସେବା ବିଷୟରେ ସାହାଯ୍ୟ ଦରକାର ହେଲେ ପୁଣି ଆସନ୍ତୁ।",
  },
};

/** Only whole conversational turns qualify; a medical request after "hi" stays intact. */
export function conversationalReply(
  message: string,
  language: Language,
): string | undefined {
  const text = message
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[👋🙏🏻🏼🏽🏾🏿\uFE0F]/gu, " ")
    .replace(/[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~“”‘’…।॥，！？–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const rule = rules.find(([pattern]) => pattern.test(text));
  return rule ? replies[rule[1]][language] : undefined;
}
