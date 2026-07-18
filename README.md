# Phonk Radar

AI/data platform tracking trends, creators, tracks, and sounds in the global phonk scene.

## Setup
1. Create a Supabase project, run `schema.sql` in the SQL editor.
2. Add repo secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `APIFY_API_TOKEN`, `ANTHROPIC_API_KEY`.
3. Push to GitHub — the daily and weekly workflows run automatically.
4. `cd dashboard && npm install && npm run dev` for local dashboard dev (needs `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`).

See ARCHITECTURE.md for full design rationale, scoring formulas, and roadmap.
