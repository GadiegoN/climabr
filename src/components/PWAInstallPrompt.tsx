"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Check, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando instalado (Standalone PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Verifica se o usuário dispensou o aviso recentemente (14 dias)
    try {
      const dismissedUntil = localStorage.getItem("climabr_pwa_dismissed_until");
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    // 3. Detecta iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Captura evento do Chrome/Android/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIOSGuide(false);
    try {
      // Dispensa por 14 dias
      const prazo = Date.now() + 14 * 24 * 60 * 60 * 1000;
      localStorage.setItem("climabr_pwa_dismissed_until", String(prazo));
    } catch {
      // Ignora
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error("Erro ao solicitar instalação PWA:", err);
      } finally {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // Se já estiver instalado ou dispensado, não renderiza o banner flutuante
  if (isInstalled || isDismissed || (!isInstallable && !isIOS)) {
    return null;
  }

  return (
    <aside
      aria-label="Instalar Aplicativo ClimaBR"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-40 animate-fade-in"
    >
      <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#0f172a]/95 dark:bg-[#020617]/95 text-white border border-emerald-500/30 shadow-2xl backdrop-blur-xl space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Instalar o App ClimaBR</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold">
                  Sem Anúncios
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                Acesse a previsão na sua tela inicial, rápido e direto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            title="Lembrar mais tarde"
            aria-label="Fechar banner de instalação do aplicativo"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guia especial para usuários no iOS Safari */}
        {showIOSGuide ? (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Share className="w-3.5 h-3.5" />
              <span>Como instalar no iPhone/iPad:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-300">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta) no Safari</li>
              <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong>Adicionar</strong> no canto superior</li>
            </ol>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isIOS ? "Como Adicionar ao Celular" : "Instalar Aplicativo"}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Agora não
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

