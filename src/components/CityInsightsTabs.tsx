"use client";

import React, { useState } from "react";
import { Coordenadas, WikipediaResumo, NoticiaIBGE, CidadeHistorico, CondicoesMarinhas } from "@/types/weather";
import { CityMap } from "@/components/CityMap";
import { Map, BookOpen, Newspaper, ExternalLink, Calendar, Compass, Building2, Waves, LifeBuoy, Timer, Thermometer, Anchor, Megaphone, Sparkles } from "lucide-react";
import { formatarDataHoraBR } from "@/utils/dateFormat";

interface CityInsightsTabsProps {
  coordenadas: Coordenadas;
  municipio: string;
  uf: string;
  wikipedia?: WikipediaResumo;
  noticiasIBGE?: NoticiaIBGE[];
  favoritos?: CidadeHistorico[];
  condicoesMarinhas?: CondicoesMarinhas | null;
  onSelecionarCidade?: (id: string, nome: string, uf: string, coordenadas?: Coordenadas) => void;
}

type TabTipo = "mapa" | "historia" | "noticias" | "anuncios" | "litoral";

export default function CityInsightsTabs({
  coordenadas,
  municipio,
  uf,
  wikipedia,
  noticiasIBGE = [],
  favoritos = [],
  condicoesMarinhas,
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
      {/* Barra de Abas (Tabs Header Responsivo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--card-border)] px-4 sm:px-6 pt-4 pb-3 gap-3 bg-black/5 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 shrink-0">
          <Building2 className="w-5 h-5 text-sky-400" />
          <h3 className="font-bold text-sm sm:text-base text-[var(--text-main)]">
            Sobre a Cidade
          </h3>
        </div>

        {/* Botões de Seleção de Abas em Linha com Scroll Horizontal Suave no Mobile */}
        <div className="flex items-center gap-1 sm:gap-2 bg-black/10 dark:bg-white/5 p-1 rounded-2xl overflow-x-auto max-w-full custom-scrollbar flex-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setTabAtiva("mapa")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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

          {/* 📢 Aba de Anúncios & Publicidade */}
          <button
            type="button"
            onClick={() => setTabAtiva("anuncios")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              tabAtiva === "anuncios"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Anúncios</span>
          </button>

          {/* 🌊 Aba Condicional: Litoral & Marés (Apenas para Cidades Costeiras) */}
          {condicoesMarinhas && (
            <button
              type="button"
              onClick={() => setTabAtiva("litoral")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                tabAtiva === "litoral"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-cyan-300" />
              <span>Litoral</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </button>
          )}
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
                        <span>{formatarDataHoraBR(item.data_publicacao)}</span>
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

        {/* ABA: ANÚNCIOS & OPORTUNIDADES LOCAIS */}
        {tabAtiva === "anuncios" && (
          <div className="space-y-4">
            <div className="p-8 sm:p-10 rounded-3xl bg-black/5 dark:bg-white/[0.02] border border-dashed border-[var(--card-border)] text-center flex flex-col items-center justify-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-sm">
                <Megaphone className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                  Espaço para Anúncios & Negócios Locais
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  Em breve: espaço dedicado para divulgação de comércio, serviços, turismo e eventos em <strong>{municipio} - {uf}</strong> e região.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <span className="badge-sky text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Espaço Publicitário Reservado</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: CONDIÇÕES MARINHAS & LITORAL (Condicional) */}
        {tabAtiva === "litoral" && condicoesMarinhas && (
          <div className="space-y-4">
            {/* Banner de Condição Geral e Segurança */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3.5 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-[var(--text-main)]">
                    Condição do Mar:
                  </h4>
                  <span className={`${condicoesMarinhas.badgeCor} text-xs font-black uppercase px-2.5 py-0.5 rounded-full inline-block`}>
                    {condicoesMarinhas.condicaoBanho}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {condicoesMarinhas.descricaoBanho}
                </p>
              </div>
            </div>

            {/* Grid 4 Métricas Oceânicas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Métrica 1: Altura das Ondas */}
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
                  <Waves className="w-4 h-4" />
                  <span>Altura das Ondas</span>
                </div>
                <p className="text-xl font-black text-[var(--text-main)]">
                  {condicoesMarinhas.alturaOnda.toFixed(1)} <span className="text-xs font-normal">m</span>
                </p>
                {condicoesMarinhas.maxOndaHoje && (
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Pico hoje: {condicoesMarinhas.maxOndaHoje.toFixed(1)}m
                  </p>
                )}
              </div>

              {/* Métrica 2: Temperatura da Água */}
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                  <Thermometer className="w-4 h-4" />
                  <span>Água do Mar</span>
                </div>
                <p className="text-xl font-black text-[var(--text-main)]">
                  {condicoesMarinhas.temperaturaAgua != null
                    ? `${condicoesMarinhas.temperaturaAgua.toFixed(1)}°C`
                    : "Em análise"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Superfície oceânica
                </p>
              </div>

              {/* Métrica 3: Período entre Ondas */}
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <Timer className="w-4 h-4" />
                  <span>Período da Onda</span>
                </div>
                <p className="text-xl font-black text-[var(--text-main)]">
                  {condicoesMarinhas.periodoOnda.toFixed(1)} <span className="text-xs font-normal">s</span>
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {condicoesMarinhas.periodoOnda >= 10 ? "Ondulação longa / potente" : "Ondas curtas de vento"}
                </p>
              </div>

              {/* Métrica 4: Direção da Ondulação */}
              <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold">
                  <Anchor className="w-4 h-4" />
                  <span>Direção da Onda</span>
                </div>
                <p className="text-xl font-black text-[var(--text-main)]">
                  {condicoesMarinhas.direcaoOnda}°
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {condicoesMarinhas.direcaoOnda >= 45 && condicoesMarinhas.direcaoOnda < 135
                    ? "Leste (E)"
                    : condicoesMarinhas.direcaoOnda >= 135 && condicoesMarinhas.direcaoOnda < 225
                    ? "Sul / Sudeste (S/SE)"
                    : condicoesMarinhas.direcaoOnda >= 225 && condicoesMarinhas.direcaoOnda < 315
                    ? "Oeste / Sudoeste"
                    : "Norte / Nordeste"}
                </p>
              </div>
            </div>

            {/* Atribuição Rodapé */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--card-border)]">
              <span className="flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-sky-400" />
                Modelagem Oceânica Copernicus Marine & Open-Meteo
              </span>
              <span className="opacity-80">Dados em tempo real para o litoral</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
