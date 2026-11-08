"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Bell,
  BellRing,
  BellOff,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Loader2,
  Clock,
  MapPin,
} from "lucide-react";
import {
  NotificacoesConfig,
  getNotificacoesConfig,
  salvarNotificacoesConfig,
  solicitarPermissao,
  getStatusPermissao,
  dispararNotificacaoTeste,
  registrarServiceWorker,
} from "@/utils/notifications";
import { DadosClimaCidade } from "@/types/weather";
import { getClimaCompleto } from "@/services/api";
import { mapearCodigoClima } from "@/utils/weatherCodes";

interface NotificationModalProps {
  cidade: DadosClimaCidade;
  isOpen: boolean;
  onClose: () => void;
  onConfigChange?: (ativa: boolean) => void;
}

export function NotificationModal({
  cidade,
  isOpen,
  onClose,
  onConfigChange,
}: NotificationModalProps) {
  const [config, setConfig] = useState<NotificacoesConfig>(getNotificacoesConfig());
  const [permissao, setPermissao] = useState<string>("default");
  const [testando, setTestando] = useState(false);
  const [testeSucesso, setTesteSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getNotificacoesConfig();
      // Se não tiver cidade configurada, usa a cidade atual
      if (!cfg.cidadeId) {
        cfg.cidadeId = cidade.municipioId;
        cfg.cidadeNome = cidade.municipio;
        cfg.uf = cidade.uf;
        cfg.coordenadas = cidade.coordenadas;
      }
      setConfig(cfg);
      setPermissao(getStatusPermissao());
      registrarServiceWorker();
    }
  }, [isOpen, cidade]);

  // Listener para tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderColor: "var(--card-border)",
    color: "var(--text-main)",
  };

  const handleToggleAtivacao = async () => {
    setErro(null);

    // Se estiver desativando (Opt-out imediato)
    if (config.ativa) {
      const novaConfig = { ...config, ativa: false };
      setConfig(novaConfig);
      salvarNotificacoesConfig(novaConfig);
      if (onConfigChange) onConfigChange(false);
      return;
    }

    // Se estiver ativando, solicita permissão ao navegador
    const perm = await solicitarPermissao();
    setPermissao(perm);

    if (perm === "granted") {
      const novaConfig = {
        ...config,
        ativa: true,
        cidadeId: config.cidadeId || cidade.municipioId,
        cidadeNome: config.cidadeNome || cidade.municipio,
        uf: config.uf || cidade.uf,
        coordenadas: config.coordenadas || cidade.coordenadas,
      };
      setConfig(novaConfig);
      salvarNotificacoesConfig(novaConfig);
      if (onConfigChange) onConfigChange(true);
    } else if (perm === "denied") {
      setErro("As notificações estão bloqueadas nas configurações do seu navegador. Por favor, desbloqueie para receber.");
    }
  };

  const handleToggleHorarioManha = () => {
    const nova = { ...config, horarioManha: !config.horarioManha };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  const handleToggleHorarioNoite = () => {
    const nova = { ...config, horarioNoite: !config.horarioNoite };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  const handleVincularCidadeAtual = () => {
    const nova = {
      ...config,
      cidadeId: cidade.municipioId,
      cidadeNome: cidade.municipio,
      uf: cidade.uf,
      coordenadas: cidade.coordenadas,
    };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  const handleTestarNotificacao = async () => {
    setTestando(true);
    setErro(null);

    // Garante permissão
    let perm = getStatusPermissao();
    if (perm !== "granted") {
      perm = await solicitarPermissao();
      setPermissao(perm);
    }

    if (perm !== "granted") {
      setErro("Permissão de notificação necessária para realizar o teste.");
      setTestando(false);
      return;
    }

    // Identifica qual é a cidade monitorada na configuração
    const nomeAlvo = config.cidadeNome || cidade.municipio;
    const ufAlvo = config.uf || cidade.uf;

    let tempAlvo = Math.round(cidade.clima.temperature);
    let condicaoAlvo = "Tempo Atual";
    let maxAlvo: number | undefined = cidade.previsaoDiaria?.[0]?.tempMax;
    let minAlvo: number | undefined = cidade.previsaoDiaria?.[0]?.tempMin;
    let chuvaAlvo: number | undefined = cidade.previsaoDiaria?.[0]?.probabilidadeChuva;

    // Se a cidade monitorada for DIFERENTE da que está atualmente na tela (ex: Conquista vs Sacramento)
    if (config.cidadeId && config.cidadeId !== cidade.municipioId && config.coordenadas) {
      try {
        const climaRemoto = await getClimaCompleto(
          config.coordenadas.latitude,
          config.coordenadas.longitude
        );
        tempAlvo = Math.round(climaRemoto.clima.temperature);
        const condMap = mapearCodigoClima(climaRemoto.clima.weathercode, climaRemoto.clima.is_day);
        condicaoAlvo = condMap.descricao;
        maxAlvo = climaRemoto.previsaoDiaria?.[0]?.tempMax;
        minAlvo = climaRemoto.previsaoDiaria?.[0]?.tempMin;
        chuvaAlvo = climaRemoto.previsaoDiaria?.[0]?.probabilidadeChuva;
      } catch {
        // Fallback mantém valores padrão
      }
    }

    const sucesso = await dispararNotificacaoTeste(
      nomeAlvo,
      ufAlvo,
      tempAlvo,
      condicaoAlvo,
      maxAlvo !== undefined ? Math.round(maxAlvo) : undefined,
      minAlvo !== undefined ? Math.round(minAlvo) : undefined,
      chuvaAlvo
    );

    setTestando(false);
    if (sucesso) {
      setTesteSucesso(true);
      setTimeout(() => setTesteSucesso(false), 3500);
    } else {
      setErro("Não foi possível emitir a notificação. Verifique se o navegador suporta notificações em segundo plano.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        style={cardStyle}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-7 space-y-5"
      >
        {/* Topo do Modal */}
        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shrink-0">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                Notificações Diárias do Clima
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Previsão pré-configurada às 08h e 20h no seu dispositivo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar modal de notificações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro / Bloqueio */}
        {erro && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* Interruptor Principal: Ativar / Desativar (LGPD Opt-in / Opt-out) */}
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <span>Alertas Meteorológicos</span>
              {config.ativa && permissao === "granted" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                  Ativado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 text-[var(--text-muted)] font-medium">
                  Desativado
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Receba resumos automáticos sem precisar abrir o navegador
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleAtivacao}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              config.ativa && permissao === "granted"
                ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            }`}
          >
            {config.ativa && permissao === "granted" ? "Desativar" : "Ativar Notificações"}
          </button>
        </div>

        {/* Horários Pré-Configurados (08:00 e 20:00) */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
            Horários Agendados
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bloco 08:00 Manhã */}
            <div
              onClick={handleToggleHorarioManha}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-2 ${
                config.horarioManha
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-black/5 dark:bg-white/[0.02] border-[var(--card-border)] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <span className="font-mono font-black text-sm text-[var(--text-main)]">08:00</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.horarioManha}
                  onChange={handleToggleHorarioManha}
                  className="w-4 h-4 accent-amber-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-xs font-bold block text-[var(--text-main)]">Previsão da Manhã</span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight block mt-0.5">
                  Máxima, mínima, chance de chuva e alertas para seu dia.
                </span>
              </div>
            </div>

            {/* Bloco 20:00 Noite */}
            <div
              onClick={handleToggleHorarioNoite}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-2 ${
                config.horarioNoite
                  ? "bg-indigo-500/10 border-indigo-500/30"
                  : "bg-black/5 dark:bg-white/[0.02] border-[var(--card-border)] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <span className="font-mono font-black text-sm text-[var(--text-main)]">20:00</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.horarioNoite}
                  onChange={handleToggleHorarioNoite}
                  className="w-4 h-4 accent-indigo-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-xs font-bold block text-[var(--text-main)]">Resumo da Noite</span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight block mt-0.5">
                  Previsão para a madrugada e como amanhecerá o dia seguinte.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cidade Vinculada */}
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[var(--text-muted)] block text-[10px]">Município monitorado:</span>
              <span className="font-bold text-[var(--text-main)] truncate block">
                {config.cidadeNome ? `${config.cidadeNome} - ${config.uf}` : `${cidade.municipio} - ${cidade.uf}`}
              </span>
            </div>
          </div>

          {config.cidadeId !== cidade.municipioId && (
            <button
              type="button"
              onClick={handleVincularCidadeAtual}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
            >
              Mudar para {cidade.municipio}
            </button>
          )}
        </div>

        {/* Botão de Enviar Notificação de Teste Imediata */}
        <div className="pt-1 space-y-2">
          <button
            type="button"
            onClick={handleTestarNotificacao}
            disabled={testando}
            className="w-full py-2.5 px-4 rounded-xl border border-[var(--card-border)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-[var(--text-main)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {testando ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Enviando notificação de teste...</span>
              </>
            ) : testeSucesso ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Notificação disparada com sucesso!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>Testar Notificação Agora</span>
              </>
            )}
          </button>

          {/* Dica de Sistema Operacional (Windows / Mac / Android) */}
          {testeSucesso && (
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300 leading-snug animate-fade-in">
              <span>💡 <strong>Dica:</strong> Se o banner não saltar no meio da tela, abra a <strong>Central de Notificações do Windows</strong> (ícone de balãozinho/sino ao lado do relógio no canto inferior direito) ou certifique-se de que o modo <em>"Não Perturbe / Assistente de Foco"</em> está desligado no Windows.</span>
            </div>
          )}
        </div>

        {/* Rodapé de Governança & LGPD */}
        <div
          className="pt-3 border-t flex items-start gap-2 text-[11px] text-[var(--text-muted)] leading-relaxed"
          style={{ borderColor: "var(--card-border)" }}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <p>
            <strong>Privacidade & LGPD:</strong> Não pedimos seu e-mail, telefone ou cadastro. As notificações funcionam de forma anônima e suas configurações de horário ficam salvas apenas no seu aparelho. Você pode desativar a qualquer momento com 1 clique.
          </p>
        </div>
      </div>
    </div>
  );
}

