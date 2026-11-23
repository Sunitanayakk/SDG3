import { useState } from "react";
import { TextInput } from "react-native";
import { router } from "expo-router";
import { api } from "../services/api";
import { useSetu } from "../services/context";
import { Button, Card, ErrorBox, Heading, Screen, s } from "../components/ui";
export default function SignIn() {
  const { reload } = useSetu();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true);
    setError("");
    try {
      await api.login(email, password);
      await reload();
      router.replace("/(tabs)");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        eyebrow="WELCOME TO SWASTHYASETU AI"
        title="A clearer next step."
      />
      <Card>
        {api.mode === "real" && (
          <>
            <TextInput
              accessibilityLabel="Email"
              placeholder="Email"
              placeholderTextColor="#a99f8e"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              style={s.input}
            />
            <TextInput
              accessibilityLabel="Password"
              placeholder="Password"
              placeholderTextColor="#a99f8e"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={s.input}
            />
          </>
        )}
        <Button
          label={
            busy
              ? "Signing in…"
              : api.mode === "demo"
                ? "Continue as demo guest"
                : "Sign in"
          }
          disabled={busy}
          onPress={() => void login()}
        />
        {error && <ErrorBox message={error} />}
      </Card>
    </Screen>
  );
}
