import Nav from "@/components/Nav";
import ThemeScript from "@/components/ThemeScript";

export const metadata = {
  title: "Chroma",
  description: "Genre-agnostic trend intelligence platform",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ff6ec7'/%3E%3Cstop offset='50%25' stop-color='%235ac8fa'/%3E%3Cstop offset='100%25' stop-color='%23ffd93d'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='8' fill='url(%23g)'/%3E%3Ctext x='16' y='23' font-family='Arial' font-weight='800' font-size='18' fill='%230a0a0a' text-anchor='middle'%3EC%3C/text%3E%3C/svg%3E",
  },
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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <ThemeScript />
      </head>
      <body>
        <style>{`
          :root[data-theme="dark"] {
            --bg: #0a0a0a;
            --bg-elevated: #0f1216;
            --card: #111214;
            --card-hover: #16181b;
            --border: #222427;
            --border-light: #2a2d31;
            --text: #eee;
            --text-dim: #8a8f98;
            --text-faint: #54585f;
            --spectrum-1: #ff6ec7;
            --spectrum-2: #5ac8fa;
            --spectrum-3: #ffd93d;
            --accent: #5ac8fa;
            --success: #4ade80;
            --danger: #f87171;
          }
          :root[data-theme="light"] {
            --bg: #f7f7f8;
            --bg-elevated: #ffffff;
            --card: #ffffff;
            --card-hover: #f2f3f5;
            --border: #e4e5e8;
            --border-light: #d5d7db;
            --text: #16171a;
            --text-dim: #5c6068;
            --text-faint: #90939a;
            --spectrum-1: #e0529e;
            --spectrum-2: #2b9fd8;
            --spectrum-3: #d9a300;
            --accent: #2b9fd8;
            --success: #16a34a;
            --danger: #dc2626;
          }

          * { box-sizing: border-box; }
          html, body {
            margin: 0; min-height: 100vh; color: var(--text);
            font-family: 'IBM Plex Mono', monospace;
            background: var(--bg);
            background-image: radial-gradient(circle at 20% 0%, var(--bg-elevated) 0%, var(--bg) 45%, var(--bg) 100%);
            background-attachment: fixed;
            transition: background 0.2s ease, color 0.2s ease;
          }
          h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }

          a { transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease, transform 0.15s ease; }

          .card-hover {
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          }
          .card-hover:hover {
            background: var(--card-hover) !important;
            border-color: var(--border-light) !important;
            transform: translateY(-4px);
            box-shadow: 0 12px 24px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(90,200,250,0.1);
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .card-hover:nth-child(1) { animation-delay: 0.02s; }
          .card-hover:nth-child(2) { animation-delay: 0.05s; }
          .card-hover:nth-child(3) { animation-delay: 0.08s; }
          .card-hover:nth-child(4) { animation-delay: 0.11s; }
          .card-hover:nth-child(5) { animation-delay: 0.14s; }
          .card-hover:nth-child(6) { animation-delay: 0.17s; }
          .card-hover:nth-child(7) { animation-delay: 0.20s; }
          .card-hover:nth-child(8) { animation-delay: 0.23s; }
          .card-hover:nth-child(9) { animation-delay: 0.26s; }
          .card-hover:nth-child(10) { animation-delay: 0.29s; }

          .nav-link:hover { background: var(--card-hover) !important; color: var(--text) !important; }

          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: var(--border-light); border-radius: 4px; }

          ::selection { background: var(--spectrum-2); color: var(--bg); }
        `}</style>
        <Nav />
        {children}
      </body>
    </html>
  );
}
