import { useState } from "react";
import { Alert, Pressable, Switch, TextInput, View } from "react-native";
import { router } from "expo-router";
import { languages, type Preferences } from "@setu/api-contracts";
import { useSetu } from "../services/context";
import { Button, Card, Heading, Screen, T, s } from "../components/ui";
export default function PreferencesScreen() {
  const { prefs, save, t } = useSetu();
  const [draft, setDraft] = useState(prefs);
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <Button label={t.back} secondary onPress={() => router.back()} />
      <Heading eyebrow="YOUR EXPERIENCE, YOUR WAY" title={t.settings} />
      <Card>
        <T>{t.name}</T>
        <TextInput
          accessibilityLabel={t.name}
          value={draft.display_name}
          maxLength={80}
          onChangeText={(v) => setDraft({ ...draft, display_name: v })}
          style={s.input}
        />
        <T>{t.language}</T>
        <View style={{ gap: 10 }}>
          {languages.map((l) => (
            <Button
              key={l.id}
              label={l.name}
              secondary={draft.language !== l.id}
              onPress={() => setDraft({ ...draft, language: l.id })}
            />
          ))}
        </View>
        <T>{t.textSize}</T>
        <View style={{ gap: 10 }}>
          {(["normal", "large", "extra"] as const).map((x) => (
            <Button
              key={x}
              label={
                x === "extra"
                  ? "Extra large"
                  : x === "large"
                    ? "Large"
                    : "Standard"
              }
              secondary={draft.text_size !== x}
              onPress={() => setDraft({ ...draft, text_size: x })}
            />
          ))}
        </View>
        {(
          [
            "high_contrast",
            "reduced_motion",
            "text_only",
            "voice",
            "persist_chats",
          ] as const
        ).map((key, i) => (
          <View
            key={key}
            style={{
              ...s.row,
              justifyContent: "space-between",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#dbe9e0",
            }}
          >
            <T style={{ flex: 1, fontSize: 14 }}>
              {[t.contrast, t.motion, t.textOnly, t.voice, t.history][i]}
            </T>
            <Switch
              accessibilityLabel={
                [t.contrast, t.motion, t.textOnly, t.voice, t.history][i]
              }
              value={draft[key]}
              onValueChange={(v) =>
                setDraft({ ...draft, [key]: v } as Preferences)
              }
              trackColor={{ false: "#64786b", true: "#087f6b" }}
              thumbColor="#164631"
            />
          </View>
        ))}
        <T style={s.muted}>
          Saving chats is optional and off by default. Use synthetic information
          only. {t.translation}
        </T>
        <Button
          label={busy ? "Saving…" : t.save}
          disabled={busy}
          onPress={() => {
            setBusy(true);
            save(draft)
              .then(() =>
                Alert.alert("Saved", "Your preferences have been saved."),
              )
              .catch((e) => Alert.alert("Could not save", e.message))
              .finally(() => setBusy(false));
          }}
        />
      </Card>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/emergency")}
        style={{ padding: 15 }}
      >
        <T style={{ color: "#ae3333", textAlign: "center" }}>{t.emergency}</T>
      </Pressable>
    </Screen>
  );
}
