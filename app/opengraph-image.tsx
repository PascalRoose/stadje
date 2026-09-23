import { ImageResponse } from "next/og";
import { LogoMark } from "@/components/Logo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F2EBDF",
        fontFamily: "serif",
      }}
    >
      <LogoMark size={220} />
      <div
        style={{
          marginTop: 32,
          fontSize: 96,
          fontWeight: 700,
          color: "#191512",
        }}
      >
        stadje
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: 32,
          color: "#2F6B4A",
        }}
      >
        Elke dag één Nederlands stadje raden
      </div>
    </div>,
    { ...size },
  );
}
