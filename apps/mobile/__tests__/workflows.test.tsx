import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { SetuProvider } from "../services/context";
import { api } from "../services/api";
import Home from "../app/(tabs)/index";
import Chat from "../app/(tabs)/chat";
import Preferences from "../app/preferences";
import Emergency from "../app/emergency";
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
test("home routes to native chat", async () => {
  render(
    <SetuProvider>
      <Home />
    </SetuProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText("Care begins with understanding.")).toBeTruthy(),
  );
  fireEvent.press(screen.getByLabelText("Ask a question"));
  expect(router.push).toHaveBeenCalledWith("/(tabs)/chat");
});
test("chat sends and displays demo content", async () => {
  render(
    <SetuProvider>
      <Chat />
    </SetuProvider>,
  );
  fireEvent.changeText(
    screen.getByLabelText("Ask a question"),
    "Online doctor",
  );
  fireEvent.press(screen.getByLabelText("Send"));
  expect(await screen.findByText("SETU · DEMO CONTENT")).toBeTruthy();
  expect(
    screen.getByText("Illustrative service navigation guide"),
  ).toBeTruthy();
});
test("language and accessibility preferences persist", async () => {
  render(
    <SetuProvider>
      <Preferences />
    </SetuProvider>,
  );
  await waitFor(() => expect(screen.getByLabelText("हिन्दी")).toBeTruthy());
  fireEvent.press(screen.getByLabelText("हिन्दी"));
  fireEvent(screen.getByLabelText("High contrast"), "valueChange", true);
  fireEvent.press(screen.getByLabelText("Save preferences"));
  await waitFor(async () =>
    expect((await api.preferences()).language).toBe("hi"),
  );
  expect((await api.preferences()).high_contrast).toBe(true);
});
test("emergency screen never calls automatically and opens dialer on action", async () => {
  render(
    <SetuProvider>
      <Emergency />
    </SetuProvider>,
  );
  expect(Linking.openURL).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText("Call 112 · India emergency"));
  await waitFor(() => expect(Linking.openURL).toHaveBeenCalledWith("tel:112"));
});
