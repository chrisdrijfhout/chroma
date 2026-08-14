import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const { caption, fallbackName } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ songName: fallbackName ?? null });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `A TikTok video caption is below. Captions sometimes explicitly state the song/track name (e.g. after "Song Name:", "Song:", or similar). Extract ONLY the actual song title if one is clearly and explicitly stated. Respond with just the song title, nothing else — no explanation, no quotes. If no explicit song name is stated in the caption, respond with exactly: NONE

Caption: "${caption ?? ""}"`,
      }],
    });

    const textBlock = msg.content.find((b: any) => b.type === "text");
    const result = textBlock && "text" in textBlock ? textBlock.text.trim() : "NONE";

    if (!result || result === "NONE" || result.length > 100) {
      return NextResponse.json({ songName: fallbackName ?? null });
    }
    return NextResponse.json({ songName: result });
  } catch (e) {
    console.error("Song name extraction failed:", e);
    return NextResponse.json({ songName: fallbackName ?? null });
  }
}
