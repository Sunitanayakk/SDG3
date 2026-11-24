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
import AccessToolkit from "../app/access";
import * as Speech from "expo-speech";
import Companion from "../app/companion";
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
it("native companion offers expressions and an explicit pause control", async () => {
  render(
    <SetuProvider>
      <Companion />
    </SetuProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText("A friendly face, by your side.")).toBeTruthy(),
  );
  const thinking = screen.getByRole("button", { name: /Thinking/ });
  fireEvent.press(thinking);
  expect(thinking.props.accessibilityState.selected).toBe(true);
  fireEvent.press(screen.getByLabelText("Pause panda movement"));
  expect(screen.getByLabelText("Play panda movement")).toBeTruthy();
  expect(Speech.speak).not.toHaveBeenCalled();
});
it("communication board shows a selected message and reads only on action", async () => {
  render(
    <SetuProvider>
      <AccessToolkit />
    </SetuProvider>,
  );
  await waitFor(() => expect(screen.getByText("Communicate")).toBeTruthy());
  fireEvent.press(screen.getByText("Communicate"));
  fireEvent.press(screen.getByText("✍ Please write it down."));
  expect(Speech.speak).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("Read message aloud"));
  expect(Speech.speak).toHaveBeenCalledWith("Please write it down.", {
    language: "en-IN",
  });
});
it("saves access needs locally only when requested", async () => {
  render(
    <SetuProvider>
      <AccessToolkit />
    </SetuProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText("Save on this device")).toBeTruthy(),
  );
  fireEvent.press(screen.getByLabelText("Hearing"));
  expect(await AsyncStorage.getItem("setu-access-v1")).toBeNull();
  fireEvent.press(screen.getByText("Save on this device"));
  await waitFor(async () =>
    expect(
      JSON.parse((await AsyncStorage.getItem("setu-access-v1")) || "{}").needs,
    ).toEqual(["hearing"]),
  );
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
