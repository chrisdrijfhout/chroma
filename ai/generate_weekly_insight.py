import os, json
from datetime import date, timedelta
from supabase import create_client
import anthropic

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
claude = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

def gather_week_data():
    since = (date.today() - timedelta(days=7)).isoformat()
    top_creators = sb.table("trend_scores").select("*").eq("entity_type", "creator") \
        .gte("score_date", since).order("score", desc=True).limit(10).execute().data
    top_sounds = sb.table("trend_scores").select("*").eq("entity_type", "sound") \
        .gte("score_date", since).order("score", desc=True).limit(10).execute().data
    top_videos = sb.table("trend_scores").select("*").eq("entity_type", "video") \
        .gte("score_date", since).order("score", desc=True).limit(15).execute().data
    return {"creators": top_creators, "sounds": top_sounds, "videos": top_videos}

def generate_report(data):
    prompt = f"""You are an A&R analyst covering the global phonk music scene.
Below is structured trend data for the past 7 days (creators, sounds, videos with computed scores).

Data:
{json.dumps(data, default=str)}

Write a concise executive report for a label owner / A&R manager covering:
1. Fastest growing creators (who and why it matters)
2. Fastest growing sounds
3. Emerging hashtags or subgenre shifts you can infer from the data
4. Content format observations
5. 2-3 concrete opportunities (artists/creators worth contacting now)

Keep it under 500 words, direct, no fluff. This is a business intelligence brief, not marketing copy."""

    msg = claude.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text

def main():
    data = gather_week_data()
    report = generate_report(data)
    sb.table("insights").insert({
        "report_type": "weekly",
        "period_start": (date.today() - timedelta(days=7)).isoformat(),
        "period_end": date.today().isoformat(),
        "summary": report,
        "full_report": data,
    }).execute()
    print("Weekly insight generated")

if __name__ == "__main__":
    main()
