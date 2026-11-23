import { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type Session } from "@setu/api-contracts";
import { api } from "../../services/api";
import { useSetu } from "../../services/context";
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
export default function Home() {
  const { prefs, t } = useSetu();
  const [recent, setRecent] = useState<Session[]>([]);
  useFocusEffect(
    useCallback(() => {
      api
        .sessions()
        .then(setRecent)
        .catch(() => {});
    }, []),
  );
  return (
    <Screen>
      <View style={{ ...s.row, justifyContent: "space-between" }}>
        <T
          className="text-gold"
          style={{ fontSize: 19, fontStyle: "italic", fontWeight: "600" }}
        >
          SwasthyaSetu AI
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.emergency}
          onPress={() => router.push("/emergency")}
          style={{ padding: 12 }}
        >
          <Ionicons name="heart-outline" size={23} color="#ffb4ac" />
        </Pressable>
      </View>
      <Badge />
      <Heading
        eyebrow={"HELLO, " + prefs.display_name.toUpperCase()}
        title={t.welcome}
      />
      <Card>
        <View style={s.icon}>
          <Ionicons name="sparkles-outline" size={24} color="#c9b8a0" />
        </View>
        <T style={{ fontSize: 28, lineHeight: 36 }}>
          A little clarity.{"\n"}A thoughtful next step.
        </T>
        <T style={s.muted}>
          Ask about healthcare access, official services or accessibility. Use
          synthetic information only.
        </T>
        <Button
          label={t.ask}
          icon="arrow-up-outline"
          onPress={() => router.push("/(tabs)/chat")}
        />
      </Card>
      {[
        [
          t.resources,
          "Official healthcare portals",
          "library-outline",
          "/(tabs)/resources",
        ],
        [
          t.emergency,
          "112 · India / 108 · Odisha",
          "heart-outline",
          "/emergency",
        ],
        [
          t.accessibility,
          "Make this space yours",
          "accessibility-outline",
          "/preferences",
        ],
      ].map(([title, body, icon, path]) => (
        <Pressable
          key={path}
          accessibilityRole="button"
          onPress={() => router.push(path as "/preferences")}
        >
          <Card
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 20,
              gap: 15,
            }}
          >
            <View style={s.icon}>
              <Ionicons
                name={icon as "library-outline"}
                size={22}
                color={path === "/emergency" ? "#ffb4ac" : "#c9b8a0"}
              />
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 15, fontWeight: "500" }}>{title}</T>
              <T style={s.muted}>{body}</T>
            </View>
            <Ionicons name="arrow-forward" size={17} color="#c9b8a0" />
          </Card>
        </Pressable>
      ))}
      <T accessibilityRole="header" style={s.title}>
        {t.recent}
      </T>
      {recent.length ? (
        recent.slice(0, 4).map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/(tabs)/chat",
                params: { session: r.id },
              })
            }
          >
            <Card style={{ padding: 19 }}>
              <T>{r.title}</T>
              <T style={s.muted}>
                {r.language.toUpperCase()} ·{" "}
                {api.mode === "demo"
                  ? "Synthetic example"
                  : "Saved conversation"}
              </T>
            </Card>
          </Pressable>
        ))
      ) : (
        <T style={s.muted}>{t.noChats}</T>
      )}
      <Notice />
    </Screen>
  );
}
