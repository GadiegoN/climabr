import { ImageResponse } from "next/og";

// Tamanho otimizado para abas de navegadores e monitores de alta densidade (Retina/HD)
export const size = {
  width: 48,
  height: 48,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 60%, #047857 100%)",
          borderRadius: "12px",
          border: "2px solid #10b981",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sol Dourado */}
          <circle cx="15.5" cy="8.5" r="3" fill="#f59e0b" stroke="#f59e0b" strokeWidth="0.5" />
          <path d="M15.5 3.5v1.5M15.5 12v1.5M10.5 8.5H9M22 8.5h-1.5M12 5l1 1M18 11l1 1M12 12l1-1M18 6l1-1" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
          {/* Nuvem Branca com Contorno */}
          <path
            d="M7.5 17a4.5 4.5 0 0 1-1.3-8.8A5 5 0 0 1 15.8 8a4 4 0 0 1 3.7 4.5A3.5 3.5 0 0 1 18 17H7.5z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
          {/* Gotas de chuva azuis */}
          <path d="M9 18.5l-1 2.5M13 18.5l-1 2.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
