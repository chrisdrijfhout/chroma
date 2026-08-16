"use client";
import { useState } from "react";

export default function DealStatusSelect({ dealId, initialStatus }: { dealId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    try {
      await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dealId, status: newStatus }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        fontSize: 10, fontWeight: 700, color: "#fff",
        background: status === "Signed" ? "var(--success)" : status === "Passed" ? "var(--danger)" : "var(--accent)",
        border: "none", borderRadius: 12, padding: "4px 8px", cursor: "pointer",
      }}
    >
      <option>In Discussion</option>
      <option>Agreed to Sign — Awaiting Confirmation</option>
      <option>Contract Sent</option>
      <option>Signed</option>
      <option>Passed</option>
    </select>
  );
}
