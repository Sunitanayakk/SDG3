import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Loading, Screen } from "../components/ui";
export default function Index() {
  const [done, setDone] = useState<boolean>();
  useEffect(() => {
    AsyncStorage.getItem("setu-onboarding")
      .then((v) => setDone(v === "done"))
      .catch(() => setDone(false));
  }, []);
  return done === undefined ? (
    <Screen>
      <Loading />
    </Screen>
  ) : (
    <Redirect href={done ? "/(tabs)" : "/onboarding"} />
  );
}
