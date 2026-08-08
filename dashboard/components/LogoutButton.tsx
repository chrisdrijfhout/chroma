"use client";

export default function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleLogout}
      title="Log out"
      style={{
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6,
        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: 13, color: "var(--text-dim)",
      }}
    >
      ⏻
    </button>
  );
}
