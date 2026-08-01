"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      const current = document.documentElement.getAttribute("data-theme");
      return current === "dark" ? "dark" : "light";
    }
    return "light";
  });

  // Backup sync: re-check the real attribute after mount, in case
  // anything changed it between the lazy initializer and this point,
  // and keep it in sync if another tab changes the theme too.
  useEffect(() => {
    const syncFromDom = () => {
      const current = document.documentElement.getAttribute("data-theme");
      setTheme(current === "dark" ? "dark" : "light");
    };
    syncFromDom();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "chroma-theme") syncFromDom();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("chroma-theme", next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      title="Toggle light/dark mode"
      style={{
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6,
        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 14, color: "var(--text-dim)",
      }}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
