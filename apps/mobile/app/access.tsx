import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, Share, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import {
  accessNeeds,
  buildVisitChecklist,
  communicationPhrases,
  healthLibrary,
} from "@setu/api-contracts";
import { useSetu } from "../services/context";
import { Button, Card, Heading, Screen, T, s } from "../components/ui";

export default function AccessToolkit() {
  const { prefs } = useSetu();
  const [tab, setTab] = useState("Passport");
  const [needs, setNeeds] = useState<string[]>([]);
  const [channel, setChannel] = useState<"online" | "clinic">("online");
  const [done, setDone] = useState<string[]>([]);
  const [message, setMessage] = useState(
    communicationPhrases[0][prefs.language],
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem("setu-access-v1")
      .then((raw) => {
        if (!raw) return;
        const stored = JSON.parse(raw);
        if (Array.isArray(stored.needs))
          setNeeds(
            stored.needs.filter((n: string) =>
              accessNeeds.some((a) => a.id === n),
            ),
          );
        if (stored.channel === "clinic") setChannel("clinic");
        if (Array.isArray(stored.done))
          setDone(stored.done.filter((n: unknown) => typeof n === "string"));
      })
      .catch(() => {})
      .finally(() => setReady(true));
    return () => {
      Speech.stop();
    };
  }, []);
  const steps = buildVisitChecklist(channel, needs);
  const passport = [
    "MY ACCESSIBILITY PASSPORT",
    "Preferred language: " + prefs.language.toUpperCase(),
    ...accessNeeds.filter((n) => needs.includes(n.id)).map((n) => n.request),
    "Please ask before assisting me. This is not a medical record.",
  ].join("\n\n");
  const read = (text: string) => {
    Speech.stop();
    Speech.speak(text, {
      language: { en: "en-IN", hi: "hi-IN", or: "or-IN" }[prefs.language],
    });
  };
  const chooseNeeds = (
    <View style={{ gap: 10 }}>
      {accessNeeds.map((n) => (
        <Pressable
          key={n.id}
          accessibilityRole="checkbox"
          accessibilityLabel={n.title}
          accessibilityState={{ checked: needs.includes(n.id) }}
          onPress={() => {
            setNeeds(
              needs.includes(n.id)
                ? needs.filter((v) => v !== n.id)
                : [...needs, n.id],
            );
            setDone([]);
          }}
          style={{
            padding: 17,
            borderWidth: 1,
            borderColor: needs.includes(n.id) ? "#087f6b" : "#d5e5db",
            backgroundColor: needs.includes(n.id) ? "#edf7ef" : "white",
            borderRadius: 14,
          }}
        >
          <T style={{ fontWeight: "600" }}>
            {needs.includes(n.id) ? "✓ " : "○ "}
            {n.title}
          </T>
          <T style={s.muted}>{n.detail}</T>
        </Pressable>
      ))}
    </View>
  );
  return (
    <Screen>
      <Heading
        eyebrow="CARE THAT ADAPTS TO YOU"
        title="Your access toolkit"
        body="Practical support before, during and between visits. No AI connection needed."
      />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {["Passport", "Communicate", "Plan a visit", "Library"].map((name) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === name }}
            onPress={() => setTab(name)}
            style={{
              padding: 14,
              backgroundColor: tab === name ? "#dcefe3" : "white",
              borderColor: "#cee0d3",
              borderWidth: 1,
              borderRadius: 14,
            }}
          >
            <T>{name}</T>
          </Pressable>
        ))}
      </View>
      {tab === "Passport" && (
        <>
          <Card>
            <T style={s.title}>How can we make care easier?</T>
            {chooseNeeds}
          </Card>
          <Card>
            <T style={s.eyebrow}>MY ACCESSIBILITY PASSPORT</T>
            <T>{passport}</T>
            <Button
              label="Share passport text"
              onPress={() => {
                void Share.share({ message: passport });
              }}
            />
            <T style={s.muted}>
              Sharing opens your device’s share sheet. Choose who receives this
              information.
            </T>
          </Card>
        </>
      )}
      {tab === "Communicate" && (
        <>
          <T style={s.muted}>
            Tap a phrase. Show it or use your device voice. Change language in
            Preferences.
          </T>
          <View style={{ gap: 10, marginVertical: 20 }}>
            {communicationPhrases.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                onPress={() => setMessage(p[prefs.language])}
                style={{
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#cce1d2",
                  borderRadius: 15,
                  backgroundColor: "white",
                }}
              >
                <T style={{ fontWeight: "600" }}>
                  {p.icon} {p[prefs.language]}
                </T>
              </Pressable>
            ))}
          </View>
          <Card>
            <T
              accessibilityLiveRegion="polite"
              style={{ fontSize: 30, lineHeight: 45 }}
            >
              {message}
            </T>
            <Button label="Read message aloud" onPress={() => read(message)} />
            <Button
              label="Stop audio"
              secondary
              onPress={() => {
                Speech.stop();
              }}
            />
          </Card>
          <T style={s.muted}>
            A text communication aid, not sign-language interpretation.
            Translations need community validation.
          </T>
        </>
      )}
      {tab === "Plan a visit" && (
        <>
          <Card>
            <T style={s.title}>How will you access care?</T>
            <Button
              label={
                channel === "online"
                  ? "✓ Online consultation"
                  : "Online consultation"
              }
              secondary
              onPress={() => {
                setChannel("online");
                setDone([]);
              }}
            />
            <Button
              label={
                channel === "clinic" ? "✓ Visit a clinic" : "Visit a clinic"
              }
              secondary
              onPress={() => {
                setChannel("clinic");
                setDone([]);
              }}
            />
            {chooseNeeds}
          </Card>
          <Card>
            <T style={s.title}>Your preparation checklist</T>
            <T>
              {steps.filter((v) => done.includes(v)).length} of {steps.length}{" "}
              complete
            </T>
            {steps.map((step) => (
              <Pressable
                key={step}
                accessibilityRole="checkbox"
                accessibilityLabel={step}
                accessibilityState={{ checked: done.includes(step) }}
                onPress={() =>
                  setDone(
                    done.includes(step)
                      ? done.filter((v) => v !== step)
                      : [...done, step],
                  )
                }
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#e3eee6",
                }}
              >
                <T>
                  {done.includes(step) ? "✓ " : "○ "}
                  {step}
                </T>
              </Pressable>
            ))}
            <Button
              label="Share visit checklist"
              onPress={() => {
                void Share.share({
                  message: steps
                    .map((v) => (done.includes(v) ? "[x] " : "[ ] ") + v)
                    .join("\n\n"),
                });
              }}
            />
            <T style={s.muted}>
              This does not book a visit. Confirm accessibility arrangements
              with the service.
            </T>
          </Card>
        </>
      )}
      {tab === "Library" &&
        healthLibrary.map((a) => (
          <Card key={a.id}>
            <T style={s.eyebrow}>{a.category}</T>
            <T style={s.title}>{a.title}</T>
            <T>{a.summary[prefs.language]}</T>
            <T style={s.muted}>{a.organization} · Reviewed 24 November 2026</T>
            <Button
              label={"Listen: " + a.title}
              secondary
              onPress={() => read(a.summary[prefs.language])}
            />
            <Button
              label={"Read source: " + a.title}
              secondary
              onPress={() => {
                void Linking.openURL(a.url).catch(() =>
                  Alert.alert("Could not open source", a.url),
                );
              }}
            />
          </Card>
        ))}
      {(tab === "Passport" || tab === "Plan a visit") && (
        <>
          <Button
            label="Save on this device"
            disabled={!ready}
            onPress={() => {
              void AsyncStorage.setItem(
                "setu-access-v1",
                JSON.stringify({ needs, channel, done }),
              ).then(() =>
                Alert.alert(
                  "Saved locally",
                  "Your access preferences and checklist stay on this device.",
                ),
              );
            }}
          />
          <Button
            label="Clear saved access data"
            secondary
            onPress={() => {
              void AsyncStorage.removeItem("setu-access-v1").then(() => {
                setNeeds([]);
                setDone([]);
                Alert.alert("Cleared", "Saved access data was removed.");
              });
            }}
          />
        </>
      )}
      <T style={s.muted}>
        No diagnosis or medical history is collected here. Library content is
        general education. Medical translations need professional review.
      </T>
    </Screen>
  );
}
