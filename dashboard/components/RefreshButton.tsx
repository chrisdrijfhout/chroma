"use client";
import { useState } from "react";

export default function RefreshButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
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
    state === "error" ? "Failed — try again" :
    "Refresh Data";

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      style={{
        fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: "#0a0a0a",
        background: state === "error" ? "#f87171" : "#5ac8fa",
        border: "none", borderRadius: 6, padding: "7px 14px", cursor: "pointer",
        opacity: state === "loading" ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}
