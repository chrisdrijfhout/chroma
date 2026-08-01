"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
    if (current) setTheme(current);
  }, []);

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
