import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Speech from "expo-speech";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import type { ChatMessage } from "@setu/api-contracts";
import { pandaMoodForChat } from "@setu/api-contracts";
import { Panda } from "../../components/Panda";
import { api } from "../../services/api";
import { useSetu } from "../../services/context";
import {
  Badge,
  Button,
  Card,
  ErrorBox,
  Notice,
  Screen,
  T,
  s,
} from "../../components/ui";
export default function Chat() {
  const { prefs, t } = useSetu();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sid, setSid] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState("");
  const [focused, setFocused] = useState(false);
  const params = useLocalSearchParams<{ session?: string }>();
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (params.session)
      api
        .session(params.session)
        .then((r) => {
          setMessages(r.messages || []);
          setSid(r.id);
        })
        .catch((e) => setError(e.message));
  }, [params.session]);
  async function send(value: string, retry = false) {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    if (!retry)
      setMessages((m) => [
        ...m,
        { id: "u" + Date.now(), role: "user", content: value, citations: [] },
      ]);
    setQuestion("");
    try {
      const result = await api.chat({
        message: value,
        language: prefs.language,
        use_rag: true,
        persist: prefs.persist_chats,
        session_id: sid,
      });
      setSid(result.session_id);
      setMessages((m) => [
        ...m,
        {
          id: result.message_id,
          role: "assistant",
          content: result.reply,
          citations: result.citations,
          safety_level: result.safety_level,
          mode: result.mode,
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
      setFailed(value);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen scroll={false}>
      <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
        <Panda
          size={54}
          mood={pandaMoodForChat({
            pending: busy,
            error: !!error,
            focused,
            hasReply: messages.some((m) => m.role === "assistant"),
            safety: messages.filter((m) => m.role === "assistant").at(-1)
              ?.safety_level,
          })}
        />
        <T style={s.muted}>Setu, by your side.</T>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View
          style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#dbe9e0",
            gap: 12,
          }}
        >
          <View style={{ ...s.row, justifyContent: "space-between" }}>
            <T accessibilityRole="header" style={s.title}>
              SwasthyaSetu companion
            </T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.newChat}
              onPress={() => {
                setMessages([]);
                setSid(undefined);
                setError("");
                router.setParams({ session: undefined });
              }}
              style={{ padding: 10 }}
            >
              <Ionicons name="add" color="#087f6b" size={24} />
            </Pressable>
          </View>
          <Badge />
          {sid && prefs.persist_chats && (
            <Button
              label="Delete saved conversation"
              secondary
              onPress={() =>
                Alert.alert(
                  "Delete saved conversation?",
                  "This removes the saved copy.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () =>
                        void api
                          .deleteSession(sid)
                          .then(() => {
                            setMessages([]);
                            setSid(undefined);
                            router.setParams({ session: undefined });
                          })
                          .catch((e) => setError(e.message)),
                    },
                  ],
                )
              }
            />
          )}
          <T style={s.muted}>
            {prefs.language.toUpperCase()} ·{" "}
            {prefs.persist_chats ? "Saving enabled" : "Not saved by default"}
          </T>
        </View>
        <ScrollView
          ref={scroll}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 18, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scroll.current?.scrollToEnd({ animated: !prefs.reduced_motion })
          }
        >
          {!messages.length && (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                paddingVertical: 25,
              }}
            >
              <View
                style={[s.icon, { width: 70, height: 70, borderRadius: 35 }]}
              >
                <Ionicons name="sparkles-outline" size={33} color="#087f6b" />
              </View>
              <T style={{ fontSize: 28, lineHeight: 37, textAlign: "center" }}>
                What’s on your mind?
              </T>
              <T style={[s.muted, { textAlign: "center" }]}>
                General information, with clear limits.{"\n"}Please use
                synthetic details only.
              </T>
              {[
                "How can I access a doctor online?",
                "How can I use large text?",
              ].map((q) => (
                <Button
                  key={q}
                  label={q}
                  secondary
                  onPress={() => void send(q)}
                />
              ))}
            </View>
          )}
          {messages.map((m) => (
            <Card
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "97%",
                padding: 20,
                backgroundColor:
                  m.safety_level === "emergency"
                    ? "#fff2ee"
                    : m.role === "user"
                      ? "#eaf5ee"
                      : "#ffffff",
                borderColor:
                  m.safety_level === "emergency" ? "#e8b4a9" : "#d4e5d9",
              }}
            >
              <T style={s.eyebrow}>
                {m.role === "user"
                  ? "YOU"
                  : m.mode === "demo"
                    ? "SETU · DEMO CONTENT"
                    : "SETU · INFORMATION"}
              </T>
              <T selectable>{m.content}</T>
              {m.safety_level === "emergency" && (
                <Button
                  label={t.emergency}
                  danger
                  onPress={() => router.push("/emergency")}
                />
              )}{" "}
              {m.citations.map((c) => (
                <Pressable
                  key={c.source_id}
                  accessibilityRole={c.url ? "link" : "text"}
                  disabled={!c.url}
                  onPress={() => c.url && void Linking.openURL(c.url)}
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: "#dbe9e0",
                    paddingTop: 12,
                    gap: 6,
                  }}
                >
                  <T style={s.link}>{c.title}</T>
                  <T style={{ ...s.muted, fontSize: 11 }}>
                    {c.verified
                      ? "Reviewed source"
                      : "Illustrative / unverified source"}
                  </T>
                </Pressable>
              ))}
              {m.role === "assistant" && (
                <View style={s.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.copy}
                    onPress={() =>
                      void Clipboard.setStringAsync(m.content).then(() =>
                        Alert.alert(t.copy, "Response copied."),
                      )
                    }
                    style={{ padding: 10 }}
                  >
                    <Ionicons name="copy-outline" size={17} color="#087f6b" />
                  </Pressable>
                  {prefs.voice && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.read}
                      onPress={() => {
                        Speech.stop();
                        Speech.speak(m.content, {
                          language: { en: "en-IN", hi: "hi-IN", or: "or-IN" }[
                            prefs.language
                          ],
                          onError: () =>
                            Alert.alert(
                              "Voice unavailable",
                              "Use the displayed text; a matching voice may not be installed.",
                            ),
                        });
                      }}
                      style={{ padding: 10 }}
                    >
                      <Ionicons
                        name="volume-medium-outline"
                        size={20}
                        color="#087f6b"
                      />
                    </Pressable>
                  )}
                </View>
              )}
            </Card>
          ))}
          {busy && (
            <T accessibilityLiveRegion="polite" style={s.muted}>
              {api.mode === "demo"
                ? "Preparing a demo example…"
                : "Retrieving evidence and preparing an answer…"}
            </T>
          )}
          {error && (
            <ErrorBox message={error} onRetry={() => void send(failed, true)} />
          )}
        </ScrollView>
        <View
          style={{
            paddingHorizontal: 17,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#dbe9e0",
          }}
        >
          <View style={{ ...s.row, alignItems: "flex-end", gap: 9 }}>
            <TextInput
              accessibilityLabel={t.ask}
              placeholder={t.placeholder}
              placeholderTextColor="#526a63"
              value={question}
              onChangeText={setQuestion}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              multiline
              maxLength={4000}
              style={[s.input, { flex: 1, maxHeight: 120, minHeight: 51 }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.send}
              accessibilityState={{ disabled: busy || !question.trim() }}
              disabled={busy || !question.trim()}
              onPress={() => void send(question)}
              style={{
                backgroundColor: "#087f6b",
                borderRadius: 15,
                padding: 15,
                opacity: busy || !question.trim() ? 0.5 : 1,
              }}
            >
              <Ionicons name="arrow-up" size={22} color="#ffffff" />
            </Pressable>
          </View>
          <Notice />
          {prefs.language !== "en" && (
            <T style={{ ...s.muted, fontSize: 10, paddingBottom: 10 }}>
              {t.translation}
            </T>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
