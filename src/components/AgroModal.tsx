"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DadosClimaCidade } from "@/types/weather";
import {
  X,
  Sprout,
  Droplets,
  Thermometer,
  Wind,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

interface AgroModalProps {
  cidade: DadosClimaCidade;
  isOpen: boolean;
  onClose: () => void;
}

export function AgroModal({ cidade, isOpen, onClose }: AgroModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const agro = cidade.agro;
  const vento = cidade.clima.windspeed;
  const umidadeAr = cidade.clima.relative_humidity ?? 50;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
        }}
        className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border p-4 sm:p-6 md:p-7 space-y-4 sm:space-y-5 max-h-[88vh] overflow-y-auto custom-scrollbar shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar no Canto Superior */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel agro"
          className="absolute top-4 right-4 p-1.5 sm:p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-start gap-3 pr-8">
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Sprout className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-[var(--text-main)] truncate">
                Painel Agroclimatológico & Solo
              </h3>
              <span className="badge-emerald px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold inline-block shrink-0">
                FAO-56
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate sm:whitespace-normal">
              Monitoramento agronômico e umidade para {cidade.municipio} - {cidade.uf}
            </p>
          </div>
        </div>

        {agro ? (
          <div className="space-y-3.5 sm:space-y-4">
            {/* 1. Grid das 3 Métricas Vitais de Solo e Demanda Hídrica */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Card 1: Umidade do Solo Superficial */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs text-sky-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 shrink-0" />
                    Umidade Solo
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">0-1 cm</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
                    {agro.umidadeSoloPct}%
                  </p>
                  {/* Barra de Umidade */}
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(10, agro.umidadeSoloPct))}%`,
                        backgroundColor:
                          agro.umidadeSoloPct > 45
                            ? "#0ea5e9"
                            : agro.umidadeSoloPct >= 25
                            ? "#10b981"
                            : "#f59e0b",
                      }}
                    />
                  </div>
                  <span className={`${agro.badgeIrrigacao} text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1`}>
                    {agro.statusIrrigacao}
                  </span>
                </div>
              </div>

              {/* Card 2: Temperatura do Solo */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 shrink-0" />
                    Temp. do Solo
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">Superfície</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
                    {agro.temperaturaSolo.toFixed(1)}°C
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    Ambiente: {Math.round(cidade.clima.temperature)}°C
                  </p>
                  <span className="text-[10px] text-emerald-500 font-semibold block truncate">
                    {agro.temperaturaSolo >= 18 && agro.temperaturaSolo <= 30
                      ? "● Faixa ideal p/ raízes"
                      : "● Atenção à germinação"}
                  </span>
                </div>
              </div>

              {/* Card 3: Evapotranspiração de Referência */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 shrink-0" />
                    Consumo ET0
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">Hoje</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
                    {agro.et0Hoje.toFixed(1)} <span className="text-xs font-normal">mm</span>
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    Demanda de água da cultura
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium block truncate">
                    {agro.et0Hoje > 4.0 ? "Evaporação alta (repor água)" : "Evaporação amena"}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Banner de Pulverização Agrícola e Deriva */}
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                  <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Aplicação de Defensivos & Pulverização:</span>
                </div>
                <span className={`${agro.badgePulverizacao} text-[10px] sm:text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full`}>
                  {agro.statusPulverizacao}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {agro.recomendacaoPulverizacao}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[10px] sm:text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--card-border)]">
                <span>Vento atual: <strong>{Math.round(vento)} km/h</strong></span>
                <span>Umidade: <strong>{umidadeAr}%</strong></span>
                <span>Ideal: 3 a 10 km/h</span>
              </div>
            </div>

            {/* 3. Previsão Semanal da Evapotranspiração (Demanda Hídrica) */}
            {agro.et0Semana.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                    Demanda Hídrica Diária (ET0 mm):
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">7 dias</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                  {agro.et0Semana.map((item, idx) => {
                    const dataObj = new Date(`${item.data}T12:00:00`);
                    const diaSemana = idx === 0 ? "Hoje" : dataObj.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
                    return (
                      <div
                        key={item.data}
                        className="p-2 sm:p-2.5 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)] text-center space-y-0.5 sm:space-y-1"
                      >
                        <p className="text-[10px] font-bold text-[var(--text-muted)] capitalize">
                          {diaSemana}
                        </p>
                        <p className="text-xs sm:text-sm font-black text-[var(--text-main)]">
                          {item.et0} <span className="text-[9px] font-normal">mm</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">
            Dados de saúde do solo não disponíveis para estas coordenadas no momento.
          </div>
        )}

        {/* Rodapé com Atribuição */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-[11px] sm:text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--card-border)]">
          <span className="flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            FAO-56 & Open-Meteo Land Surface
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 text-xs font-bold text-[var(--text-main)] cursor-pointer transition-all text-center"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

