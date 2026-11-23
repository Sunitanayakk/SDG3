import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { languages } from "@setu/api-contracts";
import { useSetu } from "../services/context";
import { Button, Screen, T, s } from "../components/ui";
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const { prefs, save, t } = useSetu();
  async function finish() {
    await AsyncStorage.setItem("setu-onboarding", "done");
    router.replace("/(tabs)");
  }
  const titles = [
    "Welcome to SwasthyaSetu AI",
    t.onboardingLanguage,
    t.onboardingTrust,
  ];
  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <T style={s.eyebrow}>SWASTHYASETU AI</T>
        <Pressable
          accessibilityRole="button"
          onPress={() => void finish()}
          style={{ padding: 14 }}
        >
          <T style={s.link}>{t.skip}</T>
        </Pressable>
      </View>
      {!prefs.text_only && (
        <Animated.View
          key={step}
          entering={FadeIn.duration(
            prefs.reduced_motion ? 0 : 500,
          ).reduceMotion(ReduceMotion.System)}
          style={{ alignItems: "center", paddingVertical: 40 }}
        >
          <Svg
            width={240}
            height={250}
            viewBox="0 0 240 250"
            accessibilityLabel="Connected care illustration"
          >
            <Circle
              cx="120"
              cy="125"
              r="82"
              stroke="#a78b7144"
              strokeWidth="1"
              fill="none"
            />
            <Circle
              cx="120"
              cy="125"
              r="61"
              stroke="#c9b8a088"
              fill="#a78b710b"
            />
            <Circle
              cx="120"
              cy="125"
              r="39"
              fill="#201c16"
              stroke="#a78b7188"
            />
            <Path
              d="M120 105v40M100 125h40"
              stroke="#c9b8a0"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {[
              [45, 74],
              [194, 75],
              [44, 177],
              [193, 178],
            ].map(([cx, cy], i) => (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={step === i % 3 ? 9 : 6}
                fill="#c9b8a0"
                opacity={0.6}
              />
            ))}
          </Svg>
        </Animated.View>
      )}
      <T style={s.eyebrow}>0{step + 1} / A BRIDGE TO UNDERSTANDING</T>
      <T accessibilityRole="header" style={s.heading}>
        {titles[step]}
      </T>
      <T style={s.muted}>
        {
          [
            "Intelligent care. Accessible to everyone. Explore healthcare information with a thoughtful AI companion.",
            "Choose English, Hindi or Odia. Interface translations are available; medical translations require professional validation.",
            "Clear sources, larger text and high contrast. General information only, with emergency guidance when recognized.",
          ][step]
        }
      </T>
      {step === 1 && (
        <View style={{ gap: 10, marginVertical: 15 }}>
          {languages.map((l) => (
            <Button
              key={l.id}
              label={l.name}
              secondary={prefs.language !== l.id}
              onPress={() => void save({ ...prefs, language: l.id })}
            />
          ))}
        </View>
      )}
      <View
        style={{
          flexDirection: "row",
          gap: 7,
          justifyContent: "center",
          marginVertical: 20,
        }}
      >
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: i === step ? 27 : 7,
              height: 7,
              borderRadius: 9,
              backgroundColor: i === step ? "#c9b8a0" : "#39332a",
            }}
          />
        ))}
      </View>
      <Button
        label={step === 2 ? t.start : t.next}
        icon="arrow-forward"
        onPress={() => {
          if (step === 2) void finish();
          else setStep(step + 1);
        }}
      />
      {step > 0 && (
        <Button label={t.back} secondary onPress={() => setStep(step - 1)} />
      )}
    </Screen>
  );
}
