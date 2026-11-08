"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Coordenadas, WikipediaResumo, NoticiaIBGE, CidadeHistorico, CondicoesMarinhas } from "@/types/weather";
import { CityMap } from "@/components/CityMap";
import {
  Map,
  BookOpen,
  Newspaper,
  ExternalLink,
  Calendar,
  Compass,
  Building2,
  Waves,
  LifeBuoy,
  Timer,
  Thermometer,
  Anchor,
  Megaphone,
  Sparkles,
  Globe,
  Zap,
  Utensils,
  Coffee,
  Sun,
  Snowflake,
  MessageCircle,
  Tag,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatarDataHoraBR } from "@/utils/dateFormat";

interface CityInsightsTabsProps {
  coordenadas: Coordenadas;
  municipio: string;
  uf: string;
  temperatura?: number;
  weatherCode?: number;
  wikipedia?: WikipediaResumo;
  noticiasIBGE?: NoticiaIBGE[];
  favoritos?: CidadeHistorico[];
  condicoesMarinhas?: CondicoesMarinhas | null;
  onSelecionarCidade?: (id: string, nome: string, uf: string, coordenadas?: Coordenadas) => void;
}

type TabTipo = "mapa" | "historia" | "noticias" | "anuncios" | "litoral";
type FiltroAnuncio = "todos" | "nacional" | "estadual" | "local" | "frio" | "calor";
type FiltroNoticia = "todas" | "ibge" | "ebc" | "clima" | "regional";

export default function CityInsightsTabs({
  coordenadas,
  municipio,
  uf,
  temperatura,
  weatherCode,
  wikipedia,
  noticiasIBGE = [],
  favoritos = [],
  condicoesMarinhas,
  onSelecionarCidade,
}: CityInsightsTabsProps) {
  const [tabAtiva, setTabAtiva] = useState<TabTipo>("mapa");
  const [filtroAnuncio, setFiltroAnuncio] = useState<FiltroAnuncio>("todos");
  const [filtroNoticia, setFiltroNoticia] = useState<FiltroNoticia>("todas");
  const [mounted, setMounted] = useState(false);
  const [isModalAnunciarAberto, setIsModalAnunciarAberto] = useState(false);
  const [enviadoFeedback, setEnviadoFeedback] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {/* ABA 3: NOTÍCIAS INTEGRADAS MULTICANAIS (IBGE, EBC, G1 CLIMA & REGIONAL) */}
        {tabAtiva === "noticias" && (() => {
          const totalIbge = noticiasIBGE.filter((n) => n.categoria === "ibge" || n.fonte === "ibge").length;
          const totalEbc = noticiasIBGE.filter((n) => n.categoria === "ebc" || n.fonte === "ebc").length;
          const totalClima = noticiasIBGE.filter((n) => n.categoria === "clima" || n.fonte === "clima").length;
          const totalRegional = noticiasIBGE.filter((n) => n.categoria === "regional" || n.fonte === "regional").length;

          const noticiasFiltradas = filtroNoticia === "todas"
            ? noticiasIBGE
            : noticiasIBGE.filter((n) => (n.categoria || n.fonte) === filtroNoticia);

          const getBadgeFonte = (fonte?: string) => {
            switch (fonte) {
              case "ebc":
                return { classe: "badge-emerald", label: "Agência Brasil" };
              case "clima":
                return { classe: "badge-teal", label: "G1 Natureza & Clima" };
              case "regional":
                return { classe: "badge-amber", label: `IBGE ${uf}` };
              default:
                return { classe: "badge-sky", label: "IBGE Cidades" };
            }
          };

          return (
            <div className="space-y-4">
              {/* Header com Filtros Interativos em Pílulas */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-sky-400 shrink-0" />
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                      Central de Notícias Oficiais & Meteorológicas
                    </h4>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Filtrar por canal oficial:
                  </span>
                </div>

                {/* Filtros em Pílulas */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setFiltroNoticia("todas")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      filtroNoticia === "todas"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    Todas ({noticiasIBGE.length})
                  </button>

                  {totalIbge > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiltroNoticia("ibge")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                        filtroNoticia === "ibge"
                          ? "bg-sky-500 text-white shadow-sm"
                          : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      🏛️ IBGE Cidades ({totalIbge})
                    </button>
                  )}

                  {totalEbc > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiltroNoticia("ebc")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                        filtroNoticia === "ebc"
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      🇧🇷 Agência Brasil ({totalEbc})
                    </button>
                  )}

                  {totalClima > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiltroNoticia("clima")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                        filtroNoticia === "clima"
                          ? "bg-teal-500 text-white shadow-sm"
                          : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      🌿 Clima & Natureza ({totalClima})
                    </button>
                  )}

                  {totalRegional > 0 && (
                    <button
                      type="button"
                      onClick={() => setFiltroNoticia("regional")}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                        filtroNoticia === "regional"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      📍 Estado ({uf}) ({totalRegional})
                    </button>
                  )}
                </div>
              </div>

              {/* Grid das Notícias Filtradas */}
              {noticiasFiltradas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {noticiasFiltradas.map((item) => {
                    const badge = getBadgeFonte(item.fonte);

                    return (
                      <a
                        key={item.id}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] hover:bg-black/10 dark:hover:bg-white/[0.07] border border-[var(--card-border)] transition-all flex flex-col justify-between group shadow-sm hover:-translate-y-0.5"
                      >
                        <div className="space-y-2">
                          {/* Imagem de Capa Opcional */}
                          {item.imagemUrl && (
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-black/10 relative">
                              <img
                                src={item.imagemUrl}
                                alt={item.titulo}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Cabeçalho da Notícia: Badge da Fonte + Data */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className={`${badge.classe} px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider`}>
                              {item.fonteNome || badge.label}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                              <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                              <span>{formatarDataHoraBR(item.data_publicacao)}</span>
                            </div>
                          </div>

                          {/* Título & Introdução */}
                          <h5 className="font-bold text-xs sm:text-sm text-[var(--text-main)] group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                            {item.titulo}
                          </h5>

                          <p className="text-[11px] text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                            {item.introducao}
                          </p>
                        </div>

                        {/* Rodapé do Card */}
                        <div className="flex items-center justify-between text-[11px] text-sky-400 font-medium mt-3 pt-2 border-t border-[var(--card-border)]">
                          <span>Ler matéria na íntegra</span>
                          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] p-6 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)]">
                  Nenhuma notícia encontrada para o filtro selecionado.
                </div>
              )}
            </div>
          );
        })()}

        {/* ABA: ANÚNCIOS & OPORTUNIDADES LOCAIS (MOCK MULTI-SEGMENTAÇÃO) */}
        {tabAtiva === "anuncios" && (() => {
          const tempNum = temperatura !== undefined ? Math.round(temperatura) : 24;

          const isChovendo = weatherCode !== undefined && [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode);
          const condicaoFrio = tempNum <= 22 || isChovendo;
          const condicaoCalor = tempNum >= 26 && !isChovendo;

          const mockAnuncios = [
            {
              id: "anuncio-nacional",
              tipo: "nacional" as FiltroAnuncio,
              categoria: "Seguro & Viagem",
              tipoBadge: "🇧🇷 Brasil Inteiro (Nacional)",
              badgeClasse: "badge-sky",
              anunciante: "ClimaProtect Seguros",
              titulo: "Seguro Residencial & Viagem com Proteção Meteorológica",
              descricao: "Proteja sua residência e suas viagens contra temporais, vendavais e cancelamentos por eventos climáticos extremos. Cobertura completa em todo o Brasil.",
              icone: <Globe className="w-5 h-5 text-sky-400" />,
              corFundo: "bg-sky-500/10 border-sky-500/25",
              ctaTexto: "Conhecer Cobertura Nacional",
              ctaLink: "#",
              isWhatsapp: false,
              ativoAgora: true,
            },
            {
              id: "anuncio-estadual",
              tipo: "estadual" as FiltroAnuncio,
              categoria: "Energia Solar & Sustentabilidade",
              tipoBadge: `📍 Estado de ${uf} (Regional)`,
              badgeClasse: "badge-amber",
              anunciante: `Rede Solar ${uf} Fotovoltaica`,
              titulo: `Economize até 95% na conta de luz com Energia Solar em ${uf}`,
              descricao: `Aproveite a alta taxa de irradiação solar no estado de ${uf}. Instalação rápida para residências, fazendas e comércios com parcelamento em até 60x.`,
              icone: <Zap className="w-5 h-5 text-amber-400" />,
              corFundo: "bg-amber-500/10 border-amber-500/25",
              ctaTexto: `Simular Economia em ${uf}`,
              ctaLink: "#",
              isWhatsapp: false,
              ativoAgora: true,
            },
            {
              id: "anuncio-local",
              tipo: "local" as FiltroAnuncio,
              categoria: "Gastronomia & Delivery Local",
              tipoBadge: `🎯 Exclusivo em ${municipio} - ${uf} (Hiperlocal)`,
              badgeClasse: "badge-emerald",
              anunciante: `Pizzaria & Choperia Villa ${municipio}`,
              titulo: `Tradição em massas artesanais e forno a lenha no centro de ${municipio}`,
              descricao: `Delivery expresso para todos os bairros de ${municipio}. Massa leve de fermentação natural. Peça hoje e ganhe sobremesa grátis no primeiro pedido!`,
              icone: <Utensils className="w-5 h-5 text-emerald-400" />,
              corFundo: "bg-emerald-500/10 border-emerald-500/25",
              ctaTexto: "Pedir pelo WhatsApp",
              ctaLink: `https://api.whatsapp.com/send?text=Olá! Vi o anúncio da Villa ${encodeURIComponent(municipio)} no ClimaBR e gostaria de ver o cardápio.`,
              isWhatsapp: true,
              ativoAgora: true,
            },
            {
              id: "anuncio-frio",
              tipo: "frio" as FiltroAnuncio,
              categoria: "Conforto & Cafeteria (Gatilho Climático)",
              tipoBadge: `❄️ Ativado no Frio & Chuva (< 21°C)`,
              badgeClasse: "badge-purple",
              anunciante: "Empório dos Caldos & Cafés Gourmet",
              titulo: "Tempo frio ou chuvoso? Aquecemos seu dia com fondue e cafés especiais",
              descricao: `Ideal para quando a temperatura cai em ${municipio}: sopas artesanais, chocolates quentes suíços e grãos selecionados entregues na sua porta com embalagem térmica.`,
              icone: <Coffee className="w-5 h-5 text-purple-400" />,
              corFundo: "bg-purple-500/10 border-purple-500/25",
              ctaTexto: "Ver Cardápio de Inverno",
              ctaLink: "#",
              isWhatsapp: false,
            },
            {
              id: "anuncio-calor",
              tipo: "calor" as FiltroAnuncio,
              categoria: "Lazer & Refrescância (Gatilho Climático)",
              tipoBadge: `☀️ Ativado no Calor & Sol (> 26°C)`,
              badgeClasse: "badge-orange",
              anunciante: "Gelateria & Parque das Águas Sol & Verão",
              titulo: "O calor chegou: refresque seu dia com sorvetes artesanais e piscina",
              descricao: `Dias de sol forte e calor em ${municipio} pedem gelato 100% natural, açaí premium e passaporte promocional para lazer e piscinas com a família.`,
              icone: <Sun className="w-5 h-5 text-orange-400" />,
              corFundo: "bg-orange-500/10 border-orange-500/25",
              ctaTexto: "Garantir Desconto de Verão",
              ctaLink: "#",
              isWhatsapp: false,
            },
          ];

          const anunciosFiltrados = filtroAnuncio === "todos"
            ? mockAnuncios
            : mockAnuncios.filter((a) => a.tipo === filtroAnuncio);

          return (
            <div className="space-y-4">
              {/* Header Explicativo com Filtros Interativos do Mock */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--card-border)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                      Mock do Sistema Inteligente de Anúncios do ClimaBR
                    </h4>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Filtre para visualizar os diferentes tipos de segmentação:
                  </span>
                </div>

                {/* Filtros em Pílulas */}
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setFiltroAnuncio("todos")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      filtroAnuncio === "todos"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    Todos ({mockAnuncios.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroAnuncio("nacional")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      filtroAnuncio === "nacional"
                        ? "bg-sky-500 text-white shadow-sm"
                        : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    🇧🇷 Brasil Inteiro
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroAnuncio("estadual")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      filtroAnuncio === "estadual"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    📍 Estado ({uf})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroAnuncio("local")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      filtroAnuncio === "local"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    🎯 Cidade ({municipio})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroAnuncio("frio")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      filtroAnuncio === "frio"
                        ? "bg-purple-500 text-white shadow-sm"
                        : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    ❄️ Clima Frio
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroAnuncio("calor")}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      filtroAnuncio === "calor"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "bg-black/10 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    ☀️ Clima Calor
                  </button>
                </div>
              </div>

              {/* Lista dos Cards de Anúncio Mockados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {anunciosFiltrados.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className={`p-4 rounded-2xl border ${anuncio.corFundo} backdrop-blur-md flex flex-col justify-between space-y-3 transition-all hover:-translate-y-0.5 shadow-sm`}
                  >
                    <div className="space-y-2">
                      {/* Topo do Card: Badge do Tipo e Categoria */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`${anuncio.badgeClasse} px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider`}>
                          {anuncio.tipoBadge}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          Patrocinado • {anuncio.categoria}
                        </span>
                      </div>

                      {/* Header da Marca & Título */}
                      <div className="flex items-start gap-3 pt-1">
                        <div className="p-2 rounded-xl bg-black/10 dark:bg-white/10 shrink-0 mt-0.5">
                          {anuncio.icone}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">
                            {anuncio.anunciante}
                          </p>
                          <h5 className="text-sm font-bold text-[var(--text-main)] leading-snug">
                            {anuncio.titulo}
                          </h5>
                        </div>
                      </div>

                      {/* Descrição do Produto ou Serviço */}
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">
                        {anuncio.descricao}
                      </p>
                    </div>

                    {/* Botão de Ação / CTA Demonstrativo (Sem Ação Externa) */}
                    <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
                      <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Exemplo Demonstrativo
                      </span>

                      <button
                        type="button"
                        className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all select-none cursor-default shrink-0 ${
                          anuncio.isWhatsapp
                            ? "bg-emerald-600/90 text-white"
                            : "bg-black/10 dark:bg-white/10 text-[var(--text-main)]"
                        }`}
                      >
                        {anuncio.isWhatsapp ? (
                          <>
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{anuncio.ctaTexto}</span>
                          </>
                        ) : (
                          <>
                            <span>{anuncio.ctaTexto}</span>
                            <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Banner de Captação para Novos Anunciantes Locais */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3.5 text-center sm:text-left">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Megaphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h5 className="font-extrabold text-sm text-[var(--text-main)]">
                      Quer divulgar sua empresa em {municipio} ou no estado de {uf}?
                    </h5>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tenha visibilidade diária para moradores, produtores rurais e turistas que consultam a previsão meteorológica no ClimaBR.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalAnunciarAberto(true);
                    setEnviadoFeedback(false);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/25 shrink-0 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Anunciar no ClimaBR</span>
                </button>
              </div>

              {/* Modal / Dialog com Formulário de Anúncio Demonstrativo */}
              {isModalAnunciarAberto && mounted && createPortal(
                <div
                  role="dialog"
                  aria-modal="true"
                  className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
                  onClick={() => setIsModalAnunciarAberto(false)}
                >
                  <div
                    style={cardStyle}
                    className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 md:p-7 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Botão Fechar */}
                    <button
                      type="button"
                      onClick={() => setIsModalAnunciarAberto(false)}
                      className="absolute top-4 right-4 p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Header do Formulário */}
                    <div className="space-y-1 pr-8">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                          Anunciar no ClimaBR
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        Preencha os dados do seu negócio para simular uma proposta comercial.
                      </p>
                    </div>

                    {enviadoFeedback ? (
                      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-fadeIn">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-[var(--text-main)]">
                            Simulação de Proposta Enviada!
                          </h4>
                          <p className="text-xs text-[var(--text-muted)]">
                            Este é um formulário de teste/demonstração. Nenhuma mensagem ou disparo externo foi realizado.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsModalAnunciarAberto(false)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all cursor-pointer"
                        >
                          Concluir
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setEnviadoFeedback(true);
                        }}
                        className="space-y-3.5"
                      >
                        {/* Nome da Empresa / Responsável */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[var(--text-main)]">
                            Nome da Empresa ou Marca
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Pousada Recanto, Restaurante Central..."
                            defaultValue=""
                            style={{
                              backgroundColor: "var(--input-bg)",
                              borderColor: "var(--input-border)",
                              color: "var(--input-text)",
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Ramo e Segmentação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-main)]">
                              Segmentação Desejada
                            </label>
                            <select
                              defaultValue="local"
                              style={{
                                backgroundColor: "var(--input-bg)",
                                borderColor: "var(--input-border)",
                                color: "var(--input-text)",
                              }}
                              className="w-full px-3 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="local">🎯 Cidade ({municipio} - {uf})</option>
                              <option value="estadual">📍 Estado ({uf})</option>
                              <option value="nacional">🇧🇷 Brasil Inteiro</option>
                              <option value="clima">⚡ Gatilho de Clima (Chuva/Calor)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-main)]">
                              Ramo de Atuação
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Alimentação, Solar, Agro..."
                              style={{
                                backgroundColor: "var(--input-bg)",
                                borderColor: "var(--input-border)",
                                color: "var(--input-text)",
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Contato */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-main)]">
                              Telefone / WhatsApp
                            </label>
                            <input
                              type="text"
                              placeholder="(00) 00000-0000"
                              style={{
                                backgroundColor: "var(--input-bg)",
                                borderColor: "var(--input-border)",
                                color: "var(--input-text)",
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-[var(--text-main)]">
                              E-mail Comercial
                            </label>
                            <input
                              type="email"
                              placeholder="contato@empresa.com.br"
                              style={{
                                backgroundColor: "var(--input-bg)",
                                borderColor: "var(--input-border)",
                                color: "var(--input-text)",
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Mensagem / Proposta */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-[var(--text-main)]">
                            Mensagem ou Observações
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Descreva seu produto ou serviço e como gostaria de divulgar..."
                            style={{
                              backgroundColor: "var(--input-bg)",
                              borderColor: "var(--input-border)",
                              color: "var(--input-text)",
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          />
                        </div>

                        {/* Rodapé com botão sem ação externa */}
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsModalAnunciarAberto(false)}
                            className="px-4 py-2.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/15 text-xs font-semibold text-[var(--text-muted)] cursor-pointer text-center"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/25 cursor-pointer text-center"
                          >
                            Enviar Proposta (Simulação)
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>,
                document.body
              )}
            </div>
          );
        })()}

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
