"use client";
import { useState, useEffect } from "react";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour, matches the new hourly cron

export default function RefreshButton({ lastRunAt }: { lastRunAt: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!lastRunAt) return;
    const tick = () => {
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
    if (onCooldown) return;
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
    const mins = Math.floor(ms / (60 * 1000));
    return mins > 0 ? `${mins}m` : "<1m";
  }

  const label =
    state === "loading" ? "Starting..." :
    state === "done" ? "Started ✓" :
    state === "error" ? "Failed — try again" :
    onCooldown ? `Next refresh in ${formatRemaining(remaining!)}` :
    "Refresh Data";

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading" || onCooldown}
      title={onCooldown ? "Scraping is limited to once every hour to control cost" : undefined}
      style={{
        fontFamily: "inherit", fontSize: 12, fontWeight: 600,
        color: onCooldown ? "#54585f" : "#0a0a0a",
        background: onCooldown ? "#1a1c1f" : state === "error" ? "#f87171" : "#5ac8fa",
        border: onCooldown ? "1px solid #2a2d31" : "none",
        borderRadius: 6, padding: "7px 14px",
        cursor: onCooldown || state === "loading" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}
