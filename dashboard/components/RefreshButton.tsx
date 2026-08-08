"use client";
import { useState, useEffect } from "react";

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours — hard cap on cost

export default function RefreshButton({ lastRunAt }: { lastRunAt: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      if (!lastRunAt) { setRemaining(null); return; }
      const elapsed = Date.now() - new Date(lastRunAt).getTime();
      const left = COOLDOWN_MS - elapsed;
      setRemaining(left > 0 ? left : 0);
    };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [lastRunAt]);

  const onCooldown = remaining !== null && remaining > 0;

  async function handleClick() {
    if (onCooldown || state === "loading") return;
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

  function formatRemaining(ms: number) {
    const totalMins = Math.floor(ms / (60 * 1000));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return mins > 0 ? `${mins}m` : "<1m";
  }

  const label =
    state === "loading" ? "Starting..." :
    state === "done" ? "Started ✓" :
    state === "error" ? "Failed — retry" :
    onCooldown ? `Next refresh in ${formatRemaining(remaining!)}` :
    "Refresh Data";

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading" || onCooldown}
      title={onCooldown ? "Limited to once a day to control cost" : undefined}
      style={{
        fontFamily: "var(--font-display), sans-serif", fontSize: 12, fontWeight: 700,
        color: onCooldown ? "var(--text-faint)" : "#fff",
        background: onCooldown
          ? "var(--card)"
          : state === "error"
          ? "var(--danger)"
          : "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
        border: onCooldown ? "1px solid var(--border)" : "none",
        borderRadius: 7, padding: "7px 16px",
        cursor: onCooldown || state === "loading" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.7 : 1,
        boxShadow: onCooldown ? "none" : "0 2px 10px -2px rgba(139,124,246,0.4)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
