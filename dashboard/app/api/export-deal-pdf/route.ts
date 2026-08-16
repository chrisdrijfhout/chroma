import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Link, Font } from "@react-pdf/renderer";
import React from "react";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#16171a" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  logo: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: "#6c5ce7",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  logoText: { color: "#fff", fontSize: 16, fontFamily: "Helvetica-Bold" },
  brand: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#16171a" },
  brandSub: { fontSize: 9, color: "#90939a" },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#e4e5e8", marginBottom: 24 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  handles: { fontSize: 11, color: "#5c6068", marginBottom: 16 },
  badge: {
    backgroundColor: "#e8f7ee", borderRadius: 4, paddingVertical: 6, paddingHorizontal: 10,
    alignSelf: "flex-start", marginBottom: 20,
  },
  badgeText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#16a34a" },
  statsRow: { flexDirection: "row", marginBottom: 24, gap: 8 },
  statCard: { flex: 1, backgroundColor: "#f7f7f8", borderRadius: 6, padding: 12, alignItems: "center" },
  statValue: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  statLabel: { fontSize: 8, color: "#5c6068", textAlign: "center" },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  sectionText: { fontSize: 10, color: "#5c6068", marginBottom: 4, lineHeight: 1.5 },
  callout: { backgroundColor: "#f2effe", borderRadius: 6, padding: 14, marginTop: 20 },
  calloutLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#6c5ce7", marginBottom: 6 },
  calloutText: { fontSize: 10, color: "#16171a", lineHeight: 1.5 },
  link: { color: "#6c5ce7", fontSize: 10 },
});

function DealDoc({ deal }: { deal: any }) {
  return React.createElement(Document, {},
    React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.logo },
          React.createElement(Text, { style: styles.logoText }, "C")
        ),
        React.createElement(View, {},
          React.createElement(Text, { style: styles.brand }, "CHROMA"),
          React.createElement(Text, { style: styles.brandSub }, "Deal Brief")
        )
      ),
      React.createElement(View, { style: styles.divider }),
      React.createElement(Text, { style: styles.title }, deal.artist_name),
      React.createElement(Text, { style: styles.handles },
        [deal.tiktok_handle, deal.instagram_handle].filter(Boolean).join("   ·   ")
      ),
      React.createElement(View, { style: styles.badge },
        React.createElement(Text, { style: styles.badgeText }, deal.status.toUpperCase())
      ),
      React.createElement(View, { style: styles.statsRow },
        deal.tiktok_views_override && React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statValue }, deal.tiktok_views_override),
          React.createElement(Text, { style: styles.statLabel }, "TikTok Views")
        ),
        deal.spotify_monthly_listeners && React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statValue }, deal.spotify_monthly_listeners),
          React.createElement(Text, { style: styles.statLabel }, "Monthly Spotify Listeners")
        ),
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statValue }, "Organic"),
          React.createElement(Text, { style: styles.statLabel }, "Discovery Method")
        )
      ),
      React.createElement(Text, { style: styles.sectionTitle }, "How this was found"),
      React.createElement(Text, { style: styles.sectionText }, deal.discovery_note),
      React.createElement(View, { style: { height: 16 } }),
      React.createElement(Text, { style: styles.sectionTitle }, "Contact"),
      deal.email && React.createElement(Text, { style: styles.sectionText }, `Email:  ${deal.email}`),
      deal.tiktok_url && React.createElement(Link, { src: deal.tiktok_url, style: styles.link }, `TikTok:  ${deal.tiktok_url}`),
      deal.next_step && React.createElement(View, { style: styles.callout },
        React.createElement(Text, { style: styles.calloutLabel }, "NEXT STEP"),
        React.createElement(Text, { style: styles.calloutText }, deal.next_step)
      )
    )
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing deal id" }, { status: 400 });
  }

  const { data: deal, error } = await sb.from("deals").select("*").eq("id", id).single();
  if (error || !deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(DealDoc({ deal }) as any);
  const filename = `Chroma_Deal_Brief_${deal.artist_name.replace(/\s+/g, "_")}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
