import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoApi } from "./demo";
import { createRealApi } from "./real";
import { defaultPreferences } from "./i18n";
import { classify } from "./safety";
import type { Storage } from "./types";
const data = new Map<string, string>();
const storage: Storage = {
  getItem: (key) => data.get(key) || null,
  setItem: (key, v) => {
    data.set(key, v);
  },
  removeItem: (key) => {
    data.delete(key);
  },
};
beforeEach(() => {
  data.clear();
  vi.unstubAllGlobals();
});
describe("cross-platform demo adapter", () => {
  it("is immediately usable and labels scripted answers", async () => {
    const api = createDemoApi(storage);
    const r = await api.chat({
      message: "How can I access a doctor online?",
      language: "en",
      use_rag: true,
    });
    expect(r.mode).toBe("demo");
    expect(r.reply).toContain("Demo example");
    expect(r.citations[0].verified).toBe(false);
    expect((await api.sessions()).length).toBe(12);
  });
  it("persists only with consent across adapter instances", async () => {
    const api = createDemoApi(storage);
    await api.chat({
      message: "Online doctor",
      language: "hi",
      use_rag: true,
      persist: true,
    });
    expect((await createDemoApi(storage).sessions()).length).toBe(13);
  });
  it("saves preferences and resets synthetic changes", async () => {
    const api = createDemoApi(storage);
    await api.savePreferences({
      ...defaultPreferences,
      language: "or",
      high_contrast: true,
    });
    expect((await createDemoApi(storage).preferences()).language).toBe("or");
    await api.resetDemo();
    expect((await api.preferences()).high_contrast).toBe(false);
  });
  it("guards admin operations and persists upload/index/delete", async () => {
    const api = createDemoApi(storage);
    await expect(api.documents()).rejects.toThrow("Administrator");
    await api.login("", "", true);
    const d = await api.upload({
      file: new Blob(["Synthetic document content"]),
      filename: "guide.md",
      title: "Synthetic guide",
      category: "General",
      language: "en",
      url: "",
      organization: "",
      verified: false,
    });
    expect((await api.index(d.id)).status).toBe("indexed");
    expect((await api.documents({ q: "Synthetic guide" })).length).toBe(1);
    await api.deleteDocument(d.id);
    expect((await api.documents()).length).toBe(24);
  });
  it("rejects invalid uploads", async () => {
    const api = createDemoApi(storage);
    await api.login("", "", true);
    await expect(
      api.upload({
        file: new Blob(["x"]),
        filename: "bad.exe",
        title: "Bad",
        category: "General",
        language: "en",
        url: "",
        organization: "",
        verified: false,
      }),
    ).rejects.toThrow("Only PDF");
  });
  it("does not pre-invent safety passes", async () => {
    const api = createDemoApi(storage);
    await api.login("", "", true);
    expect((await api.safetyTests()).every((c) => c.passed === null)).toBe(
      true,
    );
    expect((await api.safetyTests(true)).every((c) => c.passed)).toBe(true);
  });
  it("filters synthetic analytics and records feedback", async () => {
    const api = createDemoApi(storage);
    await api.login("", "", true);
    expect((await api.analytics({ language: "hi" })).rows).toHaveLength(30);
    await api.feedback({
      message: "Synthetic feedback",
      rating: 4,
      language: "en",
    });
    expect((await api.overview()).feedback_submissions).toBe(16);
  });
  it("clearly declines unconfigured arbitrary AI questions", async () => {
    const r = await createDemoApi(storage).chat({
      message: "Quantum medicine?",
      language: "or",
      use_rag: true,
    });
    expect(r.reply).toContain("not configured");
    expect(r.citations).toEqual([]);
  });
});
it.each([
  "I cannot breathe",
  "Chest pain and sweating",
  "मुझे सांस लेने में तकलीफ है",
  "ମୋତେ ଶ୍ୱାସ ନେବାରେ କଷ୍ଟ ହେଉଛି",
])("recognizes conservative emergency example: %s", (q) =>
  expect(classify(q)).toBe("emergency"),
);
it("real adapter uses centralized paths and JWTs; errors never fall back to demo", async () => {
  await storage.setItem("setu-access-token", "synthetic-token");
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: "Provider unavailable" } }),
        { status: 503 },
      ),
    );
  vi.stubGlobal("fetch", fetcher);
  const real = createRealApi({
    baseUrl: "https://example.org",
    tokenStorage: storage,
  });
  expect(real.mode).toBe("real");
  await expect(
    real.chat({ message: "Online doctor", language: "en", use_rag: true }),
  ).rejects.toThrow("Provider unavailable");
  expect(fetcher.mock.calls[0][0]).toBe("https://example.org/api/v1/chat");
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(
    "Bearer synthetic-token",
  );
});
