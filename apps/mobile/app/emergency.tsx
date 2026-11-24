import { Alert } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { emergencyText } from "@setu/api-contracts";
import { useSetu } from "../services/context";
import { Button, Card, Heading, Notice, Screen, T, s } from "../components/ui";
export default function Emergency() {
  const { prefs, t } = useSetu();
  async function dial(number: string) {
    const url = "tel:" + number;
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url);
      else
        Alert.alert(
          "Dialer unavailable",
          "Use a phone to call " + number + ".",
        );
    } catch {
      Alert.alert("Dialer unavailable", "Use a phone to call " + number + ".");
    }
  }
  return (
    <Screen>
      <Button label={t.back} secondary onPress={() => router.back()} />
      <Heading eyebrow="PLEASE SEEK IMMEDIATE HELP" title={t.emergency} />
      <Card style={{ backgroundColor: "#fff2ee", borderColor: "#e8b4a9" }}>
        <T style={{ fontSize: 22, lineHeight: 32, color: "#9f3c2f" }}>
          If you think this is an emergency, seek professional help now.
        </T>
        <T>{emergencyText[prefs.language]}</T>
        <Button
          label={t.call + " 112 · India emergency"}
          danger
          onPress={() => void dial("112")}
        />
        <Button
          label={t.call + " 108 · Odisha ambulance"}
          secondary
          onPress={() => void dial("108")}
        />
        <T style={s.muted}>
          These actions open a phone dialer when supported; they do not
          automatically place a call. 108 applies here to Odisha only. This
          prototype cannot dispatch help.
        </T>
        <Button
          label="Official emergency information"
          secondary
          onPress={() =>
            void Linking.openURL(
              "https://www.mha.gov.in/emergency-response-support-system-erss",
            )
          }
        />
      </Card>
      <Notice />
    </Screen>
  );
}
