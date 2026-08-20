"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const THEME_STORAGE_KEY = "jc-theme";

// Kept in sync with the pre-paint script inlined in app/layout.js. If the
// logic here changes, change it there too or the first frame will disagree
// with the hydrated app.
const MEDIA = "(prefers-color-scheme: dark)";

function systemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MEDIA).matches;
}

function applyTheme(theme) {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  // Always start at "system" so the server and client render the same markup.
  // The real value is read from localStorage in the effect below; the inline
  // script has already painted the correct colors by then.
  const [theme, setThemeState] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("light");

  // <body> is shared with the marketing pages, which stay light. Tagging it
  // only while a themed shell is mounted lets the dashboard own the page
  // background (visible on overscroll) without touching those pages.
  useEffect(() => {
    document.body.classList.add("themed");
    return () => document.body.classList.remove("themed");
  }, []);

  useEffect(() => {
    let stored = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Storage can be unavailable (private mode, blocked cookies). Fall
      // back to following the system preference.
    }
    const initial =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
    setThemeState(initial);
    applyTheme(initial);
    setResolvedTheme(
      initial === "system" ? (systemPrefersDark() ? "dark" : "light") : initial,
    );
  }, []);

  // Keep "system" live when the OS appearance changes mid-session.
  useEffect(() => {
    if (theme !== "system") return undefined;
    const mq = window.matchMedia(MEDIA);
    const onChange = () => {
      applyTheme("system");
      setResolvedTheme(mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    applyTheme(next);
    setResolvedTheme(
      next === "system" ? (systemPrefersDark() ? "dark" : "light") : next,
    );
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Preference just won't persist across reloads.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
