import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StaggerItem } from "../components/mindcheck-ui";
import { api } from "../lib/api";
import { toLocalTimestamp, todayKey } from "../lib/date";
import { storage } from "../lib/storage";
import { useAuth } from "../store/auth";

export const PulsePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mood, setMood] = useState(3);
  const [focus, setFocus] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    const payload = {
      date: todayKey(),
      mood,
      focus,
      createdAtLocal: toLocalTimestamp()
    };

    try {
      if (user) await api.savePulse(payload);
      else storage.saveGuestPulse(payload);
      navigate("/dashboard");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Pulse could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaggerItem className="surface-panel surface-section mx-auto max-w-2xl" delay={0}>
      <p className="eyebrow eyebrow--soft">Quick pulse</p>
      <h1 className="section-title mt-3">A 30-second study check.</h1>
      <p className="body-copy mt-3">This is separate from your full stress score and just helps you spot mood and focus shifts through the day.</p>

      <div className="mt-8 space-y-5">
        <label className="range-row">
          <span className="font-semibold">Mood ({mood}/5)</span>
          <div className="range-shell">
            <span>Low</span>
            <input type="range" min="1" max="5" value={mood} onChange={(event) => setMood(Number(event.target.value))} className="range-input" />
            <span>Bright</span>
          </div>
        </label>
        <label className="range-row">
          <span className="font-semibold">Focus ({focus}/5)</span>
          <div className="range-shell">
            <span>Foggy</span>
            <input type="range" min="1" max="5" value={focus} onChange={(event) => setFocus(Number(event.target.value))} className="range-input" />
            <span>Clear</span>
          </div>
        </label>
      </div>

      {error ? <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>{error}</p> : null}

      <div className="mt-8 flex justify-end">
        <button onClick={submit} disabled={saving} className="button-primary">
          {saving ? "Saving..." : "Save pulse"}
        </button>
      </div>
    </StaggerItem>
  );
};
