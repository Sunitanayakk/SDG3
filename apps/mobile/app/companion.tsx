import { useState } from "react";
import { Pressable, View } from "react-native";
import { pandaMoods, type PandaMood } from "@setu/api-contracts";
import { Panda } from "../components/Panda";
import { Button, Card, Heading, Screen, T, s } from "../components/ui";
export default function Companion() {
  const [mood, setMood] = useState<PandaMood>("welcome");
  const [paused, setPaused] = useState(false);
  const selected = pandaMoods.find((m) => m.id === mood)!;
  return (
    <Screen>
      <Heading
        eyebrow="MEET SETU"
        title="A friendly face, by your side."
        body="Choose an expression or pause the movement. Accessibility preferences take priority."
      />
      <Card>
        <View style={{ alignItems: "center" }}>
          <Panda mood={mood} size={230} paused={paused} />
        </View>
        <T style={s.title}>{selected.label}</T>
        <T>{selected.description}</T>
        <Button
          label={paused ? "Play panda movement" : "Pause panda movement"}
          secondary
          onPress={() => setPaused(!paused)}
        />
      </Card>
      <View style={{ gap: 12, marginVertical: 20 }}>
        {pandaMoods.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityState={{ selected: mood === m.id }}
            onPress={() => setMood(m.id)}
            style={{
              padding: 18,
              borderWidth: 1,
              borderColor: mood === m.id ? "#75aa87" : "#d5e5db",
              borderRadius: 15,
              backgroundColor: mood === m.id ? "#edf7e9" : "white",
            }}
          >
            <T style={{ fontWeight: "600" }}>{m.label}</T>
            <T style={s.muted}>{m.description}</T>
          </Pressable>
        ))}
      </View>
      <T style={s.muted}>
        Setu’s expressions reflect app activity, not an assessment of your
        emotions or health. Urgent messages receive a calm, attentive pose.
      </T>
    </Screen>
  );
}
