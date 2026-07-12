import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ReminderCard } from "./components/ReminderCard";
import { AuthPage } from "./pages/AuthPage";
import { BreathePage } from "./pages/BreathePage";
import { CheckInPage } from "./pages/CheckInPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InsightsPage } from "./pages/InsightsPage";
import { JournalPage } from "./pages/JournalPage";
import { LandingPage } from "./pages/LandingPage";
import { PulsePage } from "./pages/PulsePage";
import { ReflectionsPage } from "./pages/ReflectionsPage";
import { ResultsPage } from "./pages/ResultsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { isEvening, todayKey } from "./lib/date";
import { storage } from "./lib/storage";

export const App = () => {
  const [reminderVisible, setReminderVisible] = useState(false);

  useEffect(() => {
    const date = todayKey();
    const alreadySent = storage.getReminderSent() === date;
    const hasCheckIn = storage.getGuestCheckIns().some((item) => item.date === date);
    if (isEvening() && !alreadySent && !hasCheckIn) {
      setReminderVisible(true);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pebble", { body: "A two-minute check-in could help tonight feel lighter." });
        storage.markReminderSent(date);
      } else if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Pebble", { body: "A two-minute check-in could help tonight feel lighter." });
          }
          storage.markReminderSent(date);
        });
      }
    }
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<><ReminderCard visible={reminderVisible} /><LandingPage /></>} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/pulse" element={<PulsePage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/reflections" element={<ReflectionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/breathe" element={<BreathePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
