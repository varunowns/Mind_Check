import { FormEvent, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { EmptyState, StaggerItem, TipCard } from "../components/mindcheck-ui";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import { useAuth } from "../store/auth";

export const AuthPage = ({ mode }: { mode: "login" | "signup" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = mode === "signup"
        ? await api.signup(form)
        : await api.login({ email: form.email, password: form.password });

      setSession(response.token, response.user);
      const payload = storage.getSyncPayload();
      if (payload.checkIns.length || payload.journals.length || payload.pulses.length || payload.events.length) {
        await api.syncLocalData(payload);
        storage.clearGuestData();
      }
      navigate((location.state as { from?: string } | null)?.from ?? "/dashboard");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-split">
      <StaggerItem className="surface-panel surface-section" delay={0}>
        <p className="eyebrow eyebrow--soft">{mode === "signup" ? "Create your space" : "Welcome back"}</p>
        <h1 className="headline mt-4">{mode === "signup" ? "Start your calm corner." : "Pick up where you left off."}</h1>
        <p className="body-copy mt-5 max-w-xl">
          Your check-ins, reflections, and gentle patterns stay in one place so the app can feel supportive, not noisy.
        </p>
        <div className="mt-6 grid gap-3">
          <TipCard title="Private by default" copy="Guest entries stay on this device until you choose to create an account." />
          <EmptyState
            title="Simple, steady, human"
            copy="No pressure to optimize every day. We only help you notice what changed and what soothed it."
          />
        </div>
      </StaggerItem>

      <StaggerItem className="surface-card surface-section" delay={150}>
        <p className="eyebrow eyebrow--soft">{mode === "signup" ? "Account" : "Sign in"}</p>
        <h2 className="section-title mt-3">{mode === "signup" ? "Create your account" : "Log in to MindCheck"}</h2>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {mode === "signup" ? (
            <input
              className="input-field"
              placeholder="Your name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          ) : null}
          <input
            className="input-field"
            placeholder="Email"
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <input
            className="input-field"
            placeholder="Password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          {error ? <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p> : null}
          <button disabled={loading} className="button-primary w-full">
            {loading ? "Saving..." : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
          <Link to={mode === "signup" ? "/login" : "/signup"} className="font-semibold underline">
            {mode === "signup" ? "Log in" : "Sign up"}
          </Link>
        </p>
      </StaggerItem>
    </div>
  );
};
