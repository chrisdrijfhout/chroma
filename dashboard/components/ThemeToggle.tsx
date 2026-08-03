"use client";
import { useState } from "react";

export default function ThemeToggle({ initialTheme }: { initialTheme: "dark" | "light" }) {
  const [theme, setTheme] = useState<"dark" | "light">(initialTheme);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `chroma-theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
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
