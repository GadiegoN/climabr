import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 45%, #091e1d 80%, #02120e 100%)",
          fontFamily: "sans-serif",
          color: "#ffffff",
          position: "relative",
        }}
      >
        {/* Efeito Glow / Iluminação de Fundo */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(0, 0, 0, 0) 70%)",
            display: "flex",
          }}
        />

        {/* Topo: Logo + Tagline Oficial */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Ícone Estilizado de Sol e Chuva */}
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "20px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "2px solid rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="15.5" cy="8.5" r="3" fill="#fbbf24" stroke="#fbbf24" strokeWidth="0.5" />
                <path
                  d="M15.5 3.5v1.5M15.5 12v1.5M10.5 8.5H9M22 8.5h-1.5M12 5l1 1M18 11l1 1M12 12l1-1M18 6l1-1"
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M7.5 17a4.5 4.5 0 0 1-1.3-8.8A5 5 0 0 1 15.8 8a4 4 0 0 1 3.7 4.5A3.5 3.5 0 0 1 18 17H7.5z"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                />
                <path d="M9 18.5l-1 2.5M13 18.5l-1 2.5" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", fontSize: "44px", fontWeight: 900, letterSpacing: "-1px", lineHeight: "1" }}>
                <span>Clima</span>
                <span style={{ color: "#10b981" }}>BR</span>
              </div>
              <span style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.7)", marginTop: "4px", fontWeight: 600 }}>
                Inteligência Meteorológica Aberta
              </span>
            </div>
          </div>

          {/* Badge de Selo Oficial */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "9999px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1.5px solid rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#34d399",
                display: "flex",
              }}
            />
            <span>5.570 Municípios Brasileiros</span>
          </div>
        </div>

        {/* Meio: Título Principal e Proposta de Valor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: "1.15",
              letterSpacing: "-1.5px",
              margin: 0,
            }}
          >
            Previsão do tempo limpa, rápida e{" "}
            <span style={{ color: "#34d399" }}>sem anúncios invasivos</span>.
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: "1.4",
              margin: 0,
            }}
          >
            Dados oficiais do IBGE, INMET, Open-Meteo e radar ao vivo sem pop-ups ou poluição visual na sua tela.
          </p>
        </div>

        {/* Rodapé: Badges de Recursos + Domínio */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <span>🌧️ Radar Chuva ao Vivo</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <span>⚠️ Alertas Defesa Civil</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <span>🛡️ 100% Livre de Anúncios</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "18px",
              fontWeight: 800,
              color: "#34d399",
              letterSpacing: "-0.5px",
            }}
          >
            climabr-two.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
