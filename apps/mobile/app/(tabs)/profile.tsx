import { Alert, TextInput } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultPreferences } from "@setu/api-contracts";
import { useSetu } from "../../services/context";
import { api } from "../../services/api";
import {
  Badge,
  Button,
  Card,
  Heading,
  Notice,
  Screen,
  T,
  s,
} from "../../components/ui";
export default function Profile() {
  const { prefs, t, save, reload } = useSetu();
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  async function reset() {
    await api.resetDemo();
    await AsyncStorage.multiRemove(["setu-prefs", "setu-onboarding"]);
    await save(defaultPreferences);
    router.replace("/onboarding");
  }
  return (
    <Screen>
      <Heading eyebrow="YOUR SPACE, YOUR PREFERENCES" title={t.profile} />
      <Card>
        <T style={{ fontSize: 26, lineHeight: 35 }}>{prefs.display_name}</T>
        <Badge />
        <T style={s.muted}>
          {api.mode === "demo"
            ? "Fictional demo profile. No medical records collected."
            : "Preferences belong to your signed-in account."}
        </T>
        <Button
          label={t.settings}
          secondary
          onPress={() => router.push("/preferences")}
        />
        <Button
          label={t.emergency}
          secondary
          onPress={() => router.push("/emergency")}
        />
        <Button
          label={api.mode === "demo" ? t.signOut : "Sign in / switch account"}
          secondary
          onPress={() => {
            void api
              .logout()
              .then(reload)
              .then(() => router.replace("/signin"));
          }}
        />
        {api.mode === "demo" && (
          <Button
            label={t.reset}
            secondary
            onPress={() =>
              Alert.alert(
                "Reset demo data?",
                "This removes local synthetic changes and preferences.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => void reset(),
                  },
                ],
              )
            }
          />
        )}
      </Card>
      <Card>
        <T style={s.title}>{t.feedback}</T>
        <T style={s.muted}>
          Product feedback only. No medical or identifying information.
        </T>
        <TextInput
          accessibilityLabel={t.feedback}
          value={feedback}
          onChangeText={setFeedback}
          multiline
          maxLength={2000}
          placeholder="What could make this easier to use?"
          placeholderTextColor="#526a63"
          style={[s.input, { minHeight: 100 }]}
        />
        <Button
          label={sending ? "Saving…" : "Submit feedback"}
          disabled={sending || feedback.trim().length < 2}
          onPress={() => {
            setSending(true);
            api
              .feedback({
                rating: 5,
                message: feedback,
                language: prefs.language,
              })
              .then(() => {
                setFeedback("");
                Alert.alert("Saved", "Your feedback was saved.");
              })
              .catch((e) => Alert.alert("Could not save", e.message))
              .finally(() => setSending(false));
          }}
        />
      </Card>
      <T style={s.muted}>
        Privacy: Demo changes stay on this device. Real-mode questions are sent
        to the configured inference provider; saving history requires consent.
        You can remove individual saved conversations from the chat history
        controls.
      </T>
      <Notice />
    </Screen>
  );
}
