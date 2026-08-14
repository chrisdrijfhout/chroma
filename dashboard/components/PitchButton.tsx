"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const LABEL_NAME = "Tribal Music Group";

// A handful of pre-written variations, picked at random — no API call,
// no cost, and varied enough that repeated outreach doesn't read as one
// identical copy-pasted template. No song name referenced on purpose —
// the actual video gets shared separately via TikTok's native share
// button, so the track speaks for itself.
const TEMPLATES = [
  `Hey, really liked what I just saw from you — I work with ${LABEL_NAME} and think there could be something real here. Open to a quick chat?`,
  `This caught my attention — I'm with ${LABEL_NAME}, we'd love to talk about properly releasing it with you, advance and marketing included. You around to chat?`,
  `Been scrolling and this stood out. I'm part of ${LABEL_NAME} — genuinely think we could do something good together. Worth a quick conversation?`,
  `Solid track, respect. I work with ${LABEL_NAME} and we'd back a proper release on this — advance plus a real marketing push. Down to talk?`,
  `Not gonna lie, this one's good. I'm with ${LABEL_NAME} — would love to chat about releasing it together if you're open to it.`,
];

function pickTemplate() {
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
}

export default function PitchButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pitchText, setPitchText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPitchText(pickTemplate());
    setOpen(true);
  }

  function handleCopy() {
    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShuffle() {
    setPitchText(pickTemplate());
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

        <textarea
          key={pitchText}
          defaultValue={pitchText}
          rows={5}
          style={{
            width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8,
            border: "1px solid var(--border-light)", background: "var(--card)", color: "var(--text)",
            fontSize: 13, lineHeight: 1.6, fontFamily: "inherit", resize: "vertical", marginBottom: 10,
          }}
        />

        <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 14 }}>
          Share the actual video separately via TikTok's Share button — this is just the message.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleShuffle}
            title="Try a different version"
            style={{
              padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--text-dim)", fontSize: 13, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🔀
          </button>
          <button
            onClick={handleCopy}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8, border: "none",
              background: copied ? "var(--success)" : "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
              color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "var(--font-display), sans-serif",
            }}
          >
            {copied ? "Copied ✓" : "Copy Message"}
          </button>
        </div>
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
