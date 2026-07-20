import { NextResponse } from "next/server";

// Triggers the Daily Phonk Radar Pipeline workflow via GitHub's API.
// Requires GITHUB_TOKEN (a Personal Access Token with "Actions: write"
// permission) set as a server-side env var in Vercel — NOT prefixed with
// NEXT_PUBLIC_, so it's never exposed to the browser.
const OWNER = "chrisdrijfhout";
const REPO = "chroma";
const WORKFLOW_FILE = "daily_pipeline.yml";

export async function POST() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  return NextResponse.json({ started: true });
}
