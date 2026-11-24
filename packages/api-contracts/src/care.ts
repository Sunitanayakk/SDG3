import type { Language } from "./types";

export const accessNeeds = [
  {
    id: "vision",
    title: "Seeing",
    detail: "Large text, clear contrast & audio",
    request:
      "Please read important information aloud and offer large-print information.",
  },
  {
    id: "hearing",
    title: "Hearing",
    detail: "Written communication & visual cues",
    request:
      "Please face me and write down key information. Ask about my preferred communication method.",
  },
  {
    id: "mobility",
    title: "Moving",
    detail: "Fewer steps & visit preparation",
    request:
      "Please confirm step-free access, seating and any assistance before my visit.",
  },
  {
    id: "language",
    title: "Understanding",
    detail: "English, हिन्दी & ଓଡ଼ିଆ",
    request:
      "Please use plain language and help me arrange an interpreter if available.",
  },
] as const;
export type AccessNeed = (typeof accessNeeds)[number]["id"];

export const communicationPhrases: {
  id: string;
  icon: string;
  en: string;
  hi: string;
  or: string;
}[] = [
  {
    id: "write",
    icon: "✍",
    en: "Please write it down.",
    hi: "कृपया लिखकर बताइए।",
    or: "ଦୟାକରି ଲେଖିକି କୁହନ୍ତୁ।",
  },
  {
    id: "slow",
    icon: "◷",
    en: "Please explain slowly.",
    hi: "कृपया धीरे-धीरे समझाइए।",
    or: "ଦୟାକରି ଧୀରେ ଧୀରେ ବୁଝାନ୍ତୁ।",
  },
  {
    id: "help",
    icon: "♡",
    en: "I need assistance.",
    hi: "मुझे सहायता चाहिए।",
    or: "ମୋତେ ସାହାଯ୍ୟ ଦରକାର।",
  },
  {
    id: "interpreter",
    icon: "अ",
    en: "I need an interpreter.",
    hi: "मुझे दुभाषिए की सहायता चाहिए।",
    or: "ମୋତେ ଦୁଭାଷୀଙ୍କ ସାହାଯ୍ୟ ଦରକାର।",
  },
  {
    id: "access",
    icon: "♿",
    en: "Is there a step-free entrance?",
    hi: "क्या बिना सीढ़ियों वाला प्रवेश है?",
    or: "ପାହାଚ ବିନା ପ୍ରବେଶ ପଥ ଅଛି କି?",
  },
  {
    id: "repeat",
    icon: "↻",
    en: "I did not understand. Please repeat.",
    hi: "मुझे समझ नहीं आया। कृपया दोहराइए।",
    or: "ମୁଁ ବୁଝିପାରିଲି ନାହିଁ। ଦୟାକରି ପୁଣି କୁହନ୍ତୁ।",
  },
  { id: "yes", icon: "✓", en: "Yes", hi: "हाँ", or: "ହଁ" },
  { id: "no", icon: "×", en: "No", hi: "नहीं", or: "ନା" },
  {
    id: "break",
    icon: "Ⅱ",
    en: "I need a break.",
    hi: "मुझे थोड़ा विराम चाहिए।",
    or: "ମୋତେ କିଛି ବିରତି ଦରକାର।",
  },
];

export const healthLibrary: {
  id: string;
  title: string;
  category: string;
  url: string;
  organization: string;
  reading: string;
  summary: Record<Language, string>;
  question: string;
}[] = [
  {
    id: "online-care",
    title: "Talk to a doctor from home",
    category: "Access to care",
    url: "https://esanjeevani.mohfw.gov.in/",
    organization: "MoHFW / C-DAC",
    reading: "1 min",
    question: "How can I access a doctor online through eSanjeevani?",
    summary: {
      en: "eSanjeevani is India's government telemedicine service. Use the official portal to check registration and service hours. Ask your local health centre about assisted access if using a device is difficult. This app cannot book a consultation or confirm availability.",
      hi: "eSanjeevani सरकारी टेलीमेडिसिन सेवा है। पंजीकरण और समय आधिकारिक पोर्टल पर देखें। उपकरण का उपयोग कठिन हो तो स्थानीय स्वास्थ्य केंद्र से सहायता पूछें। यह ऐप बुकिंग नहीं करता।",
      or: "eSanjeevani ଏକ ସରକାରୀ ଟେଲିମେଡିସିନ ସେବା। ପଞ୍ଜୀକରଣ ଓ ସମୟ ପାଇଁ ଅଧିକୃତ ପୋର୍ଟାଲ୍ ଦେଖନ୍ତୁ। ସହାୟତା ପାଇଁ ସ୍ଥାନୀୟ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ପଚାରନ୍ତୁ। ଏହି ଆପ୍ ବୁକିଂ କରେ ନାହିଁ।",
    },
  },
  {
    id: "movement",
    title: "Movement that works for you",
    category: "Everyday wellbeing",
    url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity",
    organization: "World Health Organization",
    reading: "1 min",
    question:
      "What does WHO say about physical activity for people living with disability?",
    summary: {
      en: "WHO says physical activity benefits health, including for people living with disability. Some activity is better than none. Choose movement suited to your abilities; ask a qualified professional about adaptations appropriate for you.",
      hi: "WHO के अनुसार शारीरिक गतिविधि स्वास्थ्य के लिए लाभकारी है, दिव्यांग लोगों के लिए भी। अपनी क्षमता के अनुसार गतिविधि चुनें। उपयुक्त बदलावों के लिए योग्य पेशेवर से सलाह लें।",
      or: "WHO ଅନୁସାରେ ଶାରୀରିକ ସକ୍ରିୟତା ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ ଉପକାରୀ। ନିଜ କ୍ଷମତା ଅନୁସାରେ କାର୍ଯ୍ୟ ବାଛନ୍ତୁ। ଉପଯୁକ୍ତ ପରିବର୍ତ୍ତନ ପାଇଁ ଯୋଗ୍ୟ ପେଶାଦାରଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ।",
    },
  },
  {
    id: "nutrition",
    title: "A simpler guide to eating well",
    category: "Everyday wellbeing",
    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    organization: "World Health Organization",
    reading: "1 min",
    question:
      "What are the general principles of a healthy diet according to WHO?",
    summary: {
      en: "WHO describes a healthy diet as varied and balanced, with vegetables, fruit, pulses and whole grains. Limit excess salt, free sugars and unhealthy fats. Individual needs differ; a qualified professional can help adapt food choices to your circumstances.",
      hi: "WHO विविध और संतुलित भोजन की सलाह देता है। सब्जियाँ, फल, दालें और साबुत अनाज चुनें। अधिक नमक, चीनी और अस्वास्थ्यकर वसा सीमित करें। व्यक्तिगत जरूरतों के लिए योग्य पेशेवर से सलाह लें।",
      or: "WHO ବିବିଧ ଓ ସନ୍ତୁଳିତ ଖାଦ୍ୟ ପରାମର୍ଶ ଦିଏ। ପନିପରିବା, ଫଳ, ଡାଲି ଓ ସମ୍ପୂର୍ଣ୍ଣ ଶସ୍ୟ ବାଛନ୍ତୁ। ଅଧିକ ଲୁଣ, ଚିନି ଓ ଅସ୍ୱାସ୍ଥ୍ୟକର ଚର୍ବି ସୀମିତ କରନ୍ତୁ।",
    },
  },
  {
    id: "blood-pressure",
    title: "Understanding blood pressure",
    category: "Know the basics",
    url: "https://www.who.int/news-room/fact-sheets/detail/hypertension",
    organization: "World Health Organization",
    reading: "1 min",
    question:
      "Why is checking blood pressure important even when someone feels well?",
    summary: {
      en: "High blood pressure often has no symptoms. Having it measured is the way to know. A qualified healthcare professional can assess readings and discuss care. Do not start, stop or change medication using this information.",
      hi: "उच्च रक्तचाप में अक्सर लक्षण नहीं होते। इसे जानने के लिए मापना जरूरी है। योग्य स्वास्थ्य पेशेवर से जाँच और देखभाल पर चर्चा करें। इस जानकारी से दवा न बदलें।",
      or: "ଉଚ୍ଚ ରକ୍ତଚାପରେ ପ୍ରାୟତଃ ଲକ୍ଷଣ ନଥାଏ। ଜାଣିବା ପାଇଁ ମାପିବା ଦରକାର। ଯୋଗ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ପେଶାଦାରଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ। ଏହି ତଥ୍ୟରୁ ଔଷଧ ବଦଳାନ୍ତୁ ନାହିଁ।",
    },
  },
];

export function buildVisitChecklist(
  channel: "online" | "clinic",
  needs: string[],
) {
  const steps =
    channel === "online"
      ? [
          "Check the official service's current hours and registration requirements.",
          "Find a quiet place and check your internet, camera and battery.",
          "Write down your questions and keep relevant documents ready.",
        ]
      : [
          "Contact the clinic to confirm its location, opening hours and appointment process.",
          "Plan transport and ask whether a companion can attend.",
          "Write down your questions and bring relevant documents.",
        ];
  for (const need of accessNeeds)
    if (needs.includes(need.id)) steps.push(need.request);
  return [
    ...steps,
    "Before you leave: ask for a written explanation of the next steps.",
  ];
}
