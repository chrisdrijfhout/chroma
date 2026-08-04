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
      minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 340, background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 16, padding: 32, textAlign: "center",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, margin: "0 auto 16px",
          background: "linear-gradient(135deg, var(--spectrum-1), var(--spectrum-2), var(--spectrum-3))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display), sans-serif", fontWeight: 800, fontSize: 20, color: "#fff",
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
    </div>
  );
}
