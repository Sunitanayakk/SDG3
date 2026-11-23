import { useEffect, useState } from "react";
import { useSetu } from "../context";
import {
  languages,
  type Language,
  type Preferences,
} from "@setu/api-contracts";
import { api } from "../services";
export function PreferencesForm() {
  const { prefs, save, t, notify } = useSetu();
  const [draft, setDraft] = useState(prefs);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(prefs), [prefs]);
  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setDraft((p) => ({ ...p, [key]: value }));
  return (
    <form
      className="settings-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await save(draft);
          notify("Preferences saved.");
        } catch (e) {
          notify((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {t.name}
        <input
          value={draft.display_name}
          maxLength={80}
          onChange={(e) => set("display_name", e.target.value)}
          autoComplete="nickname"
        />
      </label>
      <div className="form-grid">
        <label>
          {t.language}
          <select
            value={draft.language}
            onChange={(e) => set("language", e.target.value as Language)}
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.textSize}
          <select
            value={draft.text_size}
            onChange={(e) =>
              set("text_size", e.target.value as Preferences["text_size"])
            }
          >
            <option value="normal">Standard</option>
            <option value="large">Large · 112%</option>
            <option value="extra">Extra large · 125%</option>
          </select>
        </label>
      </div>
      {(
        [
          "high_contrast",
          "reduced_motion",
          "text_only",
          "voice",
          "persist_chats",
        ] as const
      ).map((key, i) => (
        <label key={key} className="toggle-row">
          <span>
            {[t.contrast, t.motion, t.textOnly, t.voice, t.history][i]}
            {key === "persist_chats" && (
              <small>
                Off by default. Use only synthetic content in this prototype.
              </small>
            )}
          </span>
          <input
            type="checkbox"
            checked={draft[key]}
            onChange={(e) => set(key, e.target.checked)}
          />
        </label>
      ))}
      <p className="muted">{t.translation}</p>
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : t.save}
      </button>
      <p className="caption">
        {api.mode === "demo"
          ? "Preferences are stored on this device."
          : "Signed-in preferences sync to your account. Guest preferences stay on this device."}
      </p>
    </form>
  );
}
