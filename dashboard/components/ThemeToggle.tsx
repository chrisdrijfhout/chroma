"use client";
import { useState, useEffect } from "react";

function readThemeCookie(): "dark" | "light" {
  if (typeof document === "undefined") return "light";
  const match = document.cookie.match(/(?:^|; )chroma-theme=([^;]*)/);
  return match && decodeURIComponent(match[1]) === "dark" ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => readThemeCookie());

  useEffect(() => {
    setTheme(readThemeCookie());
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    // 1 year expiry, available on every path — cookies aren't subject to
    // the same Safari storage restrictions localStorage runs into on
    // shared hosting domains like vercel.app.
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
