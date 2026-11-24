import { useEffect, useState } from "react";
import { TextInput } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import type { Resource } from "@setu/api-contracts";
import { useSetu } from "../../services/context";
import { api } from "../../services/api";
import {
  Button,
  Card,
  ErrorBox,
  Heading,
  Loading,
  Notice,
  Screen,
  T,
  s,
} from "../../components/ui";
export default function Resources() {
  const { t } = useSetu();
  const [rows, setRows] = useState<Resource[]>();
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  function load() {
    setError("");
    api
      .resources()
      .then(setRows)
      .catch((e) => setError(e.message));
  }
  useEffect(load, []);
  return (
    <Screen>
      <Heading
        eyebrow="A BRIDGE TO EXISTING SERVICES"
        title={t.resources}
        body="Official portals and clearly marked illustrative examples. No live availability is monitored."
      />
      <Button
        label={t.emergency}
        danger
        onPress={() => router.push("/emergency")}
      />
      <TextInput
        accessibilityLabel="Search resources"
        placeholder="Search healthcare services…"
        placeholderTextColor="#526a63"
        value={q}
        onChangeText={setQ}
        style={s.input}
      />
      {error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : (
        rows
          .filter((r) =>
            (r.name + " " + r.description)
              .toLowerCase()
              .includes(q.toLowerCase()),
          )
          .map((r) => (
            <Card key={r.id}>
              <T style={s.eyebrow}>
                {r.verified ? "OFFICIAL SERVICE" : "ILLUSTRATIVE EXAMPLE"} ·{" "}
                {r.type}
              </T>
              <T accessibilityRole="header" style={s.title}>
                {r.name}
              </T>
              <T>{r.description}</T>
              <T style={s.muted}>{r.notes}</T>
              <Button
                label={
                  r.verified
                    ? "Open official portal"
                    : "Related official information"
                }
                secondary
                icon="open-outline"
                onPress={() =>
                  void Linking.openURL(r.url).catch((e) => setError(e.message))
                }
              />
              {r.phone && (
                <Button
                  label={
                    t.call +
                    " " +
                    r.phone +
                    (r.phone === "108" ? " · Odisha" : " · India")
                  }
                  secondary
                  onPress={() => router.push("/emergency")}
                />
              )}
            </Card>
          ))
      )}
      {rows &&
        !rows.some((r) =>
          (r.name + " " + r.description)
            .toLowerCase()
            .includes(q.toLowerCase()),
        ) && <T style={s.muted}>No matching services.</T>}
      <Notice />
    </Screen>
  );
}
