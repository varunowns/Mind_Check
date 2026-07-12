import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { DashboardSummary, UserProfileUpdate, UserSettingsUpdate } from "@pebble/shared";
import { BadgeCard, FlameIcon, MetricCard, StaggerItem, TipCard } from "../components/mindcheck-ui";
import { FormField, FormSection } from "../components/FormComponents";
import { api } from "../lib/api";
import { getInitials, notificationPreferenceKey } from "../lib/design-system";
import { getGuestDashboardSummary } from "../lib/guest";
import { guestSettingsDefaults, storage } from "../lib/storage";
import { useAuth } from "../store/auth";

const emptySummary: DashboardSummary = {
  streakCount: 0,
  averageThisWeek: 0,
  averageLastWeek: 0,
  trend: [],
  heatmap: [],
  badges: [],
  upcomingEvents: [],
  preExamStressPatterns: [],
  meetingsCorrelation: [],
  sleepDebt: {
    currentDebtHours: 0,
    severity: "safe",
    trend: []
  },
  boundary: {
    score: 0,
    label: "Healthy",
    lateCheckIns: 0,
    totalCheckIns: 0,
    threshold: guestSettingsDefaults.lateThreshold
  },
  burnout: {
    active: false,
    avgScore: 0,
    daysCount: 0,
    history: []
  },
  shield: {
    available: false,
    history: []
  },
  weeklyReflectionPending: false,
  weeklyReflectionPrompt: "",
  todayCheckIns: [],
  todayPulse: [],
  activeEvent: null
};

export const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const initialSettings = user
    ? {
      checkinMode: user.checkinMode,
      recommendedSleepHours: user.recommendedSleepHours,
      lateThreshold: user.lateThreshold
    }
    : storage.getGuestSettings();
  const initialProfile: UserProfileUpdate | null = user ? {
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    region: user.region,
    city: user.city
  } : null;

  const [summary, setSummary] = useState<DashboardSummary>(() => user ? emptySummary : getGuestDashboardSummary());
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem(notificationPreferenceKey) !== "false");
  const [settingsForm, setSettingsForm] = useState<UserSettingsUpdate>(initialSettings);
  const [profileForm, setProfileForm] = useState<UserProfileUpdate | null>(initialProfile);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!user) {
      setSummary(getGuestDashboardSummary());
      return;
    }

    if (typeof api.getDashboardSummary !== "function") {
      return;
    }

    api.getDashboardSummary().then((response) => setSummary(response.summary));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setSettingsForm({
      checkinMode: user.checkinMode,
      recommendedSleepHours: user.recommendedSleepHours,
      lateThreshold: user.lateThreshold
    });
    setProfileForm({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      region: user.region,
      city: user.city
    });
  }, [
    user?.id,
    user?.checkinMode,
    user?.recommendedSleepHours,
    user?.lateThreshold,
    user?.name,
    user?.email,
    user?.phoneNumber,
    user?.region,
    user?.city
  ]);

  const saveProfile = async () => {
    if (!user || !profileForm) return;
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await api.saveProfile(profileForm);
      updateUser(response.user);
      setProfileForm({
        name: response.user.name,
        email: response.user.email,
        phoneNumber: response.user.phoneNumber,
        region: response.user.region,
        city: response.user.city
      });
      setProfileMessage("Profile saved.");
    } catch (nextError) {
      setProfileError(nextError instanceof Error ? nextError.message : "Profile could not be saved.");
    } finally {
      setProfileSaving(false);
    }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsMessage("");

    try {
      if (user) {
        const response = await api.saveSettings(settingsForm);
        updateUser(response.user);
      } else {
        storage.saveGuestSettings(settingsForm);
      }
      setSettingsMessage("Settings saved.");
    } catch (nextError) {
      setSettingsError(nextError instanceof Error ? nextError.message : "Settings could not be saved.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const toggleNotifications = async () => {
    const nextValue = !notificationsEnabled;
    setSettingsError("");

    if (nextValue && typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (nextValue && typeof Notification !== "undefined" && Notification.permission === "denied") {
      setSettingsError("Browser notifications are blocked. You can enable them from your browser settings.");
      return;
    }

    setNotificationsEnabled(nextValue);
    localStorage.setItem(notificationPreferenceKey, String(nextValue));
  };

  return (
    <div className="page-stack">
      <section className="hero-split">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <p className="eyebrow eyebrow--soft">Profile & badges</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-primary)] text-2xl font-semibold text-[var(--bg-base)]">
              {getInitials(user?.name ?? profileForm?.name)}
            </div>
            <div>
              <h1 className="headline">{user?.name ?? "Guest profile"}</h1>
              <p className="body-copy mt-3 max-w-xl">Keep your identity, streaks, badges, and quiet preferences in one calm place.</p>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={150}>
          <MetricCard
            label="Current streak"
            value={`${summary.streakCount} days`}
            detail={summary.shield.available ? "A streak shield is available right now." : "Keep checking in to grow your rhythm."}
            accent={<span className="metric-accent inline-flex h-5 w-5 text-[var(--accent-secondary)]"><FlameIcon /></span>}
          />
          <div className="mt-4">
            <TipCard title="Notifications" copy="Toggle gentle reminders for evenings when a quick check-in could help." />
          </div>
          <div className="toggle-row mt-4">
            <div>
              <p className="font-semibold">Evening reminder</p>
              <p className="body-copy text-sm">Stored locally on this device.</p>
            </div>
            <button type="button" className="notification-switch" data-checked={notificationsEnabled} onClick={toggleNotifications}>
              <span className="notification-switch__thumb" />
            </button>
          </div>
        </StaggerItem>
      </section>

      <section className="surface-card surface-section">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow eyebrow--soft">Badge grid</p>
            <h2 className="section-title mt-3">Collected milestones</h2>
          </div>
          <Link to="/dashboard" className="button-secondary">Back to dashboard</Link>
        </div>
        <div className="badge-grid mt-6">
          {summary.badges.length ? summary.badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          )) : (
            <TipCard title="Badges will appear here" copy="They unlock as you build a steadier check-in rhythm." />
          )}
        </div>
      </section>

      <section className="content-split">
        <StaggerItem className="surface-card surface-section" delay={300}>
          <p className="eyebrow eyebrow--soft">Profile</p>
          <h2 className="section-title mt-3">Your details</h2>
          {user && profileForm ? (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Full name
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((current) => current ? { ...current, name: event.target.value } : current)}
                    className="input-field mt-3"
                    placeholder="Your name"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Email address
                  <input
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => current ? { ...current, email: event.target.value } : current)}
                    className="input-field mt-3"
                    placeholder="name@example.com"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Mobile number
                  <input
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={(event) => setProfileForm((current: UserProfileUpdate | null) => current ? { ...current, phoneNumber: event.target.value } : current)}
                    className="input-field mt-3"
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Region / state
                  <input
                    type="text"
                    value={profileForm.region}
                    onChange={(event) => setProfileForm((current: UserProfileUpdate | null) => current ? { ...current, region: event.target.value } : current)}
                    className="input-field mt-3"
                    placeholder="Region or state"
                  />
                </label>
                <label className="block text-sm font-semibold md:col-span-2">
                  City / place
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(event) => setProfileForm((current: UserProfileUpdate | null) => current ? { ...current, city: event.target.value } : current)}
                    className="input-field mt-3"
                    placeholder="City, town, or place you live"
                  />
                </label>
              </div>

              {profileMessage ? <p className="mt-4 text-sm" style={{ color: "var(--success)" }}>{profileMessage}</p> : null}
              {profileError ? <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>{profileError}</p> : null}

              <div className="mt-8 flex justify-end">
                <button onClick={saveProfile} disabled={profileSaving} className="button-primary">
                  {profileSaving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6">
              <TipCard title="Log in for a fuller profile" copy="Add your email, mobile number, region, and city when you want your account to travel with you." />
            </div>
          )}
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={450}>
          <p className="eyebrow eyebrow--soft">Preferences</p>
          <h2 className="section-title mt-3">Shape the check-ins around your life</h2>
          <div className="mt-8 grid gap-6">
            <section className="space-y-3">
              <p className="text-sm font-semibold">Check-in mode</p>
              <div className="inline-option-grid">
                {[
                  { value: "once", label: "Once daily", detail: "One full check-in with a full session." },
                  { value: "thrice", label: "Three times daily", detail: "Morning, afternoon, and evening session slots." }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSettingsForm((current: UserSettingsUpdate) => ({ ...current, checkinMode: option.value as UserSettingsUpdate["checkinMode"] }))}
                    className="preference-card"
                    data-active={settingsForm.checkinMode === option.value}
                  >
                    <p className="font-semibold">{option.label}</p>
                    <p className="body-copy mt-2 text-sm">{option.detail}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <label className="range-row">
                <span className="font-semibold">Recommended sleep target</span>
                <div className="range-shell">
                  <span>4h</span>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={settingsForm.recommendedSleepHours}
                    onChange={(event) => setSettingsForm((current: UserSettingsUpdate) => ({ ...current, recommendedSleepHours: Number(event.target.value) }))}
                    className="range-input"
                  />
                  <span>{settingsForm.recommendedSleepHours}h</span>
                </div>
              </label>
            </section>

            <section className="space-y-3">
              <label className="block text-sm font-semibold">
                Late check-in threshold
                <input
                  type="time"
                  value={settingsForm.lateThreshold}
                  onChange={(event) => setSettingsForm((current: UserSettingsUpdate) => ({ ...current, lateThreshold: event.target.value || guestSettingsDefaults.lateThreshold }))}
                  className="input-field mt-3"
                />
              </label>
              <p className="body-copy text-sm">Boundary score uses this threshold to detect repeated late-night check-ins.</p>
            </section>
          </div>

          {settingsMessage ? <p className="mt-4 text-sm" style={{ color: "var(--success)" }}>{settingsMessage}</p> : null}
          {settingsError ? <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>{settingsError}</p> : null}

          <div className="mt-8 flex justify-end">
            <button onClick={saveSettings} disabled={settingsSaving} className="button-primary">
              {settingsSaving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </StaggerItem>
      </section>
    </div>
  );
};
