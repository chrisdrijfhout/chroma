"use client";
import { useState } from "react";

export default function ThemeToggle() {
  // Read the real applied theme immediately on first render — avoids the
  // "shows the wrong icon until you click twice" mismatch, since this no
  // longer starts from a guessed default before checking reality.
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      const current = document.documentElement.getAttribute("data-theme");
      return current === "dark" ? "dark" : "light";
    }
    return "light";
  });

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("chroma-theme", next);
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
