import { useEffect, useState } from "react";
import { storage } from "../lib/storage";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const storedTheme = storage.getTheme();
    if (storedTheme) return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    storage.setTheme(theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark")
  };
};
