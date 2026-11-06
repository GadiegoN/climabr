import React, { useState, useEffect, useCallback } from "react";
import { DadosClimaCidade } from "@/types/weather";
import { mapearCodigoClima } from "@/utils/weatherCodes";
import { WeatherIcon } from "./WeatherIcon";
import {
  X,
  Hourglass,
  Calendar,
  CloudRain,
  Loader2,
  TrendingUp,
  TrendingDown,
  Equal,
} from "lucide-react";

interface PontoHistorico {
  label: string;
  ano: number;
  max: number;
  min: number;
  chuva: number;
  codigoClima: number;
}

interface TimeCapsuleModalProps {
  cidade: DadosClimaCidade;
  isOpen: boolean;
  onClose: () => void;
}

export function TimeCapsuleModal({
  cidade,
  isOpen,
  onClose,
}: TimeCapsuleModalProps) {
  const [loading, setLoading] = useState(false);
  const [marcos, setMarcos] = useState<PontoHistorico[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const carregarLinhaDoTempo = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const anoAtual = new Date().getFullYear();
    const mesDia = new Date().toISOString().slice(5, 10); // MM-DD

    // Anos da linha do tempo: 5, 10, 15, 20 e 30 anos atrás
    const pontosConfig = [
      { label: "Há 5 anos", ano: anoAtual - 5 },
      { label: "Há 10 anos", ano: anoAtual - 10 },
      { label: "Há 15 anos", ano: anoAtual - 15 },
      { label: "Há 20 anos", ano: anoAtual - 20 },
      { label: "Há 30 anos", ano: anoAtual - 30 },
    ];

    try {
      const requisicoes = pontosConfig.map(async (p) => {
        const dataIso = `${p.ano}-${mesDia}`;
        const params = new URLSearchParams({
          latitude: cidade.coordenadas.latitude.toFixed(6),
          longitude: cidade.coordenadas.longitude.toFixed(6),
          start_date: dataIso,
          end_date: dataIso,
          daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
          timezone: "auto",
        });

        const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`);
        if (!res.ok) throw new Error();
        const json = await res.json();

        return {
          label: p.label,
          ano: p.ano,
          max: json.daily?.temperature_2m_max?.[0] ?? 0,
          min: json.daily?.temperature_2m_min?.[0] ?? 0,
          chuva: json.daily?.precipitation_sum?.[0] ?? 0,
          codigoClima: json.daily?.weather_code?.[0] ?? 0,
        };
      });

      const resultados = await Promise.all(requisicoes);
      setMarcos(resultados);
    } catch {
      setErro("Não foi possível carregar alguns pontos históricos desta localidade.");
    } finally {
      setLoading(false);
    }
  }, [cidade.coordenadas.latitude, cidade.coordenadas.longitude]);

  useEffect(() => {
    if (isOpen) {
      carregarLinhaDoTempo();
    }
  }, [isOpen, carregarLinhaDoTempo]);

  if (!isOpen) return null;

  const tempAtualHoje = cidade.clima.temperature;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
          color: "var(--text-main)",
        }}
        className="relative w-full max-w-2xl rounded-3xl border p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6"
      >
        {/* Cabeçalho do Modal */}
        <div
          className="flex items-center justify-between border-b pb-4"
          style={{ borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Linha do Tempo do Clima
              </h2>
              <p style={{ color: "var(--text-muted)" }} className="text-xs">
                O clima deste mesmo dia ao longo da história em {cidade.municipio} ({cidade.uf})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ponto Zero: HOJE (Referência) */}
        <div
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderColor: "rgba(16, 185, 129, 0.4)",
          }}
          className="p-4 rounded-2xl border flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block">
                Momento Atual (Referência)
              </span>
              <span className="text-sm font-semibold">Hoje ({new Date().getFullYear()})</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-500">{Math.round(tempAtualHoje)}°C</span>
            <span style={{ color: "var(--text-muted)" }} className="text-xs block">
              Temp. Atual
            </span>
          </div>
        </div>

        {/* Linha do Tempo (Timeline) */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
            <p style={{ color: "var(--text-muted)" }} className="text-sm font-medium">
              Viajando na história climática de {cidade.municipio}...
            </p>
          </div>
        ) : erro ? (
          <div className="p-4 text-center text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium">
            {erro}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-purple-500 before:to-indigo-500">
            {marcos.map((m) => {
              const cond = mapearCodigoClima(m.codigoClima, 1);
              const diff = (tempAtualHoje - m.max).toFixed(1);
              const isMaisQuenteHoje = Number(diff) > 0.5;
              const isMaisFrioHoje = Number(diff) < -0.5;

              return (
                <div key={m.ano} className="relative group">
                  {/* Nodo da Linha do Tempo */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full border-2 border-purple-400 bg-slate-950 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                  </div>

                  {/* Conteúdo do Marco Histórico */}
                  <div
                    style={{
                      backgroundColor: "var(--chip-bg)",
                      borderColor: "var(--chip-border)",
                    }}
                    className="p-4 rounded-2xl border transition-all hover:-translate-y-0.5 shadow-sm space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2" style={{ borderColor: "var(--card-border)" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-purple-400">{m.ano}</span>
                        <span style={{ color: "var(--text-muted)" }} className="text-xs font-semibold">
                          ({m.label})
                        </span>
                      </div>

                      {/* Badge de Comparação Térmica com Hoje */}
                      <div className="flex items-center gap-1 text-xs font-bold">
                        {isMaisQuenteHoje ? (
                          <span className="text-rose-400 flex items-center gap-0.5 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                            <TrendingUp className="w-3 h-3" /> Hoje está +{diff}°C
                          </span>
                        ) : isMaisFrioHoje ? (
                          <span className="text-sky-400 flex items-center gap-0.5 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                            <TrendingDown className="w-3 h-3" /> Hoje está {diff}°C
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Equal className="w-3 h-3" /> Quase igual a hoje
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dados Climáticos daquele Ano */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          <WeatherIcon tipo={cond.icone} className="w-6 h-6 text-purple-300" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold block">{cond.descricao}</span>
                          <span style={{ color: "var(--text-muted)" }} className="text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} de {m.ano}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black">
                          {Math.round(m.max)}°C{" "}
                          <span style={{ color: "var(--text-muted)" }} className="text-xs font-normal">
                            / {Math.round(m.min)}°C
                          </span>
                        </div>
                        <div className="text-[11px] text-sky-400 flex items-center justify-end gap-1 font-medium">
                          {m.chuva > 0 ? (
                            <>
                              <CloudRain className="w-3 h-3" />
                              <span>{m.chuva} mm</span>
                            </>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>Sem chuva</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
