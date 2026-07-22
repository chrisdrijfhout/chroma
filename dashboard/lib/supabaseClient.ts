import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      // Force every request this client makes to skip Next.js's fetch
      // cache entirely — belt-and-suspenders alongside each page's
      // `export const dynamic = 'force-dynamic'`.
      fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
    },
  }
);
