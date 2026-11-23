import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  defaultPreferences,
  dictionary,
  type Preferences,
} from "@setu/api-contracts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, tokenStorage } from "./api";
const Context = createContext<{
  prefs: Preferences;
  ready: boolean;
  save: (p: Preferences) => Promise<void>;
  reload: () => Promise<void>;
  t: typeof dictionary.en | typeof dictionary.hi | typeof dictionary.or;
}>({
  prefs: defaultPreferences,
  ready: false,
  save: async () => {},
  reload: async () => {},
  t: dictionary.en,
});
export function SetuProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences);
  const [ready, setReady] = useState(false);
  const reload = useCallback(async () => {
    if (
      api.mode === "real" &&
      !(await tokenStorage.getItem("setu-access-token"))
    ) {
      setPrefs((current) => ({
        ...current,
        display_name: "Guest",
        persist_chats: false,
      }));
      return;
    }
    setPrefs(await api.preferences());
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const local = await AsyncStorage.getItem("setu-prefs");
        if (local)
          setPrefs({
            ...defaultPreferences,
            ...JSON.parse(local),
            ...(api.mode === "real"
              ? { display_name: "Guest", persist_chats: false }
              : {}),
          });
        try {
          await reload();
        } catch {
          /* Guest preferences stay local until sign-in. */
        }
      } finally {
        setReady(true);
      }
    })();
  }, [reload]);
  async function save(value: Preferences) {
    if (
      api.mode === "demo" ||
      (await tokenStorage.getItem("setu-access-token"))
    )
      await api.savePreferences(value);
    await AsyncStorage.setItem("setu-prefs", JSON.stringify(value));
    setPrefs(value);
  }
  return (
    <Context.Provider
      value={{ prefs, ready, save, reload, t: dictionary[prefs.language] }}
    >
      {children}
    </Context.Provider>
  );
}
export const useSetu = () => useContext(Context);
