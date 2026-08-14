"use client";
import { useState } from "react";

// Change this to whichever label is actually using this deployment —
// same simple pattern as CLIENT_NAME in the nav.
const LABEL_NAME = "Tribal Music Group";

function buildPitch(songName: string) {
  const song = songName || "your track";
  return `Hey! I'm reaching out from ${LABEL_NAME} — we came across "${song}" and it's been doing really well organically. We'd love to release it with you — we'd cover an advance plus handle the marketing to help push it further. Interested in chatting?`;
}

export default function PitchButton({ songName }: { songName: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pitch = buildPitch(songName);

  function handleCopy() {
    navigator.clipboard.writeText(pitch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
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

      {open && (
        <div
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
          />
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "min(400px, calc(100vw - 32px))",
            background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16,
            padding: 20, boxShadow: "0 20px 60px -12px rgba(0,0,0,0.35)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display), sans-serif" }}>
                Draft Outreach
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: "var(--text-dim)", fontSize: 13 }}
              >
                ✕
              </button>
            </div>

            <textarea
              defaultValue={pitch}
              rows={6}
              style={{
                width: "100%", boxSizing: "border-box", padding: 10, borderRadius: 8,
                border: "1px solid var(--border-light)", background: "var(--card)", color: "var(--text)",
                fontSize: 13, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical", marginBottom: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            />

            <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 12 }}>
              Edit if needed, then copy and send it yourself from your own account.
            </div>

            <button
              onClick={handleCopy}
              style={{
                width: "100%", padding: "9px 14px", borderRadius: 8, border: "none",
                background: copied ? "var(--success)" : "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                fontFamily: "var(--font-display), sans-serif",
              }}
            >
              {copied ? "Copied ✓" : "Copy Message"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
