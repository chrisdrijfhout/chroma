"use client";
import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, position: "relative", overflow: "hidden",
    }}>
      {/* Radar/scanning-pulse visual — pings expanding outward, catching
          something before it has a name, same idea the whole product is
          built around */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 700, height: 700, pointerEvents: "none",
      }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="radar-ring" style={{
            position: "absolute", top: "50%", left: "50%",
            width: 40, height: 40, marginLeft: -20, marginTop: -20,
            borderRadius: "50%",
            border: "1px solid var(--spectrum-2)",
            animation: `radarPing 4s ease-out infinite`,
            animationDelay: `${i * 1}s`,
          }} />
        ))}
        {/* A few "signal dots" that light up at different radii/angles —
            representing sounds/creators being caught */}
        {[
          { top: "30%", left: "62%", delay: "0.5s" },
          { top: "68%", left: "38%", delay: "1.8s" },
          { top: "40%", left: "28%", delay: "2.6s" },
          { top: "72%", left: "66%", delay: "3.4s" },
        ].map((dot, i) => (
          <div key={i} className="radar-dot" style={{
            position: "absolute", top: dot.top, left: dot.left,
            width: 8, height: 8, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
            animation: `dotBlip 4s ease-in-out infinite`,
            animationDelay: dot.delay,
          }} />
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 340, background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: 32, textAlign: "center", position: "relative", zIndex: 1,
        boxShadow: "0 20px 60px -12px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, margin: "0 auto 16px",
          background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display), sans-serif", fontWeight: 800, fontSize: 20, color: "#fff",
          boxShadow: "0 0 20px rgba(139,124,246,0.35)",
        }}>
          C
        </div>
        <h1 style={{
          fontFamily: "var(--font-display), sans-serif", fontSize: 18, margin: "0 0 4px",
          background: "linear-gradient(90deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Chroma
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "0 0 24px" }}>
          Private preview
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Access code"
          autoFocus
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8,
            border: `1px solid ${error ? "var(--danger)" : "var(--border-light)"}`,
            background: "var(--bg)", color: "var(--text)", fontSize: 14,
            fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box",
          }}
        />

        {error && (
          <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 12 }}>
            Incorrect code — try again
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, border: "none",
            background: "linear-gradient(90deg, var(--spectrum-2), var(--spectrum-3))",
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: loading ? "default" : "pointer",
            fontFamily: "var(--font-display), sans-serif", opacity: loading || !password ? 0.6 : 1,
          }}
        >
          {loading ? "Checking..." : "Enter"}
        </button>
      </form>

      <style>{`
        @keyframes radarPing {
          0% { width: 40px; height: 40px; margin-left: -20px; margin-top: -20px; opacity: 0.8; }
          100% { width: 640px; height: 640px; margin-left: -320px; margin-top: -320px; opacity: 0; }
        }
        @keyframes dotBlip {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          15%, 30% { opacity: 1; transform: scale(1); }
          45% { opacity: 0; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
}
