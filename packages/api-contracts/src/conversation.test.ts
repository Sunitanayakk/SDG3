import { describe, expect, it } from "vitest";
import cases from "./conversation-cases.json";
import { conversationalReply } from "./conversation";
import { createDemoApi } from "./demo";

describe("conversational turn routing shared by web and native", () => {
  for (const [intent, examples] of Object.entries(cases)) {
    it.each(examples)(`${intent}: %s`, (message) => {
      const reply = conversationalReply(message, "en");
      if (intent === "not_conversational") expect(reply).toBeUndefined();
      else {
        expect(reply).toBeTruthy();
        expect(reply).not.toContain("verified evidence");
        expect(reply).not.toContain("consult a qualified");
      }
    });
  }
  it.each(["en", "hi", "or"] as const)(
    "greets in %s without fake citations",
    async (language) => {
      const api = createDemoApi({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      });
      const result = await api.chat({
        message: "hii",
        language,
        use_rag: true,
      });
      expect(result.reply).toBe(conversationalReply("hii", language));
      expect(result.mode).toBe("demo");
      expect(result.citations).toEqual([]);
      expect(result.retrieval.used).toBe(false);
    },
  );
  it("still handles care questions and emergency messages that begin with a greeting", async () => {
    const api = createDemoApi({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
    const care = await api.chat({
      message: "Hi, how can I access a doctor online?",
      language: "en",
      use_rag: true,
    });
    expect(care.citations).toHaveLength(1);
    const emergency = await api.chat({
      message: "Hii, I cannot breathe",
      language: "en",
      use_rag: true,
    });
    expect(emergency.safety_level).toBe("emergency");
    expect(emergency.reply).not.toBe(conversationalReply("hii", "en"));
  });
});
