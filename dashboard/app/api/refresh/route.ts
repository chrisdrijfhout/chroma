import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  // Record the trigger on the SERVER, immediately — this is what makes the
  // cooldown survive a page reload. A client-side-only "I just clicked
  // this" memory gets wiped on refresh; this doesn't, since any page load
  // from here on reads this real timestamp from Supabase.
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    await supabaseAdmin.from("refresh_triggers").insert({});
  } catch (e) {
    // Don't fail the whole request if this logging insert fails —
    // the actual pipeline trigger above already succeeded.
    console.error("Failed to record refresh trigger:", e);
  }

  return NextResponse.json({ started: true });
}
