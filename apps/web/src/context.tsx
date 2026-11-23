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
import { api } from "./services";

const Context = createContext<{
  prefs: Preferences;
  save: (p: Preferences) => Promise<void>;
  reload: () => Promise<void>;
  t: typeof dictionary.en | typeof dictionary.hi | typeof dictionary.or;
  notify: (s: string) => void;
}>({
  prefs: defaultPreferences,
  save: async () => {},
  reload: async () => {},
  t: dictionary.en,
  notify: () => {},
});
export function Provider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      return {
        ...defaultPreferences,
        ...JSON.parse(localStorage.getItem("setu-prefs") || "{}"),
        ...(api.mode === "real"
          ? { display_name: "Guest", persist_chats: false }
          : {}),
      };
    } catch {
      return defaultPreferences;
    }
  });
  const [notice, setNotice] = useState("");
  const reload = useCallback(async () => {
    if (api.mode === "real" && !sessionStorage.getItem("setu-access-token")) {
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
    reload().catch(() => {});
  }, [reload]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = String(prefs.high_contrast);
    root.dataset.motion = String(prefs.reduced_motion);
    root.dataset.textOnly = String(prefs.text_only);
    root.dataset.size = prefs.text_size;
    root.lang = prefs.language;
    localStorage.setItem("setu-prefs", JSON.stringify(prefs));
  }, [prefs]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  async function save(p: Preferences) {
    if (api.mode === "demo" || sessionStorage.getItem("setu-access-token"))
      await api.savePreferences(p);
    setPrefs(p);
  }
  return (
    <Context.Provider
      value={{
        prefs,
        save,
        reload,
        t: dictionary[prefs.language],
        notify: setNotice,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </Context.Provider>
  );
}
export const useSetu = () => useContext(Context);
