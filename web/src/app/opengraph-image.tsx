import { ImageResponse } from "next/og";

export const alt = "PumAI — Omnichannel AI Agents for Australian Business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #09090b 0%, #1a0b2e 45%, #2a0b4a 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 900,
              color: "white",
            }}
          >
            P
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
            <span>Pum</span>
            <span style={{ color: "#A78BFA" }}>AI</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 26,
              color: "#A78BFA",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Built for Australian Business
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            Omnichannel AI Agents for WhatsApp, Webchat, Instagram &amp; Messenger
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            fontSize: 24,
            color: "#d4d4d8",
            fontWeight: 500,
          }}
        >
          <span>WhatsApp</span>
          <span style={{ color: "#52525b" }}>·</span>
          <span>Webchat</span>
          <span style={{ color: "#52525b" }}>·</span>
          <span>Instagram</span>
          <span style={{ color: "#52525b" }}>·</span>
          <span>Messenger</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
