import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultPreferences } from "@setu/api-contracts";
import { Provider, useSetu } from "../context";
import { api } from "../services";

vi.mock("../services", () => ({ api: { mode: "real", preferences: vi.fn() } }));

function Probe() {
  const { prefs, reload } = useSetu();
  return (
    <>
      <output>
        {prefs.display_name}: {String(prefs.persist_chats)}
      </output>
      <button onClick={() => void reload()}>Refresh account</button>
    </>
  );
}

it("reloads account preferences after login and removes identity and saving consent after logout", async () => {
  const user = userEvent.setup();
  sessionStorage.clear();
  localStorage.setItem(
    "setu-prefs",
    JSON.stringify({ display_name: "Previous account", persist_chats: true }),
  );
  vi.mocked(api.preferences).mockResolvedValue({
    ...defaultPreferences,
    display_name: "Account B",
    persist_chats: true,
  });
  render(
    <Provider>
      <Probe />
    </Provider>,
  );
  expect(await screen.findByText("Guest: false")).toBeInTheDocument();
  expect(api.preferences).not.toHaveBeenCalled();
  sessionStorage.setItem("setu-access-token", "synthetic-test-token");
  await user.click(screen.getByRole("button", { name: "Refresh account" }));
  expect(await screen.findByText("Account B: true")).toBeInTheDocument();
  sessionStorage.clear();
  await user.click(screen.getByRole("button", { name: "Refresh account" }));
  expect(await screen.findByText("Guest: false")).toBeInTheDocument();
});
