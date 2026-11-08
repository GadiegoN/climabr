"use client";

import React, { useState } from "react";
import {
  CloudSunRain,
  ShieldCheck,
  Radio,
  ExternalLink,
  Waves,
  Sprout,
  Swords,
  Hourglass,
  MapPin,
  Heart,
  Globe,
  Info,
  Lock,
} from "lucide-react";
import { PrivacyModal } from "./PrivacyModal";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const cardStyle = {
    borderColor: "var(--card-border)",
    color: "var(--text-muted)",
  };

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      style={cardStyle}
      className="w-full border-t mt-12 sm:mt-16 pt-10 sm:pt-14 pb-8 transition-colors text-xs space-y-10"
    >
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 space-y-10">
        {/* Bloco 1: Grid Principal (Identidade + Fontes Oficiais + Recursos) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
          {/* Coluna 1 (5 colunas): Marca, Propósito & Status */}
          <div className="md:col-span-5 space-y-4">
            <div
              onClick={scrollToTop}
              className="inline-flex items-center gap-2.5 cursor-pointer group select-none"
            >
              <CloudSunRain className="w-8 h-8 text-emerald-500 transition-transform group-hover:scale-110" />
              <span style={{ color: "var(--text-main)" }} className="text-2xl font-black tracking-tight">
                Clima<span className="text-emerald-500">BR</span>
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Plataforma nacional de inteligência meteorológica, monitoramento de riscos ambientais e dados geoestatísticos para os <strong>5.570 municípios</strong> do Brasil.
            </p>

            {/* Selo de Status das APIs Operacionais & Link de Governança */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sistemas & APIs Operacionais</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--card-border)] text-[var(--text-muted)] text-[11px] font-medium">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>5.570 Cidades Cobertas</span>
              </div>

              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-emerald-500/10 border border-[var(--card-border)] hover:border-emerald-500/30 text-[var(--text-muted)] hover:text-emerald-500 text-[11px] font-semibold transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Privacidade & LGPD</span>
              </button>
            </div>
          </div>

          {/* Coluna 2 (4 colunas): Fontes Oficiais de Dados */}
          <div className="md:col-span-4 space-y-3">
            <h4 style={{ color: "var(--text-main)" }} className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Fontes Oficiais & Governança</span>
            </h4>
            <ul className="space-y-2 text-[11px] text-[var(--text-muted)]">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">●</span>
                <span><strong>IBGE:</strong> Malha municipal e georreferenciamento oficial</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">●</span>
                <span><strong>INMET:</strong> Alertas meteorológicos e Defesa Civil</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">●</span>
                <span><strong>CEMADEN:</strong> Riscos hidrológicos e geológicos</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-500 font-bold">●</span>
                <span><strong>INPE:</strong> Monitoramento de fogo e queimadas</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-500 font-bold">●</span>
                <span><strong>Copernicus & ECMWF:</strong> Qualidade do ar e satélites</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">●</span>
                <span><strong>NOAA CPC:</strong> Índices oceânicos do Pacífico (ENSO)</span>
              </li>
            </ul>
          </div>

          {/* Coluna 3 (3 colunas): Módulos & Recursos Integrados */}
          <div className="md:col-span-3 space-y-3">
            <h4 style={{ color: "var(--text-main)" }} className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Módulos Integrados</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-[var(--text-muted)]">
              <li className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition-colors">
                <Radio className="w-3 h-3 text-sky-400 shrink-0" />
                <span>Radar RainViewer ao Vivo</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition-colors">
                <Waves className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Modo Litoral & Marés</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition-colors">
                <Sprout className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Painel Agro & Solo FAO-56</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition-colors">
                <Swords className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Batalha do Clima</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-[var(--text-main)] transition-colors">
                <Hourglass className="w-3 h-3 text-purple-400 shrink-0" />
                <span>Cápsula do Tempo Histórica</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bloco 2: Aviso Legal & Emergências (Disclaimer Oficial) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)] space-y-1.5 text-[11px] leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Aviso Meteorológico & Segurança Pública</span>
          </div>
          <p className="text-[var(--text-muted)]">
            As previsões meteorológicas, condições marinhas e índices agroclimáticos são baseados em dados públicos abertos e modelagens numéricas probabilísticas. Em situações de eventos climáticos severos, desastres naturais ou risco iminente à vida, siga estritamente as orientações e comunicados oficiais da <strong>Defesa Civil (Ligue 199)</strong> e do <strong>Corpo de Bombeiros Militar (Ligue 193)</strong>.
          </p>
        </div>

        {/* Bloco 3: Linha de Copyright & Rodapé Final */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--card-border)] text-[11px] text-[var(--text-muted)] text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
            <span>&copy; {currentYear} <strong>ClimaBR</strong></span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              className="hover:text-emerald-500 transition-colors cursor-pointer underline underline-offset-2 decoration-[var(--card-border)] hover:decoration-emerald-500 inline-flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Privacidade & Dados</span>
            </button>
            <span>•</span>
            <a
              href="https://github.com/GadiegoN/climabr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-400 transition-colors inline-flex items-center gap-1 underline underline-offset-2 decoration-[var(--card-border)] hover:decoration-sky-400 font-medium"
            >
              <span>Código Aberto</span>
              <ExternalLink className="w-2.5 h-2.5 text-[var(--text-muted)]" />
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
            <span>Desenvolvido no Brasil 🇧🇷</span>
            <span>•</span>
            <span>
              Por{" "}
              <a
                href="https://gadiegon.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[var(--text-main)] hover:text-emerald-500 transition-colors inline-flex items-center gap-1 underline underline-offset-2 decoration-[var(--card-border)] hover:decoration-emerald-500"
              >
                <span>Gadiego Nogueira</span>
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Modal Interativo de Governança e Privacidade LGPD */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </footer>
  );
}

