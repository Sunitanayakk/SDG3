import { describe, expect, it } from "vitest";
import { pandaMoodForChat } from "./companion";

const ready = { pending: false, error: false, focused: false, hasReply: false };
describe("companion follows app state without interpreting patient emotions", () => {
  it("prioritises urgent guidance over focus, waiting and previous replies", () => {
    expect(
      pandaMoodForChat({
        pending: true,
        error: false,
        focused: true,
        hasReply: true,
        safety: "emergency",
      }),
    ).toBe("concerned");
  });
  it("keeps errors calm and waiting distinct from listening", () => {
    expect(pandaMoodForChat({ ...ready, error: true, focused: true })).toBe(
      "concerned",
    );
    expect(pandaMoodForChat({ ...ready, pending: true, focused: true })).toBe(
      "thinking",
    );
    expect(pandaMoodForChat({ ...ready, focused: true, hasReply: true })).toBe(
      "listening",
    );
  });
  it("welcomes a new chat and relaxes when a reply is available", () => {
    expect(pandaMoodForChat(ready)).toBe("welcome");
    expect(
      pandaMoodForChat({ ...ready, hasReply: true, safety: "normal" }),
    ).toBe("happy");
  });
});
