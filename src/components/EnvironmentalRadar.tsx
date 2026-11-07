"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertaINMET,
  AlertaCEMADEN,
  RiscoFogo,
  QualidadeArDados,
} from "@/types/weather";
import {
  ShieldAlert,
  ShieldCheck,
  Flame,
  CloudLightning,
  Waves,
  Wind,
  Sun,
  X,
  ExternalLink,
  Info,
  ChevronRight,
  PhoneCall,
} from "lucide-react";

interface EnvironmentalRadarProps {
  municipio: string;
  uf: string;
  alertasINMET?: AlertaINMET[];
  alertasCEMADEN?: AlertaCEMADEN[];
  riscoFogo?: RiscoFogo;
  qualidadeAr?: QualidadeArDados;
}

export default function EnvironmentalRadar({
  municipio,
  uf,
  alertasINMET = [],
  alertasCEMADEN = [],
  riscoFogo,
  qualidadeAr,
}: EnvironmentalRadarProps) {
  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaINMET | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Total de avisos com atenção/perigo
  const alertasGraves = alertasINMET.filter(
    (a) => a.severidade?.toLowerCase().includes("perigo") || a.nivel >= 2
  );
  const temRiscoCemaden = alertasCEMADEN.length > 0;
  const temFogoCritico = riscoFogo && (riscoFogo.nivel === "Muito Alto" || riscoFogo.nivel === "Crítico");
  const temUvExtremo = qualidadeAr?.uvIndex !== undefined && qualidadeAr.uvIndex >= 11;

  const totalAlertasAtivos = alertasINMET.length + alertasCEMADEN.length;
  const situacaoCritica = alertasGraves.length > 0 || temRiscoCemaden || temFogoCritico;

  // Classificação do Índice UV com contraste adaptativo por tema
  const getUVBadge = (uv?: number) => {
    if (uv === undefined) return { texto: "N/D", cor: "badge-neutral" };
    if (uv <= 2) return { texto: "Baixo", cor: "badge-emerald" };
    if (uv <= 5) return { texto: "Moderado", cor: "badge-amber" };
    if (uv <= 7) return { texto: "Alto", cor: "badge-orange" };
    if (uv <= 10) return { texto: "Muito Alto", cor: "badge-rose" };
    return { texto: "Extremo", cor: "badge-purple" };
  };

  // Classificação da Qualidade do Ar (European AQI) com contraste adaptativo por tema
  const getAQIBadge = (aqi?: number) => {
    if (aqi === undefined) return { texto: "N/D", cor: "badge-neutral" };
    if (aqi <= 20) return { texto: "Excelente", cor: "badge-teal" };
    if (aqi <= 40) return { texto: "Bom", cor: "badge-emerald" };
    if (aqi <= 60) return { texto: "Moderado", cor: "badge-amber" };
    if (aqi <= 80) return { texto: "Ruim", cor: "badge-orange" };
    return { texto: "Muito Ruim", cor: "badge-rose" };
  };

  // Classificação do Risco de Fogo com badge adaptativo
  const getRiscoFogoBadge = (nivel?: string) => {
    switch (nivel) {
      case "Baixo":
        return "badge-emerald";
      case "Moderado":
        return "badge-amber";
      case "Alto":
        return "badge-orange";
      case "Muito Alto":
      case "Crítico":
        return "badge-rose";
      default:
        return "badge-neutral";
    }
  };

  // Classificação da Severidade do Alerta
  const getSeveridadeBadge = (severidade?: string) => {
    const s = (severidade || "").toLowerCase();
    if (s.includes("grande perigo")) return "badge-rose";
    if (s.includes("perigo")) return "badge-orange";
    return "badge-amber";
  };

  const uvBadge = getUVBadge(qualidadeAr?.uvIndex);
  const aqiBadge = getAQIBadge(qualidadeAr?.aqi);

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderColor: "var(--card-border)",
    boxShadow: "var(--card-shadow)",
  };

  return (
    <div
      style={cardStyle}
      className="w-full rounded-3xl border backdrop-blur-xl p-5 sm:p-6 transition-all duration-300 shadow-xl space-y-5"
    >
      {/* 1. Header do Radar com Status Global */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
              <span>Radar Ambiental & Defesa Civil</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Monitoramento integrado: INMET, CEMADEN e Prevenção de Fogo
            </p>
          </div>
        </div>

        {/* Badge de Status Geral */}
        <div className="self-start sm:self-auto">
          {situacaoCritica ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold badge-amber flex items-center gap-1.5 shadow-sm animate-pulse">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Atenção: Avisos Oficiais Vigentes</span>
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold badge-emerald flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Condições Estáveis na Região</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Grid de 4 Pilares de Monitoramento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* PILAR 1: ALERTA METEOROLÓGICO (INMET) */}
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase flex items-center gap-1.5">
                <CloudLightning className="w-3.5 h-3.5 text-amber-500" />
                INMET
              </span>
              {alertasINMET.length > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-amber">
                  {alertasINMET.length} ativo{alertasINMET.length > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-emerald">
                  Normal
                </span>
              )}
            </div>

            {alertasINMET.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text-main)] line-clamp-1">
                  {alertasINMET[0].evento}
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium line-clamp-2">
                  {alertasINMET[0].severidade}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Nenhum aviso meteorológico ativo para o estado de {uf}.
              </p>
            )}
          </div>

          {alertasINMET.length > 0 && (
            <button
              type="button"
              onClick={() => setAlertaSelecionado(alertasINMET[0])}
              className="w-full mt-2 py-1.5 px-3 rounded-xl badge-amber text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer hover:opacity-90"
            >
              <span>Ver Riscos & Instruções</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* PILAR 2: DESASTRES NATURAIS (CEMADEN) */}
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-blue-500" />
                CEMADEN
              </span>
              {alertasCEMADEN.length > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold badge-rose">
                  Alerta
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold badge-emerald">
                  Seguro
                </span>
              )}
            </div>

            {alertasCEMADEN.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text-main)]">
                  {alertasCEMADEN[0].evento}
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                  Nível: {alertasCEMADEN[0].nivel}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Sem ocorrência de risco de inundação ou deslizamento em {municipio}.
              </p>
            )}
          </div>

          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--card-border)] flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span>Monitoramento hidro-geológico</span>
          </div>
        </div>

        {/* PILAR 3: RISCO DE QUEIMADAS & FOGO (INPE / FMA) */}
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Risco de Fogo
              </span>
              {riscoFogo && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRiscoFogoBadge(riscoFogo.nivel)}`}>
                  {riscoFogo.nivel}
                </span>
              )}
            </div>

            {riscoFogo ? (
              <div className="space-y-1.5">
                <div className="w-full bg-black/10 dark:bg-black/20 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${riscoFogo.indice}%`,
                      backgroundColor: riscoFogo.corHex,
                    }}
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                  {riscoFogo.descricao}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                Calculando modelo meteorológico...
              </p>
            )}
          </div>

          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--card-border)] flex items-center gap-1">
            <Info className="w-3 h-3 text-orange-500 flex-shrink-0" />
            <span>Fórmula de Monte Alegre / INPE</span>
          </div>
        </div>

        {/* PILAR 4: SAÚDE AMBIENTAL (AR & UV) */}
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Ar & UV
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${uvBadge.cor}`}>
                UV {qualidadeAr?.uvIndex ?? "N/D"}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Qualidade do Ar:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${aqiBadge.cor}`}>
                  {aqiBadge.texto}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Partículas PM2.5:</span>
                <span className="font-semibold text-[var(--text-main)]">
                  {qualidadeAr?.pm25 !== undefined ? `${qualidadeAr.pm25} µg/m³` : "N/D"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--card-border)] flex items-center gap-1">
            <Info className="w-3 h-3 text-teal-500 flex-shrink-0" />
            <span>Satélite Copernicus Open-Meteo</span>
          </div>
        </div>
      </div>

      {/* 3. MODAL DE DETALHES DE ALERTA DO INMET (Renderizado no body via Portal para nunca ser bloqueado por stacking context) */}
      {alertaSelecionado && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            style={cardStyle}
            className="w-full max-w-lg rounded-3xl border border-white/20 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setAlertaSelecionado(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Alerta */}
            <div className="space-y-1 pr-8">
              <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getSeveridadeBadge(alertaSelecionado.severidade)}`}>
                {alertaSelecionado.severidade}
              </span>
              <h3 className="text-xl font-bold text-[var(--text-main)]">
                {alertaSelecionado.evento}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Vigência: de {alertaSelecionado.inicio} até {alertaSelecionado.fim}
              </p>
            </div>

            {/* Riscos Potenciais */}
            {alertaSelecionado.riscos && alertaSelecionado.riscos.length > 0 && (
              <div className="space-y-2 p-4 rounded-2xl badge-amber border">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  Riscos Potenciais Identificados:
                </h4>
                <ul className="space-y-1.5 text-xs list-disc list-inside opacity-90">
                  {alertaSelecionado.riscos.map((risco, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {risco}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instruções de Segurança da Defesa Civil */}
            {alertaSelecionado.instrucoes && alertaSelecionado.instrucoes.length > 0 && (
              <div className="space-y-2 p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-[var(--card-border)]">
                <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                  Instruções à População:
                </h4>
                <ul className="space-y-1.5 text-xs text-[var(--text-muted)] list-disc list-inside">
                  {alertaSelecionado.instrucoes.map((instrucao, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {instrucao}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Telefones de Emergência */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-black/15 border border-[var(--card-border)] text-xs">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
                Emergências:
              </span>
              <span className="font-bold text-[var(--text-main)]">
                Defesa Civil: 199 | Bombeiros: 193
              </span>
            </div>

            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={() => setAlertaSelecionado(null)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

