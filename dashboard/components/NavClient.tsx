"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import RefreshButton from "./RefreshButton";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/videos", label: "Trending Videos" },
  { href: "/creators", label: "Creators" },
  { href: "/sounds", label: "Sounds" },
  { href: "/deals", label: "Deals" },
];
const CLIENT_NAME = "Tribal Music Group";

type InsightData = {
  headline: string; fastest_moving: string;
  producers: { creator: string; note: string }[];
  spreading_sounds: { sound: string; note: string }[];
  recommendation: string; week_comparison?: string; standout_day?: string;
};
function parseInsight(raw: string | null): InsightData | null {
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return { headline: "", fastest_moving: raw, producers: [], spreading_sounds: [], recommendation: "" }; }
}

export default function NavClient({
  lastCollectedText, theme, lastRunAt, insightSummary, insightPeriod,
}: {
  lastCollectedText: string; theme: "dark" | "light"; lastRunAt: string | null;
  insightSummary: string | null; insightPeriod: string | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [insightOpen, setInsightOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useState(() => setMounted(true));
  const insight = parseInsight(insightSummary);

  const insightModal = insightOpen && (
    <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div onClick={() => setInsightOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(440px,calc(100vw - 32px))", maxHeight: "80vh", overflowY: "auto", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 24px 70px -12px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,var(--spectrum-1),var(--spectrum-2),var(--spectrum-3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎧</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display),sans-serif" }}>A&R Assistant</div>
              <div style={{ fontSize: 10, color: "var(--text-faint)" }}>Chroma's read on this week's scene</div>
            </div>
          </div>
          <button onClick={() => setInsightOpen(false)} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, width: 28, height: 28, cursor: "pointer" }}>✕</button>
        </div>
        {insight?.fastest_moving ? (
          <>
            {insightPeriod && <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 10 }}>{insightPeriod}</div>}
            {insight.headline && <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, paddingLeft: 10, borderLeft: "3px solid var(--accent)" }}>{insight.headline}</div>}
            <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 14 }}>{insight.fastest_moving}</div>
            {insight.producers?.map((p, i) => (
              <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>@{p.creator}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{p.note}</div>
              </div>
            ))}
            {insight.recommendation && (
              <div style={{ background: "rgba(139,124,246,0.1)", borderRadius: 8, padding: 12, marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>🎯 IF I WERE YOU</div>
                <div style={{ fontSize: 12 }}>{insight.recommendation}</div>
              </div>
            )}
          </>
        ) : <div style={{ textAlign: "center", padding: 24, color: "var(--text-faint)" }}>Still listening...</div>}
      </div>
    </div>
  );

  return (
    <>
      {!insightOpen && (
        <button onClick={() => setInsightOpen(true)} className="ar-widget-btn" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 25, width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg,var(--spectrum-1),var(--spectrum-2),var(--spectrum-3))", fontSize: 22, boxShadow: "0 6px 20px -4px rgba(139,124,246,0.5)" }}>🎧</button>
      )}
      {mounted && insightModal && createPortal(insightModal, document.body)}

      <nav style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg)", position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(8px)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 16, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,var(--spectrum-1),var(--spectrum-2),var(--spectrum-3))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display),sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>C</div>
          <span className="nav-brand-text" style={{ fontFamily: "var(--font-display),sans-serif", fontWeight: 700, fontSize: 15, background: "linear-gradient(90deg,var(--spectrum-1),var(--spectrum-2),var(--spectrum-3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CHROMA</span>
        </Link>
        <div className="nav-links-desktop" style={{ display: "flex", gap: 2, background: "var(--card)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link key={l.href} href={l.href} className="nav-link" style={{ color: active ? "#fff" : "var(--text-dim)", textDecoration: "none", fontSize: 13, padding: "6px 12px", borderRadius: 6, fontWeight: active ? 700 : 500, background: active ? "linear-gradient(90deg,var(--spectrum-2),var(--spectrum-3))" : "transparent" }}>{l.label}</Link>
            );
          })}
        </div>
        <div className="nav-last-collected" style={{ fontSize: 11, color: "var(--text-faint)", marginLeft: 16 }}>
          Last collection <span style={{ color: "var(--text-dim)", fontWeight: 600 }}>{lastCollectedText}</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="nav-client-badge" style={{ fontSize: 11, color: "var(--text-faint)" }}>{CLIENT_NAME}</span>
          <div className="nav-refresh-desktop"><RefreshButton lastRunAt={lastRunAt} /></div>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <ThemeToggle initialTheme={theme} />
          <LogoutButton />
          <button className="nav-hamburger" onClick={() => setMenuOpen((v) => !v)} style={{ display: "none", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, width: 30, height: 30, cursor: "pointer", fontSize: 16 }}>{menuOpen ? "✕" : "☰"}</button>
        </div>
      </nav>

      {menuOpen && (
        <div className="nav-mobile-menu" style={{ display: "none", flexDirection: "column", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg)", position: "sticky", top: 58, zIndex: 19, gap: 4 }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ color: "var(--text)", textDecoration: "none", fontSize: 14, padding: "10px 12px", borderRadius: 6, background: "var(--card)" }}>{l.label}</Link>
          ))}
          <div style={{ padding: "10px 12px" }}><RefreshButton lastRunAt={lastRunAt} /></div>
        </div>
      )}
    </>
  );
}
