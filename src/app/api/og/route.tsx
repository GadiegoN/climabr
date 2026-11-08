import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const cidade = searchParams.get("cidade")?.slice(0, 50) || "Previsão do Tempo";
    const uf = searchParams.get("uf")?.slice(0, 2)?.toUpperCase() || "BR";
    const temp = searchParams.get("temp") || "24";
    const cond = searchParams.get("cond")?.slice(0, 50) || "Tempo Estável";
    const max = searchParams.get("max");
    const min = searchParams.get("min");
    const chuva = searchParams.get("chuva");

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "50px 70px",
            background: "linear-gradient(135deg, #022c22 0%, #064e3b 40%, #091e1d 75%, #02120e 100%)",
            fontFamily: "sans-serif",
            color: "#ffffff",
            position: "relative",
          }}
        >
          {/* Efeito Glow / Iluminação de Fundo */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "450px",
              height: "450px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(0, 0, 0, 0) 70%)",
              display: "flex",
            }}
          />

          {/* Topo: Logo + Tagline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "2px solid rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="36"
                  height="36"
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
                <div style={{ display: "flex", alignItems: "center", fontSize: "36px", fontWeight: 900, letterSpacing: "-1px", lineHeight: "1" }}>
                  <span>Clima</span>
                  <span style={{ color: "#10b981" }}>BR</span>
                </div>
                <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.7)", marginTop: "3px", fontWeight: 600 }}>
                  Previsão Oficial • Sem Anúncios
                </span>
              </div>
            </div>

            {/* Badge de Município */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "9999px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1.5px solid rgba(16, 185, 129, 0.4)",
                color: "#34d399",
                fontSize: "14px",
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
              <span>{uf} • Brasil</span>
            </div>
          </div>

          {/* Centro: Nome da Cidade + Temperatura Gigante + Condição */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", margin: "20px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "680px" }}>
              <span style={{ fontSize: "20px", color: "#34d399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                Condições em Tempo Real
              </span>
              <h1
                style={{
                  fontSize: "58px",
                  fontWeight: 900,
                  lineHeight: "1.1",
                  letterSpacing: "-1.5px",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span>{cidade}</span>
                <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>-</span>
                <span style={{ color: "#34d399" }}>{uf}</span>
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 18px",
                    borderRadius: "14px",
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    fontSize: "20px",
                    fontWeight: 700,
                  }}
                >
                  <span>{cond}</span>
                </div>
              </div>
            </div>

            {/* Temperatura em Destaque */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  fontSize: "108px",
                  fontWeight: 900,
                  lineHeight: "0.9",
                  letterSpacing: "-4px",
                  color: "#ffffff",
                }}
              >
                <span>{temp}</span>
                <span style={{ fontSize: "52px", color: "#34d399", marginTop: "8px" }}>°C</span>
              </div>
            </div>
          </div>

          {/* Rodapé: Estatísticas de Máx, Mín, Chuva + Domínio */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              paddingTop: "20px",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {max && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#fca5a5",
                  }}
                >
                  <span>Máx: {max}°C</span>
                </div>
              )}
              {min && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#7dd3fc",
                  }}
                >
                  <span>Mín: {min}°C</span>
                </div>
              )}
              {chuva && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#6ee7b7",
                  }}
                >
                  <span>Chuva: {chuva}%</span>
                </div>
              )}
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
                <span>🛡️ Sem Anúncios</span>
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
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response("Erro ao gerar card OpenGraph", { status: 500 });
  }
}
