"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  AlertaINMET,
  AlertaCEMADEN,
  RiscoFogo,
  QualidadeArDados,
  DadosElNino,
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
  Thermometer,
  CloudRain,
  TrendingUp,
  Globe,
  Compass,
  Calendar,
} from "lucide-react";
import { formatarIntervaloVigencia, formatarDataHoraBR } from "@/utils/dateFormat";

interface EnvironmentalRadarProps {
  municipio: string;
  uf: string;
  alertasINMET?: AlertaINMET[];
  alertasCEMADEN?: AlertaCEMADEN[];
  riscoFogo?: RiscoFogo;
  qualidadeAr?: QualidadeArDados;
  elNino?: DadosElNino;
}

export default function EnvironmentalRadar({
  municipio,
  uf,
  alertasINMET = [],
  alertasCEMADEN = [],
  riscoFogo,
  qualidadeAr,
  elNino,
}: EnvironmentalRadarProps) {
  const [alertaSelecionado, setAlertaSelecionado] = useState<AlertaINMET | null>(null);
  const [isElNinoModalAberto, setIsElNinoModalAberto] = useState(false);
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
      className="w-full rounded-2xl sm:rounded-3xl border backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 shadow-xl space-y-4 sm:space-y-5"
    >
      {/* 1. Header do Radar com Status Global */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm sm:text-base text-[var(--text-main)] flex items-center gap-2">
              <span>Radar Ambiental & Defesa Civil</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] truncate sm:whitespace-normal">
              Monitoramento integrado: INMET, CEMADEN e Fogo
            </p>
          </div>
        </div>

        {/* Badge de Status Geral */}
        <div className="self-start sm:self-auto shrink-0">
          {situacaoCritica ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold badge-amber flex items-center gap-1.5 shadow-sm animate-pulse">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Avisos Oficiais Vigentes</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold badge-emerald flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Condições Estáveis</span>
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
                {alertasCEMADEN[0].dataHoraCriacao && (
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Emitido: {formatarDataHoraBR(alertasCEMADEN[0].dataHoraCriacao)}
                  </p>
                )}
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
                <span className="text-[var(--text-muted)]">Potencial Solar:</span>
                <span className="font-semibold text-amber-500">
                  {qualidadeAr?.radiacaoSolarKwh !== undefined
                    ? `${qualidadeAr.radiacaoSolarKwh} kWh/m²`
                    : qualidadeAr?.pm25 !== undefined
                    ? `${qualidadeAr.pm25} µg/m³`
                    : "N/D"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--card-border)] flex items-center gap-1">
            <Info className="w-3 h-3 text-teal-500 flex-shrink-0" />
            <span>Copernicus & Solar Fotovoltaico</span>
          </div>
        </div>
      </div>

      {/* 2.5. MONITOR MACROCLIMÁTICO DO OCEANO PACÍFICO (EL NIÑO / LA NIÑA - NOAA) */}
      {elNino && (
        <div className="pt-2 border-t border-[var(--card-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)]">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0 mt-0.5 sm:mt-0">
                <Waves className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    Pacífico & Macroclima:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${elNino.badgeClass}`}>
                    {elNino.fase} {elNino.intensidade !== "Neutro" ? elNino.intensidade : ""} ({elNino.anomaliaAtual > 0 ? "+" : ""}{elNino.anomaliaAtual.toFixed(1)}°C)
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] truncate sm:whitespace-normal">
                  Tendência para {uf}: <span className="text-[var(--text-main)] font-semibold">{elNino.impactoRegional.titulo}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsElNinoModalAberto(true)}
              className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              <span>Ver Gráficos & Efeitos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. MODAL DE DETALHES DE ALERTA DO INMET */}
      {alertaSelecionado && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            style={cardStyle}
            className="w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto"
          >
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setAlertaSelecionado(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho do Alerta */}
            <div className="space-y-1.5 pr-8">
              <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getSeveridadeBadge(alertaSelecionado.severidade)}`}>
                {alertaSelecionado.severidade}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] leading-snug">
                {alertaSelecionado.evento}
              </h3>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Vigência: {formatarIntervaloVigencia(alertaSelecionado.inicio, alertaSelecionado.fim)}</span>
              </p>
            </div>

            {/* Riscos Potenciais */}
            {alertaSelecionado.riscos && alertaSelecionado.riscos.length > 0 && (
              <div className="space-y-2 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl badge-amber border">
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
              <div className="space-y-2 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/10 dark:bg-white/5 border border-[var(--card-border)]">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 p-3 rounded-xl bg-black/15 border border-[var(--card-border)] text-xs">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <PhoneCall className="w-3.5 h-3.5 text-sky-400 shrink-0" />
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

      {/* 4. MODAL DETALHADO DO EL NIÑO / LA NIÑA (NOAA ONI) */}
      {isElNinoModalAberto && elNino && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div
            style={cardStyle}
            className="w-full max-w-xl rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto"
          >
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setIsElNinoModalAberto(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho */}
            <div className="space-y-1.5 pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${elNino.badgeClass}`}>
                  {elNino.fase} {elNino.intensidade !== "Neutro" ? elNino.intensidade : ""}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  Trimestre: {elNino.periodoAtual}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2 leading-snug">
                <Waves className="w-5 h-5 text-sky-400 shrink-0" />
                <span>Monitoramento ENSO — El Niño & La Niña</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {elNino.descricao}
              </p>
            </div>

            {/* Termômetro / Barra de Anomalia do Pacífico */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-2.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="font-semibold text-[var(--text-muted)]">
                  Anomalia Térmica do Pacífico Equatorial:
                </span>
                <span className="font-bold text-sm text-[var(--text-main)] shrink-0">
                  {elNino.anomaliaAtual > 0 ? "+" : ""}{elNino.anomaliaAtual.toFixed(2)}°C
                </span>
              </div>

              {/* Barra de Escala: -3°C (La Niña) a +3°C (El Niño) */}
              <div className="relative pt-3 pb-1">
                <div className="w-full h-3 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 to-rose-500 opacity-80" />
                {/* Marcador da anomalia atual */}
                {(() => {
                  const pct = Math.max(0, Math.min(100, ((elNino.anomaliaAtual + 3) / 6) * 100));
                  return (
                    <div
                      className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${pct}%` }}
                    >
                      <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-md" />
                    </div>
                  );
                })()}
                <div className="flex justify-between text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">
                  <span>-3.0° (La Niña)</span>
                  <span>0.0° (Neutro)</span>
                  <span>+3.0° (El Niño)</span>
                </div>
              </div>
            </div>

            {/* Impactos Regionais em Destaque para a Cidade / UF Atual */}
            <div className="space-y-2.5 sm:space-y-3">
              <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-sky-400 shrink-0" />
                Impactos em {municipio} ({uf}) — {elNino.impactoRegional.regiao}
              </h4>

              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-[var(--text-main)] leading-relaxed">
                <p className="font-semibold text-sky-400 mb-1">
                  {elNino.impactoRegional.titulo}
                </p>
                <p className="text-[var(--text-muted)]">
                  {elNino.impactoRegional.descricao}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Efeitos na Chuva:</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {elNino.impactoRegional.efeitosChuva}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Efeitos na Temperatura:</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {elNino.impactoRegional.efeitosTemperatura}
                  </p>
                </div>
              </div>
            </div>

            {/* Histórico dos Últimos 6 Trimestres */}
            {elNino.historicoRecente && elNino.historicoRecente.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[var(--card-border)]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Evolução Recente (Últimos 6 Trimestres):
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                  {elNino.historicoRecente.map((ponto, i) => (
                    <div
                      key={i}
                      className="p-1.5 sm:p-2 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] text-center space-y-0.5"
                    >
                      <div className="text-[9px] sm:text-[10px] text-[var(--text-muted)]">
                        {ponto.periodo}
                      </div>
                      <div
                        className={`text-xs font-bold ${
                          ponto.anomalia >= 0.5
                            ? "text-rose-500"
                            : ponto.anomalia <= -0.5
                            ? "text-blue-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {ponto.anomalia > 0 ? "+" : ""}{ponto.anomalia.toFixed(2)}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rodapé Científico */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--card-border)]">
              <span>Fonte: NOAA CPC / NCEP</span>
              <button
                type="button"
                onClick={() => setIsElNinoModalAberto(false)}
                className="py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

