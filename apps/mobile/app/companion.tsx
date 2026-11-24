import { useState } from "react";
import { Pressable, View } from "react-native";
import { Panda } from "../components/Panda";
import { Button, Card, Heading, Screen, T, s } from "../components/ui";
const scenes = [
  {
    id: "jungle" as const,
    name: "Leaf-crown panda",
    description:
      "Realistic fur, a leaf crown and the original natural facial movement.",
  },
  {
    id: "meadow" as const,
    name: "Butterfly panda",
    description:
      "The original bow-tie panda, with its butterfly and gentle head and eye movement.",
  },
];
export default function Companion() {
  const [scene, setScene] = useState<"jungle" | "meadow">("jungle");
  const [paused, setPaused] = useState(false);
  const selected = scenes.find((s) => s.id === scene)!;
  return (
    <Screen>
      <Heading
        eyebrow="MEET SETU"
        title="A friendly face, by your side."
        body="Explore two panda scenes, or pause the motion. Your accessibility preferences take priority."
      />
      <Card>
        <View style={{ alignItems: "center" }}>
          <Panda mood="idle" variant={scene} size={230} paused={paused} />
        </View>
        <T style={s.title}>{selected.name}</T>
        <T>{selected.description}</T>
        <Button
          label={paused ? "Play panda movement" : "Pause panda movement"}
          secondary
          onPress={() => setPaused(!paused)}
        />
      </Card>
      <View style={{ gap: 12, marginVertical: 20 }}>
        {scenes.map((v) => (
          <Pressable
            key={v.id}
            accessibilityRole="button"
            accessibilityState={{ selected: scene === v.id }}
            onPress={() => setScene(v.id)}
            style={{
              padding: 18,
              borderWidth: 1,
              borderColor: scene === v.id ? "#75aa87" : "#d5e5db",
              borderRadius: 15,
              backgroundColor: scene === v.id ? "#edf7e9" : "white",
            }}
          >
            <T style={{ fontWeight: "600" }}>{v.name}</T>
            <T style={s.muted}>{v.description}</T>
          </Pressable>
        ))}
      </View>
      <T style={s.muted}>
        Artwork and motion: Bambuk Studio. Both original loops are 20 seconds.
        App activity labels describe the interface, not an assessment of your
        emotions or health.
      </T>
    </Screen>
  );
}
