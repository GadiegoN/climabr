"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DadosClimaCidade } from "@/types/weather";
import { mapearCodigoClima } from "@/utils/weatherCodes";
import { baixarPrevisaoComoPNG, gerarImagemPrevisaoPNG } from "@/utils/canvasExport";
import { WeatherIcon } from "./WeatherIcon";
import {
  X,
  Share2,
  Check,
  Copy,
  ExternalLink,
  MessageCircle,
  MapPin,
  Calendar,
  CloudRain,
  Thermometer,
  Download,
  Camera,
} from "lucide-react";

interface ShareModalProps {
  cidade: DadosClimaCidade;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ cidade, isOpen, onClose }: ShareModalProps) {
  const [copiado, setCopiado] = useState(false);
  const [baixandoPNG, setBaixandoPNG] = useState(false);
  const [compartilhandoNativo, setCompartilhandoNativo] = useState(false);
  const [baixadoSucesso, setBaixadoSucesso] = useState(false);
  const [suportaShareArquivo, setSuportaShareArquivo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
      try {
        const dummyFile = new File(["test"], "test.png", { type: "image/png" });
        setSuportaShareArquivo(navigator.canShare({ files: [dummyFile] }));
      } catch {
        setSuportaShareArquivo(false);
      }
    }
  }, []);

  if (!isOpen || !mounted) return null;

  const condicao = mapearCodigoClima(cidade.clima.weathercode, cidade.clima.is_day);
  const tempAtual = Math.round(cidade.clima.temperature);
  const hojePrevisao = cidade.previsaoDiaria?.[0];
  const max = hojePrevisao ? Math.round(hojePrevisao.tempMax) : tempAtual;
  const min = hojePrevisao ? Math.round(hojePrevisao.tempMin) : tempAtual;
  const chuva = hojePrevisao?.probabilidadeChuva ?? 0;

  const urlCompartilhamento =
    typeof window !== "undefined"
      ? `${window.location.origin}/?uf=${encodeURIComponent(cidade.uf)}&cidadeId=${encodeURIComponent(cidade.municipioId)}&cidade=${encodeURIComponent(cidade.municipio)}`
      : "";

  const textoWhatsApp = `🌤️ *Previsão do Tempo em ${cidade.municipio} - ${cidade.uf}*\n\n🌡️ *Temperatura Atual:* ${tempAtual}°C (${condicao.descricao})\n📈 *Máxima:* ${max}°C | *Mínima:* ${min}°C\n🌧️ *Probabilidade de Chuva:* ${chuva}%\n\n👉 Veja previsão hora a hora, radar e alertas no ClimaBR:\n${urlCompartilhamento}`;

  const linkWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`;

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlCompartilhamento);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCompartilharNativo = async () => {
    setCompartilhandoNativo(true);
    try {
      const dataUrl = gerarImagemPrevisaoPNG(cidade, condicao);
      if (!dataUrl) {
        setCompartilhandoNativo(false);
        return;
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const nomeArquivo = `climabr-${cidade.municipio.toLowerCase().replace(/\s+/g, "-")}.png`;
      const file = new File([blob], nomeArquivo, { type: "image/png" });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `Previsão do Tempo em ${cidade.municipio} - ${cidade.uf}`,
          text: textoWhatsApp,
        });
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("Erro ao compartilhar nativamente:", err);
      }
    } finally {
      setCompartilhandoNativo(false);
    }
  };

  const handleBaixarPNG = () => {
    setBaixandoPNG(true);
    setTimeout(() => {
      const ok = baixarPrevisaoComoPNG(cidade, condicao);
      setBaixandoPNG(false);
      if (ok) {
        setBaixadoSucesso(true);
        setTimeout(() => setBaixadoSucesso(false), 3000);
      }
    }, 150);
  };

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderColor: "var(--card-border)",
    boxShadow: "var(--card-shadow)",
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        style={cardStyle}
        className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/20 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto"
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Título do Modal */}
        <div className="space-y-1 pr-8">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-400 shrink-0" />
            <span>Compartilhar Previsão</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] truncate sm:whitespace-normal">
            Envie o clima de {cidade.municipio} para amigos ou grupos
          </p>
        </div>

        {/* 📸 Cartão Visual Preview (Estilo Story / Card de Compartilhamento) */}
        <div
          className={`w-full rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white shadow-xl bg-gradient-to-br ${condicao.gradienteFundo} relative overflow-hidden border border-white/25 space-y-3 sm:space-y-4`}
        >
          <div className="flex items-center justify-between border-b border-white/20 pb-2.5 sm:pb-3 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-4 h-4 text-white shrink-0" />
              <span className="font-extrabold text-sm sm:text-base tracking-tight truncate">
                {cidade.municipio} - {cidade.uf}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md shrink-0">
              ClimaBR
            </span>
          </div>

          <div className="flex items-center justify-between py-1 gap-2">
            <div>
              <div className="text-3xl sm:text-4xl font-black drop-shadow tracking-tight">
                {tempAtual}°C
              </div>
              <p className="text-xs font-semibold text-white/90 mt-0.5 sm:mt-1 truncate">
                {condicao.descricao}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shrink-0">
              <WeatherIcon tipo={condicao.icone} className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <Thermometer className="w-3.5 h-3.5 opacity-80 shrink-0" />
              <span className="truncate">
                Mín: <strong>{min}°</strong> | Máx: <strong>{max}°</strong>
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5 truncate">
              <CloudRain className="w-3.5 h-3.5 opacity-80 shrink-0" />
              <span className="truncate">
                Chuva: <strong>{chuva}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação para Compartilhar & Baixar */}
        <div className="space-y-2 sm:space-y-2.5 pt-1">
          {/* 📲 Compartilhamento Direto de Arquivo no WhatsApp/Redes (Mobile) */}
          {suportaShareArquivo && (
            <button
              type="button"
              onClick={handleCompartilharNativo}
              disabled={compartilhandoNativo}
              className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-98 cursor-pointer disabled:opacity-70"
            >
              {compartilhandoNativo ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span className="truncate">Preparando Imagem HD...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Enviar Imagem no WhatsApp / Stories</span>
                </>
              )}
            </button>
          )}

          {/* 📸 Botão Baixar Imagem PNG */}
          <button
            type="button"
            onClick={handleBaixarPNG}
            disabled={baixandoPNG}
            className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 active:scale-98 cursor-pointer disabled:opacity-70"
          >
            {baixadoSucesso ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="font-extrabold text-emerald-100 truncate">Imagem PNG Baixada!</span>
              </>
            ) : baixandoPNG ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span className="truncate">Gerando Imagem HD (1080x1080)...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 shrink-0" />
                <span className="truncate">Baixar Captura em Imagem (PNG)</span>
                <Download className="w-3.5 h-3.5 opacity-80 shrink-0" />
              </>
            )}
          </button>

          {/* Botão WhatsApp */}
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-98"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">Compartilhar no WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
          </a>

          {/* Botão Copiar Link */}
          <button
            type="button"
            onClick={handleCopiarLink}
            className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 text-[var(--text-main)] border border-[var(--card-border)] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            {copiado ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-bold truncate">Link Direto Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">Copiar Link para Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

