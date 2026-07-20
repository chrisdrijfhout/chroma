"use client";
import { useState } from "react";

export default function SafeImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div style={{
        width: "100%", height: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#333", fontSize: 11, textAlign: "center", padding: 8,
      }}>
        thumbnail unavailable
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
