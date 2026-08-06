"use client";
import { useState, useEffect } from "react";

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export default function RefreshButton({ lastRunAt }: { lastRunAt: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [remaining, setRemaining] = useState<number | null>(null);
  // Tracks "I personally triggered this" independent of the server data,
  // so the button locks immediately on click instead of waiting for the
  // pipeline to actually finish and update last_collected_at (which can
  // take a minute or two) before it knows a run is already in progress.
  const [manualTriggerAt, setManualTriggerAt] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const serverTime = lastRunAt ? new Date(lastRunAt).getTime() : 0;
      const effectiveStart = Math.max(serverTime, manualTriggerAt ?? 0);
      if (!effectiveStart) {
        setRemaining(null);
        return;
      }
      const elapsed = Date.now() - effectiveStart;
      const left = COOLDOWN_MS - elapsed;
      setRemaining(left > 0 ? left : 0);
    };
    tick();
    const interval = setInterval(tick, 15_000); // check more often right after a trigger
    return () => clearInterval(interval);
  }, [lastRunAt, manualTriggerAt]);

  const onCooldown = remaining !== null && remaining > 0;

  async function handleClick() {
    if (onCooldown || state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      setManualTriggerAt(Date.now()); // lock the button right now, not later
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
      title={onCooldown ? "A refresh is running or was just triggered — limited to once an hour to control cost" : undefined}
      style={{
        fontFamily: "inherit", fontSize: 12, fontWeight: 600,
        color: onCooldown ? "var(--text-faint)" : "#fff",
        background: onCooldown ? "var(--card)" : state === "error" ? "var(--danger)" : "var(--accent)",
        border: onCooldown ? "1px solid var(--border)" : "none",
        borderRadius: 6, padding: "7px 14px",
        cursor: onCooldown || state === "loading" ? "not-allowed" : "pointer",
        opacity: state === "loading" ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}
