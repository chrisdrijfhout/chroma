import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const LABEL_NAME = "Tribal Music Group";

const FALLBACK_TEMPLATE = (song: string) =>
  `Hey, this is such a good track — "${song}" deserves way more ears than it's getting. I work with ${LABEL_NAME} and we'd love to properly release it with you, advance + marketing push included. Down to talk?`;

export async function POST(request: Request) {
  const { caption, fallbackName } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ songName: fallbackName ?? null, pitch: FALLBACK_TEMPLATE(fallbackName ?? "your track") });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Step 1: extract a real song name from the caption if one's stated
    const nameMsg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `Extract ONLY the song title if explicitly stated in this TikTok caption (e.g. after "Song Name:"). Respond with just the title, or exactly NONE if not stated.\n\nCaption: "${caption ?? ""}"`,
      }],
    });
    const nameBlock = nameMsg.content.find((b: any) => b.type === "text");
    const extracted = nameBlock && "text" in nameBlock ? nameBlock.text.trim() : "NONE";
    const songName = (!extracted || extracted === "NONE" || extracted.length > 100)
      ? (fallbackName || "your track")
      : extracted;

    // Step 2: generate a genuinely fresh, uniquely-worded pitch each time
    // — deliberately varied phrasing so repeated outreach doesn't read as
    // duplicate templated text, which is itself a spam signal separate
    // from the message's actual content.
    const pitchMsg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Write a short TikTok DM (2-3 sentences max) from a music label scout to a producer about their track "${songName}".

Requirements:
- Sounds like one real person messaging casually, NOT a company announcing itself — never open with "I'm reaching out from" or similar corporate framing
- Mention the label name "${LABEL_NAME}" naturally partway through, not as the opener
- Include a genuine compliment about the track
- Clearly state you'd offer an advance and handle marketing if they release with the label
- End with a low-key question inviting them to talk
- Keep it under 45 words
- Write ONLY the message text, nothing else — no preamble, no quotes around it

Vary your phrasing naturally — don't reuse stock phrases like "deserves way more ears" every time.`,
      }],
    });
    const pitchBlock = pitchMsg.content.find((b: any) => b.type === "text");
    const pitch = pitchBlock && "text" in pitchBlock ? pitchBlock.text.trim() : FALLBACK_TEMPLATE(songName);

    return NextResponse.json({ songName, pitch });
  } catch (e) {
    console.error("Pitch generation failed:", e);
    return NextResponse.json({ songName: fallbackName ?? null, pitch: FALLBACK_TEMPLATE(fallbackName ?? "your track") });
  }
}
