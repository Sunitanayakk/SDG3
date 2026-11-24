import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@setu/design-tokens";
import { useSetu } from "../services/context";
import { api } from "../services/api";
export function T({ children, style, ...props }: TextProps) {
  const { prefs } = useSetu();
  const scale = { normal: 1, large: 1.12, extra: 1.25 }[prefs.text_size];
  return (
    <Text
      {...props}
      style={[
        {
          color: prefs.high_contrast ? "#123b28" : colors.text,
          fontSize: 15 * scale,
          lineHeight: 25 * scale,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Screen({
  children,
  scroll = true,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={s.flex}>{children}</View>
      )}
    </SafeAreaView>
  );
}
export function Heading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <View style={{ marginBottom: 28 }}>
      <T style={s.eyebrow}>{eyebrow}</T>
      <T accessibilityRole="header" style={s.heading}>
        {title}
      </T>
      {body && <T style={s.muted}>{body}</T>}
    </View>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { prefs } = useSetu();
  return (
    <View
      style={[s.card, prefs.high_contrast && { borderColor: "#087f6b" }, style]}
    >
      {children}
    </View>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        danger && { backgroundColor: "#ae3333" },
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <T
        style={{
          color: secondary ? colors.goldLight : "#ffffff",
          fontWeight: "600",
          fontSize: 14,
          flexShrink: 1,
        }}
      >
        {label}
      </T>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={secondary ? colors.goldLight : "#ffffff"}
        />
      )}
    </Pressable>
  );
}
export function Badge() {
  const { t } = useSetu();
  return (
    <View style={s.badge}>
      <View style={s.dot} />
      <T style={s.badgeText}>
        {api.mode === "demo" ? t.demo : "REAL · CONNECTION UNCHECKED"}
      </T>
    </View>
  );
}
export function Notice() {
  const { t } = useSetu();
  return (
    <View style={s.notice}>
      <Ionicons
        name="shield-checkmark-outline"
        size={17}
        color={colors.goldLight}
      />
      <T style={s.noticeText}>{t.safety}</T>
    </View>
  );
}
export function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  const { t } = useSetu();
  return (
    <View accessibilityRole="alert" style={s.error}>
      <T style={{ color: "#9f3c2f" }}>{message}</T>
      <T style={s.muted}>{t.network}</T>
      {onRetry && <Button label={t.retry} onPress={onRetry} secondary />}
    </View>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 35, gap: 15, alignItems: "center" }}>
      <ActivityIndicator color={colors.goldLight} />
      <T style={s.muted}>Loading…</T>
    </View>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 45, gap: 18 },
  eyebrow: {
    fontSize: 10,
    color: colors.goldLight,
    letterSpacing: 2,
    fontWeight: "600",
    marginBottom: 13,
  },
  heading: {
    fontSize: 34,
    lineHeight: 43,
    fontWeight: "500",
    letterSpacing: -1,
    marginBottom: 14,
  },
  muted: { color: "#526a63", fontSize: 13, lineHeight: 23 },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d8e6dd",
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    gap: 15,
  },
  button: {
    backgroundColor: "#087f6b",
    borderRadius: 99,
    minHeight: 51,
    paddingHorizontal: 22,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#b6d4c2",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    borderWidth: 1,
    borderColor: "#cce3d5",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  badgeText: { fontSize: 9, color: colors.goldLight, letterSpacing: 1 },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.goldLight,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingVertical: 14,
  },
  noticeText: { fontSize: 11, lineHeight: 20, color: "#526a63", flex: 1 },
  error: {
    borderWidth: 1,
    borderColor: "#e8b4a9",
    backgroundColor: "#fff2ee",
    borderRadius: 18,
    padding: 20,
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#c5daca",
    backgroundColor: "#f1f7f3",
    borderRadius: 12,
    color: "#183c35",
    padding: 15,
    fontSize: 15,
    minHeight: 49,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 20, fontWeight: "500", lineHeight: 28 },
  link: { color: colors.goldLight, fontSize: 13 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dcece2",
    backgroundColor: "#f1f7f3",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, backgroundColor: "#dbe9e0", marginVertical: 6 },
});
