import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 240,
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #020617 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "110px",
          border: "12px solid #10b981",
        }}
      >
        ⛅
      </div>
    ),
    {
      ...size,
    }
  );
}

