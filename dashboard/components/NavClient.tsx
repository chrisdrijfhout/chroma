"use client";
import { useState } from "react";
import Link from "next/link";
import RefreshButton from "./RefreshButton";
import ThemeToggle from "./ThemeToggle";

const CLIENT_NAME = "Tribal Music Group";

const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
  { href: "/catalog", label: "Label Catalog" },
];

type InsightData = {
  headline: string;
  fastest_moving: string;
  producers: { creator: string; note: string }[];
  spreading_sounds: { sound: string; note: string }[];
  recommendation: string;
  week_comparison?: string;
  standout_day?: string;
};

function parseInsight(raw: string | null): InsightData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return {
      headline: "",
      fastest_moving: raw,
      producers: [],
      spreading_sounds: [],
      recommendation: "",
    };
  }
}

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

  const insight = parseInsight(insightSummary);

  return (
    <>
      <nav style={{
        display: "flex", alignItems: "center", gap: 4, padding: "14px 16px",
        borderBottom: "1px solid var(--border)", background: "var(--bg)",
        position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(8px)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 12, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display), sans-serif",
            fontWeight: 800, fontSize: 15, color: "#fff", flexShrink: 0,
            boxShadow: "0 0 16px rgba(139,124,246,0.25)",
          }}>
            C
          </div>
          <div className="nav-brand-text" style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{
              fontFamily: "var(--font-display), sans-serif",
              fontWeight: 700, letterSpacing: 0.5, fontSize: 15,
              background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              CHROMA
            </span>
          </div>
        </Link>

        <div className="nav-last-collected" style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-dim)",
          borderLeft: "1px solid var(--border)", paddingLeft: 16, marginRight: 24, whiteSpace: "nowrap",
        }}>
          <span style={{ color: "var(--text-faint)" }}>Last collection:</span>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{lastCollectedText}</span>
        </div>

        <div className="nav-links-desktop" style={{ display: "flex", gap: 4 }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" style={{
              color: "var(--text-dim)", textDecoration: "none", fontSize: 13,
              padding: "7px 14px", borderRadius: 6, fontWeight: 500, whiteSpace: "nowrap",
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span className="nav-client-badge" style={{
            fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap",
            padding: "4px 10px", borderRadius: 12, border: "1px solid var(--border)",
          }}>
            {CLIENT_NAME}
          </span>
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
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{
              color: "var(--text)", textDecoration: "none", fontSize: 14,
              padding: "10px 12px", borderRadius: 6, fontWeight: 500, background: "var(--card)",
            }}>
              {l.label}
            </Link>
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
            position: "fixed", top: 0, right: 0, bottom: 0, width: "min(440px, 100vw)",
            background: "var(--bg-elevated)", borderLeft: "1px solid var(--border)",
            zIndex: 31, overflowY: "auto",
            animation: "slideIn 0.25s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{
              position: "sticky", top: 0, background: "var(--bg-elevated)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "20px 24px 16px", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <h2 style={{ fontSize: 15, margin: 0, fontFamily: "var(--font-display), sans-serif", color: "var(--text)" }}>AI Weekly Brief</h2>
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

            <div style={{ padding: "20px 24px 32px" }}>
              {insight && insight.fastest_moving ? (
                <>
                  {insightPeriod && (
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 16 }}>{insightPeriod}</div>
                  )}

                  {insight.headline && (
                    <div style={{
                      fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 12,
                      fontFamily: "var(--font-display), sans-serif", lineHeight: 1.4,
                      paddingLeft: 12, borderLeft: "3px solid var(--accent)",
                    }}>
                      {insight.headline}
                    </div>
                  )}

                  {(insight.week_comparison || insight.standout_day) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                      {insight.week_comparison && (
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12,
                          color: "var(--text-dim)", background: "var(--card)",
                          border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px",
                        }}>
                          <span style={{ flexShrink: 0 }}>📊</span>
                          <span>{insight.week_comparison}</span>
                        </div>
                      )}
                      {insight.standout_day && (
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12,
                          color: "var(--text-dim)", background: "var(--card)",
                          border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px",
                        }}>
                          <span style={{ flexShrink: 0 }}>📅</span>
                          <span>{insight.standout_day}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--spectrum-2)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                      Fastest Moving
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-dim)" }}>
                      {insight.fastest_moving}
                    </div>
                  </div>

                  {insight.producers?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--spectrum-2)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                        Producers Worth A Listen
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {insight.producers.map((p, i) => (
                          <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>@{p.creator}</div>
                            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>{p.note}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.spreading_sounds?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--spectrum-2)", letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                        Sounds Gaining Spread
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {insight.spreading_sounds.map((s, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, padding: "8px 0", borderBottom: i < insight.spreading_sounds.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <span style={{ color: "var(--text)", fontWeight: 600 }}>{s.sound}</span>
                            <span style={{ color: "var(--text-dim)", textAlign: "right" }}>{s.note}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insight.recommendation && (
                    <div style={{
                      background: "linear-gradient(135deg, rgba(139,124,246,0.1), rgba(108,92,231,0.05))",
                      border: "1px solid var(--border-light)", borderRadius: 10, padding: 14,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>
                        Recommendation
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)", fontWeight: 500 }}>
                        {insight.recommendation}
                      </div>
                    </div>
                  )}
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
          </div>
        </>
      )}
    </>
  );
}
