import { useEffect, useRef } from "react";
import { Animated, AppState, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Ellipse, Circle, Path, G } from "react-native-svg";
import type { PandaMood } from "@setu/api-contracts";
import { useSetu } from "../services/context";

/** Compact native rendition of the original Setu panda; no WebGL dependency. */
export function Panda({
  mood = "welcome",
  size = 110,
  paused = false,
}: {
  mood?: PandaMood;
  size?: number;
  paused?: boolean;
}) {
  const { prefs } = useSetu();
  const systemReduced = useReducedMotion();
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation =
      mood === "celebrate"
        ? Animated.sequence([
            Animated.timing(lift, {
              toValue: -7,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(lift, {
              toValue: 0,
              duration: 440,
              useNativeDriver: true,
            }),
          ])
        : Animated.loop(
            Animated.sequence([
              Animated.timing(lift, {
                toValue: -3,
                duration: 1800,
                useNativeDriver: true,
              }),
              Animated.timing(lift, {
                toValue: 0,
                duration: 1800,
                useNativeDriver: true,
              }),
            ]),
          );
    const update = () => {
      animation.stop();
      if (
        !paused &&
        !prefs.text_only &&
        !prefs.reduced_motion &&
        !systemReduced &&
        mood !== "concerned" &&
        AppState.currentState === "active"
      )
        animation.start();
      else lift.setValue(0);
    };
    update();
    const listener = AppState.addEventListener("change", update);
    return () => {
      animation.stop();
      listener.remove();
    };
  }, [
    lift,
    mood,
    paused,
    prefs.text_only,
    prefs.reduced_motion,
    systemReduced,
  ]);
  if (prefs.text_only) return null;
  const wave = mood === "welcome" || mood === "celebrate";
  const tilt = mood === "curious" ? -8 : mood === "thinking" ? 7 : 0;
  const eyeOffset =
    mood === "reading" ? 5 : mood === "thinking" || mood === "curious" ? -4 : 0;
  return (
    <View
      style={{ width: size, height: size * 1.1 }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={{ transform: [{ translateY: lift }] }}>
        <Svg width={size} height={size * 1.1} viewBox="0 0 300 330">
          <Ellipse cx="150" cy="309" rx="79" ry="10" fill="#c8deca" />
          <Ellipse cx="150" cy="238" rx="75" ry="68" fill="#293933" />
          <Ellipse cx="150" cy="244" rx="48" ry="54" fill="#f5f6e9" />
          <Ellipse cx="99" cy="297" rx="34" ry="19" fill="#293933" />
          <Ellipse cx="201" cy="297" rx="34" ry="19" fill="#293933" />
          <G rotation={mood === "celebrate" ? 145 : 0} origin="80,195">
            <Ellipse
              cx="76"
              cy="225"
              rx="21"
              ry="45"
              fill="#293933"
              rotation="20"
              origin="76,225"
            />
          </G>
          <G
            rotation={wave ? -140 : mood === "thinking" ? 130 : 0}
            origin="220,195"
          >
            <Ellipse
              cx="224"
              cy="225"
              rx="21"
              ry="45"
              fill="#293933"
              rotation="-20"
              origin="224,225"
            />
          </G>
          <G rotation={tilt} origin="150,178">
            <Circle cx="82" cy="72" r="31" fill="#293933" />
            <Circle cx="218" cy="72" r="31" fill="#293933" />
            <Circle cx="82" cy="72" r="17" fill="#526459" />
            <Circle cx="218" cy="72" r="17" fill="#526459" />
            <Ellipse cx="150" cy="131" rx="99" ry="85" fill="#fafbed" />
            <Ellipse
              cx="108"
              cy="124"
              rx="26"
              ry="33"
              fill="#293933"
              rotation="20"
              origin="108,124"
            />
            <Ellipse
              cx="192"
              cy="124"
              rx="26"
              ry="33"
              fill="#293933"
              rotation="-20"
              origin="192,124"
            />
            {mood === "resting" ? (
              <Path
                d="M98 126q10 9 20 0M182 126q10 9 20 0"
                stroke="#fafbed"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <G>
                <Ellipse cx="110" cy="123" rx="11" ry="13" fill="white" />
                <Ellipse cx="190" cy="123" rx="11" ry="13" fill="white" />
                <Circle cx="113" cy={124 + eyeOffset} r="7" fill="#152820" />
                <Circle cx="187" cy={124 + eyeOffset} r="7" fill="#152820" />
                <Circle cx="115" cy={120 + eyeOffset} r="2.5" fill="white" />
                <Circle cx="189" cy={120 + eyeOffset} r="2.5" fill="white" />
              </G>
            )}
            <Ellipse cx="150" cy="160" rx="18" ry="12" fill="#293933" />
            <Path
              d={
                mood === "concerned"
                  ? "M131 187q19 -5 38 0"
                  : "M126 179q24 22 48 0"
              }
              fill="none"
              stroke="#293933"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </G>
          <Path d="M101 205q49 20 98 0l-8 24q-41 12-82 0Z" fill="#13896f" />
          <Path d="m172 222 23 34-31-6Z" fill="#08705a" />
          {mood === "thinking" && (
            <Ellipse
              cx="187"
              cy="187"
              rx="17"
              ry="32"
              rotation="-35"
              origin="187,187"
              fill="#293933"
            />
          )}
          {mood === "reading" && (
            <G>
              <Path d="m104 241 46 10 46-10v47l-46 10-46-10Z" fill="#727fa4" />
              <Path d="m111 247 39 9 39-9v35l-39 10-39-10Z" fill="#fffef7" />
            </G>
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
