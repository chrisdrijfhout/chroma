import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(request: Request) {
  const body = await request.json();
  const { id, ...fields } = body;

  if (id) {
    const { data, error } = await sb.from("deals").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deal: data });
  }

  const { data, error } = await sb.from("deals").insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deal: data });
}
