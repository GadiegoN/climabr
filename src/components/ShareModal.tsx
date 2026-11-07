"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DadosClimaCidade } from "@/types/weather";
import { mapearCodigoClima } from "@/utils/weatherCodes";
import { baixarPrevisaoComoPNG } from "@/utils/canvasExport";
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
  const [baixadoSucesso, setBaixadoSucesso] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        style={cardStyle}
        className="w-full max-w-md rounded-3xl border border-white/20 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Título do Modal */}
        <div className="space-y-1 pr-8">
          <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-400" />
            Compartilhar Previsão
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Envie as informações meteorológicas de {cidade.municipio} para amigos ou grupos
          </p>
        </div>

        {/* 📸 Cartão Visual Preview (Estilo Story / Card de Compartilhamento) */}
        <div
          className={`w-full rounded-2xl p-5 text-white shadow-xl bg-gradient-to-br ${condicao.gradienteFundo} relative overflow-hidden border border-white/25 space-y-4`}
        >
          <div className="flex items-center justify-between border-b border-white/20 pb-3">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-white" />
              <span className="font-extrabold text-base tracking-tight">
                {cidade.municipio} - {cidade.uf}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              ClimaBR
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-4xl font-black drop-shadow tracking-tight">
                {tempAtual}°C
              </div>
              <p className="text-xs font-semibold text-white/90 mt-1">
                {condicao.descricao}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
              <WeatherIcon tipo={condicao.icone} className="w-12 h-12 text-white drop-shadow" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 opacity-80" />
              <span>
                Mín: <strong>{min}°</strong> | Máx: <strong>{max}°</strong>
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <CloudRain className="w-3.5 h-3.5 opacity-80" />
              <span>
                Chuva: <strong>{chuva}%</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação para Compartilhar & Baixar */}
        <div className="space-y-2.5 pt-1">
          {/* 📸 Botão Baixar Imagem PNG */}
          <button
            type="button"
            onClick={handleBaixarPNG}
            disabled={baixandoPNG}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 active:scale-98 cursor-pointer disabled:opacity-70"
          >
            {baixadoSucesso ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span className="font-extrabold text-emerald-100">Imagem PNG Baixada com Sucesso!</span>
              </>
            ) : baixandoPNG ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gerando Imagem HD (1080x1080)...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Baixar Captura em Imagem (PNG)</span>
                <Download className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>

          {/* Botão WhatsApp */}
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Compartilhar no WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          {/* Botão Copiar Link */}
          <button
            type="button"
            onClick={handleCopiarLink}
            className="w-full py-3 px-4 rounded-2xl bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 text-[var(--text-main)] border border-[var(--card-border)] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            {copiado ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Link Direto Copiado com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-sky-400" />
                <span>Copiar Link para Compartilhar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

