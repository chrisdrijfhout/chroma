"use client";
import { useState } from "react";

export default function RefreshButton({ lastRunAt }: { lastRunAt: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      setState("done");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const label =
    state === "loading" ? "Starting..." :
    state === "done" ? "Started ✓" :
    state === "error" ? "Failed — retry" :
    "Refresh Data";

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      style={{
        fontFamily: "var(--font-display), sans-serif", fontSize: 12, fontWeight: 700,
        color: "#fff",
        background: state === "error" ? "var(--danger)" : "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
        border: "none",
        borderRadius: 7, padding: "7px 16px",
        cursor: state === "loading" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.7 : 1,
        boxShadow: "0 2px 10px -2px rgba(139,124,246,0.4)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
