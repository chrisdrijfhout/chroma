"use client";
import { useState } from "react";
import RefreshButton from "./RefreshButton";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
];

const CLIENT_NAME = "Tribal Music Group";

export default function NavClient({
  lastCollectedText,
  theme,
  lastRunAt,
  insightSummary,
  insightPeriod,
}: {
  lastCollectedText: string;
  theme: "dark" | "light";
  lastRunAt: string | null;
  insightSummary: string | null;
  insightPeriod: string | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);

  return (
    <>
      <nav style={{
        display: "flex", alignItems: "center", gap: 4, padding: "14px 16px",
        borderBottom: "1px solid var(--border)", background: "var(--bg)",
        position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(8px)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 12, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0,
            boxShadow: "0 0 16px rgba(139,124,246,0.25)",
          }}>
            C
          </div>
          <div className="nav-brand-text" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, letterSpacing: 0.5, fontSize: 15,
              background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              CHROMA
            </span>
            <span style={{ fontSize: 10, color: "var(--text-faint)" }}>× {CLIENT_NAME}</span>
          </div>
        </a>

        <div className="nav-last-collected" style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-dim)",
          borderLeft: "1px solid var(--border)", paddingLeft: 16, marginRight: 24, whiteSpace: "nowrap",
        }}>
          <span style={{ color: "var(--text-faint)" }}>Last collection:</span>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{lastCollectedText}</span>
        </div>

        <div className="nav-links-desktop" style={{ display: "flex", gap: 4 }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link" style={{
              color: "var(--text-dim)", textDecoration: "none", fontSize: 13,
              padding: "7px 14px", borderRadius: 6, fontWeight: 500, whiteSpace: "nowrap",
            }}>
              {l.label}
            </a>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setInsightOpen(true)}
            className="ai-insight-btn"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
              color: "#fff", border: "none", borderRadius: 6,
              padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            ✨ <span className="ai-insight-btn-text">AI Brief</span>
          </button>
          <div className="nav-refresh-desktop">
            <RefreshButton lastRunAt={lastRunAt} />
          </div>
          <ThemeToggle initialTheme={theme} />
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: "none", background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 6, width: 30, height: 30, alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 16, color: "var(--text)", flexShrink: 0,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="nav-mobile-menu" style={{
          display: "none", flexDirection: "column", padding: "12px 16px",
          borderBottom: "1px solid var(--border)", background: "var(--bg)",
          position: "sticky", top: 58, zIndex: 19, gap: 4,
        }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} style={{
              color: "var(--text)", textDecoration: "none", fontSize: 14,
              padding: "10px 12px", borderRadius: 6, fontWeight: 500, background: "var(--card)",
            }}>
              {l.label}
            </a>
          ))}
          <div style={{ padding: "10px 12px" }}>
            <RefreshButton lastRunAt={lastRunAt} />
          </div>
        </div>
      )}

      {insightOpen && (
        <>
          <div
            onClick={() => setInsightOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 30,
              animation: "fadeIn 0.15s ease",
            }}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)",
            background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)",
            zIndex: 31, padding: 24, overflowY: "auto",
            animation: "slideIn 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <h2 style={{ fontSize: 16, margin: 0, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>AI Weekly Brief</h2>
              </div>
              <button
                onClick={() => setInsightOpen(false)}
                style={{
                  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6,
                  width: 28, height: 28, cursor: "pointer", color: "var(--text-dim)", fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>

            {insightSummary ? (
              <>
                <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 16 }}>{insightPeriod}</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap" }}>
                  {insightSummary}
                </div>
              </>
            ) : (
              <div style={{
                background: "var(--card)", border: "1px dashed var(--border-light)", borderRadius: 12,
                padding: 32, textAlign: "center", color: "var(--text-faint)",
              }}>
                <div style={{ fontSize: 13, marginBottom: 6 }}>No brief generated yet</div>
                <div style={{ fontSize: 12 }}>Runs automatically once a week, once there&apos;s enough trend history to summarize.</div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
