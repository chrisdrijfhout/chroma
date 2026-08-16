"use client";
import { useState } from "react";

export default function AddDealButton() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    artist_name: "", tiktok_handle: "", instagram_handle: "", email: "",
    status: "In Discussion", next_step: "", tiktok_views_override: "",
    spotify_monthly_listeners: "", tiktok_url: "",
    discovery_note: "Flagged organically by Chroma — original audio, no paid promotion.",
  });

  const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border-light)", background: "var(--card)", color: "var(--text)", fontSize: 12, fontFamily: "inherit", marginBottom: 10 };
  const labelStyle = { fontSize: 10, color: "var(--text-faint)", marginBottom: 4, display: "block", textTransform: "uppercase" as const };

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      alert("Failed to save.");
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "linear-gradient(90deg,var(--spectrum-2),var(--spectrum-3))", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-display),sans-serif", marginBottom: 20 }}>
        + Add Deal Manually
      </button>
    );
  }

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Add Deal Manually</div>
        <button onClick={() => setOpen(false)} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, width: 26, height: 26, cursor: "pointer" }}>✕</button>
      </div>
      <label style={labelStyle}>Artist Name</label>
      <input style={inputStyle} value={form.artist_name} onChange={(e) => setForm({ ...form, artist_name: e.target.value })} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><label style={labelStyle}>TikTok Handle</label><input style={inputStyle} value={form.tiktok_handle} onChange={(e) => setForm({ ...form, tiktok_handle: e.target.value })} /></div>
        <div style={{ flex: 1 }}><label style={labelStyle}>Instagram Handle</label><input style={inputStyle} value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} /></div>
      </div>
      <label style={labelStyle}>TikTok URL</label>
      <input style={inputStyle} value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} placeholder="https://tiktok.com/..." />
      <label style={labelStyle}>Email</label>
      <input style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <label style={labelStyle}>Status</label>
      <select style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option>In Discussion</option><option>Agreed to Sign — Awaiting Confirmation</option>
        <option>Contract Sent</option><option>Signed</option><option>Passed</option>
      </select>
      <label style={labelStyle}>Next Step</label>
      <input style={inputStyle} value={form.next_step} onChange={(e) => setForm({ ...form, next_step: e.target.value })} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}><label style={labelStyle}>TikTok Views</label><input style={inputStyle} value={form.tiktok_views_override} onChange={(e) => setForm({ ...form, tiktok_views_override: e.target.value })} /></div>
        <div style={{ flex: 1 }}><label style={labelStyle}>Spotify Monthly Listeners</label><input style={inputStyle} value={form.spotify_monthly_listeners} onChange={(e) => setForm({ ...form, spotify_monthly_listeners: e.target.value })} /></div>
      </div>
      <button onClick={handleSave} disabled={saving} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "none", background: "linear-gradient(90deg,var(--spectrum-2),var(--spectrum-3))", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-display),sans-serif", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Saving..." : "Save Deal"}
      </button>
    </div>
  );
}
