"use client";

import React, { useState } from "react";
import { Coordenadas, WikipediaResumo, NoticiaIBGE, CidadeHistorico } from "@/types/weather";
import { CityMap } from "@/components/CityMap";
import { Map, BookOpen, Newspaper, ExternalLink, Calendar, Compass, Building2 } from "lucide-react";

interface CityInsightsTabsProps {
  coordenadas: Coordenadas;
  municipio: string;
  uf: string;
  wikipedia?: WikipediaResumo;
  noticiasIBGE?: NoticiaIBGE[];
  favoritos?: CidadeHistorico[];
  onSelecionarCidade?: (id: string, nome: string, uf: string, coordenadas?: Coordenadas) => void;
}

type TabTipo = "mapa" | "historia" | "noticias";

export default function CityInsightsTabs({
  coordenadas,
  municipio,
  uf,
  wikipedia,
  noticiasIBGE = [],
  favoritos = [],
  onSelecionarCidade,
}: CityInsightsTabsProps) {
  const [tabAtiva, setTabAtiva] = useState<TabTipo>("mapa");

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderColor: "var(--card-border)",
    boxShadow: "var(--card-shadow)",
  };

  return (
    <div
      style={cardStyle}
      className="w-full rounded-3xl border backdrop-blur-xl overflow-hidden transition-all duration-300 shadow-xl"
    >
      {/* Barra de Abas (Tabs Header) */}
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 sm:px-6 pt-4 pb-2 bg-black/5 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-400" />
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
            Sobre a Cidade
          </h3>
        </div>

        {/* Botões de Seleção de Abas */}
        <div className="flex items-center gap-1 sm:gap-2 bg-black/10 dark:bg-white/5 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setTabAtiva("mapa")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              tabAtiva === "mapa"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => setTabAtiva("historia")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              tabAtiva === "historia"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>História</span>
          </button>

          <button
            type="button"
            onClick={() => setTabAtiva("noticias")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              tabAtiva === "noticias"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Notícias</span>
            {noticiasIBGE.length > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${tabAtiva === "noticias" ? "bg-white/25 text-white" : "badge-sky"}`}>
                {noticiasIBGE.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico da Aba Ativa */}
      <div className="p-4 sm:p-6">
        {/* ABA 1: MAPA INTERATIVO */}
        {tabAtiva === "mapa" && (
          <div className="space-y-4">
            <CityMap
              coordenadas={coordenadas}
              municipio={municipio}
              uf={uf}
              favoritos={favoritos}
              onSelecionarCidade={onSelecionarCidade}
            />
            <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] gap-2 pt-1 border-t border-[var(--card-border)]">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                Coordenadas Cartográficas IBGE: {coordenadas.latitude.toFixed(4)}°, {coordenadas.longitude.toFixed(4)}°
              </span>
              <span className="opacity-80">Cartografia via OpenStreetMap & IBGE</span>
            </div>
          </div>
        )}

        {/* ABA 2: HISTÓRIA & WIKIPEDIA */}
        {tabAtiva === "historia" && (
          <div>
            {wikipedia ? (
              <div className="flex flex-col md:flex-row gap-5 items-start">
                {wikipedia.imagemUrl && (
                  <div className="w-full md:w-56 h-48 rounded-2xl overflow-hidden flex-shrink-0 relative shadow-md border border-[var(--card-border)] bg-black/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={wikipedia.imagemUrl}
                      alt={wikipedia.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-main)]">
                      {wikipedia.titulo}
                    </h4>
                    {wikipedia.descricao && (
                      <p className="text-xs text-sky-400 font-medium">
                        {wikipedia.descricao}
                      </p>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    {wikipedia.extrato}
                  </p>

                  {wikipedia.paginaUrl && (
                    <a
                      href={wikipedia.paginaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors mt-2"
                    >
                      <span>Ler artigo completo na Wikipédia</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Resumo enciclopédico não disponível para este município no momento.
              </div>
            )}
          </div>
        )}

        {/* ABA 3: NOTÍCIAS DO IBGE */}
        {tabAtiva === "noticias" && (
          <div className="space-y-3">
            {noticiasIBGE.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {noticiasIBGE.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] hover:bg-black/10 dark:hover:bg-white/[0.07] border border-[var(--card-border)] transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                        <Calendar className="w-3 h-3 text-sky-400" />
                        <span>{item.data_publicacao}</span>
                      </div>
                      <h5 className="font-semibold text-xs text-[var(--text-main)] group-hover:text-sky-400 transition-colors line-clamp-2">
                        {item.titulo}
                      </h5>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                        {item.introducao}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-sky-400 font-medium mt-3 pt-2 border-t border-[var(--card-border)]">
                      <span>Ver matéria oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Nenhuma notícia recente cadastrada para este estado no IBGE Notícias.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
