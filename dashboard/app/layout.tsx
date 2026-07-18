import Nav from "@/components/Nav";

export const metadata = {
  title: "Phonk Radar",
  description: "Phonk trend intelligence dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#eee", fontFamily: "monospace", minHeight: "100vh" }}>
        <Nav />
        {children}
      </body>
    </html>
  );
}
