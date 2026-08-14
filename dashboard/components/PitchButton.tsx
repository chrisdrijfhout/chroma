"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const LABEL_NAME = "Tribal Music Group";

function buildPitch(songName: string) {
  const song = songName || "your track";
  // Reworded to read as a genuine first message rather than a templated
  // business pitch — TikTok's spam filters are aggressive toward
  // first-contact messages that read like unsolicited "we'll pay you"
  // offers, since that pattern matches common scam attempts on the
  // platform. This keeps it short, personal, and saves the actual offer
  // details for once a real conversation starts.
  return `Hey! Love "${song}" — it's been doing really well and caught our attention at ${LABEL_NAME}. Are you open to a quick chat about it?`;
}

export default function PitchButton({
  songName,
  caption,
}: {
  songName: string;
  caption: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resolvedName, setResolvedName] = useState(songName);
  const [loadingName, setLoadingName] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setLoadingName(true);
    try {
      const res = await fetch("/api/extract-song-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, fallbackName: songName }),
      });
      const data = await res.json();
      setResolvedName(data.songName || songName);
    } catch {
      setResolvedName(songName);
    } finally {
      setLoadingName(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildPitch(resolvedName));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const modal = open && (
    <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "min(420px, calc(100vw - 32px))",
        background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16,
        padding: 22, boxShadow: "0 24px 70px -12px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display), sans-serif" }}>
            Draft Outreach
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, width: 28, height: 28, cursor: "pointer", color: "var(--text-dim)", fontSize: 14 }}>✕</button>
        </div>

        {loadingName && (
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 8 }}>Checking caption for a track name…</div>
        )}
        {!loadingName && resolvedName !== songName && (
          <div style={{ fontSize: 11, color: "var(--success)", marginBottom: 8 }}>Found a track name in the caption: "{resolvedName}"</div>
        )}

        <textarea
          key={resolvedName}
          defaultValue={buildPitch(resolvedName)}
          rows={5}
          style={{
            width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8,
            border: "1px solid var(--border-light)", background: "var(--card)", color: "var(--text)",
            fontSize: 13, lineHeight: 1.6, fontFamily: "inherit", resize: "vertical", marginBottom: 12,
          }}
        />

        <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 14 }}>
          Kept short on purpose — TikTok's spam filters flag first messages that read like a sales pitch. Save advance/marketing details for once they reply.
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, border: "none",
            background: copied ? "var(--success)" : "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            fontFamily: "var(--font-display), sans-serif",
          }}
        >
          {copied ? "Copied ✓" : "Copy Message"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleOpen}
        title="Draft outreach message"
        style={{
          position: "absolute", bottom: 8, right: 8, zIndex: 2,
          width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        💬
      </button>
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
