const pad = (value: number) => String(value).padStart(2, "0");

export const dateKeyFromDate = (value: Date) => `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

export const todayKey = (value = new Date()) => dateKeyFromDate(value);

export const addDays = (value: Date, amount: number) => new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount);

export const isEvening = (value = new Date()) => value.getHours() >= 18;

export const isSunday = (value = new Date()) => value.getDay() === 0;

export const toLocalTimestamp = (value = new Date()) => {
  const offset = -value.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  const hours = pad(Math.floor(absolute / 60));
  const minutes = pad(absolute % 60);

  return `${todayKey(value)}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}${sign}${hours}:${minutes}`;
};

export const formatTimeLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const prettyDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString([], {
  weekday: "short",
  month: "short",
  day: "numeric"
});
