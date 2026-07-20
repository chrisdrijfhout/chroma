import Nav from "@/components/Nav";

export const metadata = {
  title: "Chroma",
  description: "Genre-agnostic trend intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, background: "#0a0a0a", color: "#eee", fontFamily: "'JetBrains Mono', monospace", minHeight: "100vh" }}>
        <style>{`
          * { box-sizing: border-box; }
          a { transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease; }
          .card-hover:hover { background: #16181b !important; border-color: #3a3d42 !important; transform: translateY(-2px); }
          .card-hover { transition: all 0.15s ease; }
          .nav-link:hover { background: #1a1c1f !important; color: #fff !important; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #0a0a0a; }
          ::-webkit-scrollbar-thumb { background: #2a2d31; border-radius: 4px; }
        `}</style>
        <Nav />
        {children}
      </body>
    </html>
  );
}
