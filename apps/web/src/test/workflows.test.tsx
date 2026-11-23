import { beforeEach, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "../context";
import App from "../App";
import { api } from "../services";
function mount(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <StrictMode>
          <Provider>
            <App />
          </Provider>
        </StrictMode>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
it("navigates patient screens", async () => {
  const user = userEvent.setup();
  mount("/app");
  expect(
    await screen.findByRole("heading", {
      name: "Care begins with understanding.",
    }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "AI Chat" }));
  expect(
    await screen.findByRole("heading", { name: "A conversation, with care." }),
  ).toBeInTheDocument();
});
it("submits chat and renders labeled output and source", async () => {
  const user = userEvent.setup();
  mount("/app/chat");
  await user.type(
    screen.getByLabelText("Ask a question"),
    "How can I access a doctor online?",
  );
  await user.click(screen.getByRole("button", { name: "Send" }));
  expect(await screen.findByText("SETU · DEMO CONTENT")).toBeInTheDocument();
  expect(
    screen.getByText("Illustrative service navigation guide"),
  ).toBeInTheDocument();
});
it("saves accessibility settings", async () => {
  const user = userEvent.setup();
  mount("/app/preferences");
  await user.click(screen.getByRole("checkbox", { name: "High contrast" }));
  await user.click(screen.getByRole("button", { name: "Save preferences" }));
  await waitFor(() =>
    expect(document.documentElement.dataset.contrast).toBe("true"),
  );
  expect((await api.preferences()).high_contrast).toBe(true);
});
it("uploads and filters a synthetic document", async () => {
  await api.login("", "", true);
  const user = userEvent.setup();
  mount("/admin/documents");
  await user.click(await screen.findByRole("button", { name: "Add document" }));
  await user.upload(
    screen.getByLabelText("Document file"),
    new File(["Synthetic content for upload."], "test.txt", {
      type: "text/plain",
    }),
  );
  await user.type(
    screen.getByLabelText("Source title"),
    "Test synthetic upload",
  );
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Add document",
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await user.type(
    screen.getByLabelText("Search documents"),
    "Test synthetic upload",
  );
  expect(await screen.findByText("Test synthetic upload")).toBeInTheDocument();
  expect(
    screen.queryByText("Illustrative Safety guide 3"),
  ).not.toBeInTheDocument();
});
it("filters analytics and exposes export", async () => {
  await api.login("", "", true);
  const user = userEvent.setup();
  mount("/admin/analytics");
  await user.selectOptions(await screen.findByRole("combobox"), "hi");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeEnabled(),
  );
});
it("renders API failures with retry", async () => {
  vi.spyOn(api, "resources").mockRejectedValueOnce(
    new Error("Synthetic connection failure"),
  );
  mount("/app/resources");
  expect(
    await screen.findByText("Synthetic connection failure"),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  vi.restoreAllMocks();
});
