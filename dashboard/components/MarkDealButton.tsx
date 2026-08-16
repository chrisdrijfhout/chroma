"use client";
import { useState } from "react";
import { createPortal } from "react-dom";

export default function MarkDealButton({
  videoId,
  creatorHandle,
  videoUrl,
}: {
  videoId: string;
  creatorHandle: string;
  videoUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    artist_name: creatorHandle,
    tiktok_handle: creatorHandle,
    instagram_handle: "",
    email: "",
    status: "In Discussion",
    next_step: "",
    tiktok_views_override: "",
    spotify_monthly_listeners: "",
    discovery_note: "Flagged organically by Chroma — original audio, no paid promotion.",
  });

  useState(() => setMounted(true));

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, video_id: videoId, tiktok_url: videoUrl }),
      });
      if (!res.ok) throw new Error("failed");
      setSaved(true);
      setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
    } catch {
      alert("Failed to save — try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box" as const, padding: "8px 10px", borderRadius: 6,
    border: "1px solid var(--border-light)", background: "var(--card)", color: "var(--text)",
    fontSize: 12, fontFamily: "inherit", marginBottom: 10,
  };
  const labelStyle = { fontSize: 10, color: "var(--text-faint)", marginBottom: 4, display: "block", textTransform: "uppercase" as const, letterSpacing: 0.3 };

  const modal = open && (
    <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(440px, calc(100vw - 32px))", maxHeight: "85vh", overflowY: "auto",
        background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16,
        padding: 22, boxShadow: "0 24px 70px -12px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display), sans-serif" }}>
            Mark as Deal
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: "var(--text-dim)", fontSize: 14 }}>✕</button>
        </div>

        <label style={labelStyle}>Artist Name</label>
        <input style={inputStyle} value={form.artist_name} onChange={(e) => update("artist_name", e.target.value)} />

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>TikTok Handle</label>
            <input style={inputStyle} value={form.tiktok_handle} onChange={(e) => update("tiktok_handle", e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Instagram Handle</label>
            <input style={inputStyle} value={form.instagram_handle} onChange={(e) => update("instagram_handle", e.target.value)} placeholder="@handle" />
          </div>
        </div>

        <label style={labelStyle}>Email</label>
        <input style={inputStyle} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="contact@..." />

        <label style={labelStyle}>Status</label>
        <select style={inputStyle} value={form.status} onChange={(e) => update("status", e.target.value)}>
          <option>In Discussion</option>
          <option>Agreed to Sign — Awaiting Confirmation</option>
          <option>Contract Sent</option>
          <option>Signed</option>
          <option>Passed</option>
        </select>

        <label style={labelStyle}>Next Step</label>
        <input style={inputStyle} value={form.next_step} onChange={(e) => update("next_step", e.target.value)} placeholder="e.g. He'd like a confirmation message before the contract" />

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>TikTok Views (optional override)</label>
            <input style={inputStyle} value={form.tiktok_views_override} onChange={(e) => update("tiktok_views_override", e.target.value)} placeholder="e.g. 40K" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Spotify Monthly Listeners</label>
            <input style={inputStyle} value={form.spotify_monthly_listeners} onChange={(e) => update("spotify_monthly_listeners", e.target.value)} placeholder="e.g. 2.4M" />
          </div>
        </div>

        <label style={labelStyle}>Discovery Note</label>
        <textarea style={{ ...inputStyle, resize: "vertical" as const }} rows={2} value={form.discovery_note} onChange={(e) => update("discovery_note", e.target.value)} />

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, border: "none", marginTop: 6,
            background: saved ? "var(--success)" : "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: "var(--font-display), sans-serif", opacity: saving ? 0.7 : 1,
          }}
        >
          {saved ? "Saved ✓" : saving ? "Saving..." : "Save Deal"}
        </button>
        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 8, textAlign: "center" }}>
          Manage and export this deal anytime from the Deals tab.
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        title="Mark as deal"
        style={{
          position: "absolute", bottom: 8, right: 40, zIndex: 2,
          width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        🤝
      </button>
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
