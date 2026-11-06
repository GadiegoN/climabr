import React, { useState } from "react";
import { PrevisaoHorariaItem } from "@/types/weather";
import { TrendingUp, CloudRain } from "lucide-react";

interface WeatherChartProps {
  dados: PrevisaoHorariaItem[];
}

export function WeatherChart({ dados }: WeatherChartProps) {
  const [pontoAtivo, setPontoAtivo] = useState<number | null>(null);

  if (!dados || dados.length < 2) return null;

  // Dimensões do gráfico SVG
  const largura = 800;
  const altura = 200;
  const paddingX = 48; // Aumentado para respiro visual nas extremidades
  const paddingTop = 45;
  const paddingBottom = 45;

  // Temperaturas mínimas e máximas para escala vertical
  const temps = dados.map((d) => d.temperatura);
  const minTemp = Math.floor(Math.min(...temps)) - 2;
  const maxTemp = Math.ceil(Math.max(...temps)) + 2;
  const rangeTemp = maxTemp - minTemp || 1;

  // Mapeia cada ponto de dados para coordenadas X e Y no SVG
  const pontos = dados.map((d, i) => {
    const x = paddingX + (i / (dados.length - 1)) * (largura - paddingX * 2);
    const y =
      paddingTop +
      (1 - (d.temperatura - minTemp) / rangeTemp) * (altura - paddingTop - paddingBottom);
    return { x, y, ...d, index: i };
  });

  // Cria a curva suave (Cubic Bezier curve) conectando os pontos de temperatura
  const gerarCaminhoCurvo = () => {
    if (pontos.length === 0) return "";
    let d = `M ${pontos[0].x} ${pontos[0].y}`;

    for (let i = 0; i < pontos.length - 1; i++) {
      const pAtual = pontos[i];
      const pProx = pontos[i + 1];
      const cp1x = pAtual.x + (pProx.x - pAtual.x) / 2;
      const cp1y = pAtual.y;
      const cp2x = pAtual.x + (pProx.x - pAtual.x) / 2;
      const cp2y = pProx.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pProx.x} ${pProx.y}`;
    }
    return d;
  };

  const caminhoLinha = gerarCaminhoCurvo();
  // Fecha a curva embaixo para formar a área preenchida com gradiente
  const caminhoArea = `${caminhoLinha} L ${pontos[pontos.length - 1].x} ${
    altura - paddingBottom + 10
  } L ${pontos[0].x} ${altura - paddingBottom + 10} Z`;

  const pontoSelecionado = pontoAtivo !== null ? pontos[pontoAtivo] : null;

  // Cálculo de posicionamento inteligente do Tooltip para NUNCA cortar
  const getTooltipStyle = () => {
    if (!pontoSelecionado) return {};
    const percentualX = (pontoSelecionado.x / largura) * 100;

    // Se estiver perto da borda direita (últimos 20%), alinha da direita para a esquerda
    if (percentualX > 75) {
      return {
        right: `${Math.max(2, (1 - pontoSelecionado.x / largura) * 100 - 3)}%`,
        transform: "translateX(0)",
      };
    }
    // Se estiver perto da borda esquerda (primeiros 20%), alinha da esquerda para a direita
    if (percentualX < 25) {
      return {
        left: `${Math.max(2, percentualX - 3)}%`,
        transform: "translateX(0)",
      };
    }
    // No meio, centraliza perfeitamente no ponto
    return {
      left: `${percentualX}%`,
      transform: "translateX(-50%)",
    };
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
      }}
      className="rounded-3xl p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-4"
    >
      {/* Cabeçalho do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ color: "var(--text-main)" }} className="text-base font-bold">
              Curva Térmica & Chuva (24h)
            </h3>
            <p style={{ color: "var(--text-muted)" }} className="text-xs">
              Variação horária da temperatura e probabilidade de chuva
            </p>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-main)" }}>
            <span className="w-3 h-1 rounded-full bg-emerald-500 inline-block" />
            <span>Temperatura (°C)</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400/50 border border-sky-400 inline-block" />
            <span>Chuva (%)</span>
          </div>
        </div>
      </div>

      {/* Área do Gráfico SVG Responsivo */}
      <div className="relative w-full">
        {/* Tooltip Dinâmico com Posicionamento Inteligente anti-corte */}
        {pontoSelecionado && (
          <div
            style={{
              ...getTooltipStyle(),
              backgroundColor: "var(--chip-bg)",
              borderColor: "var(--chip-border)",
              color: "var(--text-main)",
            }}
            className="absolute top-1 px-3.5 py-1.5 rounded-xl border text-xs shadow-2xl backdrop-blur-md pointer-events-none z-30 flex items-center gap-2 font-semibold whitespace-nowrap transition-all duration-150"
          >
            <span className="opacity-75">{pontoSelecionado.hora}:</span>
            <span className="text-emerald-500 font-bold">{Math.round(pontoSelecionado.temperatura)}°C</span>
            {pontoSelecionado.probabilidadeChuva !== undefined && pontoSelecionado.probabilidadeChuva > 0 && (
              <span className="text-sky-400 flex items-center gap-1">
                <CloudRain className="w-3 h-3" />
                {pontoSelecionado.probabilidadeChuva}%
              </span>
            )}
          </div>
        )}

        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          className="w-full h-48 md:h-56 select-none overflow-visible"
        >
          <defs>
            {/* Gradiente da área de temperatura */}
            <linearGradient id="tempAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradiente da linha */}
            <linearGradient id="tempLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Barras de Probabilidade de Chuva no fundo */}
          {pontos.map((p, i) => {
            if (!p.probabilidadeChuva || p.probabilidadeChuva <= 0) return null;
            const barH = (p.probabilidadeChuva / 100) * (altura - paddingTop - paddingBottom);
            const barY = altura - paddingBottom - barH;
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={p.x - 7}
                  y={barY}
                  width={14}
                  height={barH}
                  rx={4}
                  fill="#38bdf8"
                  fillOpacity="0.25"
                  stroke="#38bdf8"
                  strokeOpacity="0.5"
                />
              </g>
            );
          })}

          {/* Área preenchida sob a curva */}
          <path d={caminhoArea} fill="url(#tempAreaGradient)" />

          {/* Linha da curva suave */}
          <path
            d={caminhoLinha}
            fill="none"
            stroke="url(#tempLineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Pontos clicáveis / com hover para interatividade */}
          {pontos.map((p, i) => {
            const isAtivo = pontoAtivo === i;
            // Mostra rótulo a cada 3 pontos para não poluir
            const mostrarLabel = i % 3 === 0 || i === pontos.length - 1;

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setPontoAtivo(i)}
                onMouseLeave={() => setPontoAtivo(null)}
                onTouchStart={() => setPontoAtivo(i)}
              >
                {/* Linha vertical ao passar o mouse */}
                {isAtivo && (
                  <line
                    x1={p.x}
                    y1={paddingTop - 10}
                    x2={p.x}
                    y2={altura - paddingBottom}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                )}

                {/* Ponto da temperatura */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isAtivo ? 6 : 4}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={isAtivo ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Valor da temperatura acima do ponto (em intervalos ou hover) */}
                {(mostrarLabel || isAtivo) && (
                  <text
                    x={p.x}
                    y={p.y - 10}
                    textAnchor="middle"
                    fill="var(--text-main)"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {Math.round(p.temperatura)}°
                  </text>
                )}

                {/* Horário no Eixo X */}
                {mostrarLabel && (
                  <text
                    x={p.x}
                    y={altura - 15}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {p.hora}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
