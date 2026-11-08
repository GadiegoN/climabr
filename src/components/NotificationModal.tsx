"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BellRing,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  NotificacoesConfig,
  ItemAlertaNotificacao,
  TopicoNotificacao,
  TOPICOS_INFO,
  getNotificacoesConfig,
  salvarNotificacoesConfig,
  solicitarPermissao,
  getStatusPermissao,
  dispararAlertaEspecifico,
  registrarServiceWorker,
} from "@/utils/notifications";
import { DadosClimaCidade } from "@/types/weather";

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
  const [testandoId, setTestandoId] = useState<string | null>(null);
  const [testeSucessoId, setTesteSucessoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(getNotificacoesConfig());
      setPermissao(getStatusPermissao());
      registrarServiceWorker();
    }
  }, [isOpen]);

  // Listener para Escape
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

  // Ativar / Desativar global
  const handleToggleGlobal = async () => {
    setErro(null);

    if (config.ativa) {
      const nova = { ...config, ativa: false };
      setConfig(nova);
      salvarNotificacoesConfig(nova);
      if (onConfigChange) onConfigChange(false);
      return;
    }

    const perm = await solicitarPermissao();
    setPermissao(perm);

    if (perm === "granted") {
      const nova = { ...config, ativa: true };
      setConfig(nova);
      salvarNotificacoesConfig(nova);
      if (onConfigChange) onConfigChange(true);
    } else if (perm === "denied") {
      setErro("As notificações estão bloqueadas nas configurações do seu navegador. Por favor, desbloqueie para receber alertas.");
    }
  };

  // Alterar horário de um alerta
  const handleHoraChange = (id: string, novaHora: string) => {
    const novosAlertas = config.alertas.map((a) =>
      a.id === id ? { ...a, hora: novaHora, ultimoDisparoData: undefined } : a
    );
    const nova = { ...config, alertas: novosAlertas };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  // Alterar tópico de um alerta
  const handleTopicoChange = (id: string, novoTopico: TopicoNotificacao) => {
    const novosAlertas = config.alertas.map((a) =>
      a.id === id ? { ...a, topico: novoTopico } : a
    );
    const nova = { ...config, alertas: novosAlertas };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  // Alterar rótulo de um alerta
  const handleRotuloChange = (id: string, novoRotulo: string) => {
    const novosAlertas = config.alertas.map((a) =>
      a.id === id ? { ...a, rotulo: novoRotulo } : a
    );
    const nova = { ...config, alertas: novosAlertas };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  // Ativar/desativar alerta individual
  const handleToggleAlerta = (id: string) => {
    const novosAlertas = config.alertas.map((a) =>
      a.id === id ? { ...a, ativo: !a.ativo } : a
    );
    const nova = { ...config, alertas: novosAlertas };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  // Vincular alerta à cidade atual
  const handleVincularCidadeAlerta = (id: string) => {
    const novosAlertas = config.alertas.map((a) =>
      a.id === id
        ? {
            ...a,
            cidadeNome: cidade.municipio,
            uf: cidade.uf,
            cidadeId: cidade.municipioId,
            coordenadas: cidade.coordenadas,
          }
        : a
    );
    const nova = { ...config, alertas: novosAlertas };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  // Adicionar novo alerta customizado
  const handleAdicionarAlerta = () => {
    const agora = new Date();
    const horaSugerida = `${String(agora.getHours()).padStart(2, "0")}:00`;
    const novo: ItemAlertaNotificacao = {
      id: `alerta_${Date.now()}`,
      hora: horaSugerida,
      topico: "rotina",
      rotulo: "Novo Alerta",
      ativo: true,
      cidadeNome: cidade.municipio,
      uf: cidade.uf,
      cidadeId: cidade.municipioId,
      coordenadas: cidade.coordenadas,
    };
    const nova = { ...config, ativa: true, alertas: [...config.alertas, novo] };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
    if (onConfigChange) onConfigChange(true);
  };

  // Remover alerta
  const handleRemoverAlerta = (id: string) => {
    const novosAlertas = config.alertas.filter((a) => a.id !== id);
    const nova = { ...config, alertas: novosAlertas };
    setConfig(nova);
    salvarNotificacoesConfig(nova);
  };

  // Testar um alerta específico
  const handleTestarAlerta = async (alerta: ItemAlertaNotificacao) => {
    setTestandoId(alerta.id);
    setErro(null);

    let perm = getStatusPermissao();
    if (perm !== "granted") {
      perm = await solicitarPermissao();
      setPermissao(perm);
    }

    if (perm !== "granted") {
      setErro("Permissão de notificação necessária para testar o alerta.");
      setTestandoId(null);
      return;
    }

    const sucesso = await dispararAlertaEspecifico(alerta, true);
    setTestandoId(null);

    if (sucesso) {
      setTesteSucessoId(alerta.id);
      setTimeout(() => setTesteSucessoId(null), 3500);
    } else {
      setErro("Não foi possível emitir a notificação. Verifique se o navegador está autorizado a emitir notificações.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        style={cardStyle}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-7 space-y-5"
      >
        {/* Topo do Modal */}
        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shrink-0">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                Seus Alertas & Notificações
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Você escolhe o horário exato e o que notificar em cada horário
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* Interruptor Principal */}
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <span>Sistema de Notificações</span>
              {config.ativa && permissao === "granted" ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                  Ativo ({config.alertas.filter((a) => a.ativo).length} programados)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 text-[var(--text-muted)] font-medium">
                  Pausado
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Alertas disparam no minuto exato configurado enquanto a página/PWA estiver aberta ou minimizada.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleGlobal}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 ${
              config.ativa && permissao === "granted"
                ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
            }`}
          >
            {config.ativa && permissao === "granted" ? "Pausar Todos" : "Ativar Alertas"}
          </button>
        </div>

        {/* Lista de Alertas Customizados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Alarmes & Tópicos Programados</span>
            </label>

            <button
              type="button"
              onClick={handleAdicionarAlerta}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo Alerta</span>
            </button>
          </div>

          {config.alertas.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-[var(--card-border)] text-center space-y-2">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
              <p className="text-sm font-bold text-[var(--text-main)]">Nenhum alerta criado ainda</p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Clique no botão &ldquo;Novo Alerta&rdquo; acima para definir o horário e o que deseja que o ClimaBR notifique.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {config.alertas.map((alerta, index) => {
                const infoTopico = TOPICOS_INFO[alerta.topico] || TOPICOS_INFO.previsao;
                const estaTestando = testandoId === alerta.id;
                const testouComSucesso = testeSucessoId === alerta.id;

                return (
                  <div
                    key={alerta.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      alerta.ativo
                        ? "bg-black/5 dark:bg-white/[0.03] border-emerald-500/30 shadow-sm"
                        : "bg-black/5 dark:bg-white/[0.01] border-[var(--card-border)] opacity-60"
                    }`}
                  >
                    {/* Linha Superior: Horário, Rótulo, Switch e Botão Testar / Lixeira */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* Seletor de Hora */}
                        <div className="relative">
                          <input
                            type="time"
                            value={alerta.hora}
                            onChange={(e) => handleHoraChange(alerta.id, e.target.value)}
                            className="bg-black/10 dark:bg-white/10 text-[var(--text-main)] font-mono font-black text-base px-3 py-1.5 rounded-xl border border-[var(--card-border)] focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
                          />
                        </div>

                        {/* Nome / Rótulo do Alerta */}
                        <input
                          type="text"
                          value={alerta.rotulo || ""}
                          placeholder={`Alerta #${index + 1}`}
                          onChange={(e) => handleRotuloChange(alerta.id, e.target.value)}
                          className="text-xs font-semibold bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[var(--card-border)] w-28 sm:w-36 outline-none truncate"
                        />
                      </div>

                      {/* Ações: Ligar/Desligar, Testar e Excluir */}
                      <div className="flex items-center gap-2">
                        {/* Botão de Testar este alarme específico */}
                        <button
                          type="button"
                          onClick={() => handleTestarAlerta(alerta)}
                          disabled={estaTestando}
                          title="Testar este alarme agora"
                          className="px-2.5 py-1.5 rounded-xl border border-[var(--card-border)] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {estaTestando ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                          ) : testouComSucesso ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-sky-400" />
                          )}
                          <span className="hidden sm:inline">
                            {testouComSucesso ? "Enviado!" : "Testar"}
                          </span>
                        </button>

                        {/* Switch de Ativação do Alarme */}
                        <button
                          type="button"
                          onClick={() => handleToggleAlerta(alerta.id)}
                          title={alerta.ativo ? "Desativar este alarme" : "Ativar este alarme"}
                          className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                            alerta.ativo ? "bg-emerald-500" : "bg-black/20 dark:bg-white/20"
                          }`}
                        >
                          <div
                            className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform ${
                              alerta.ativo ? "translate-x-4.5" : "translate-x-0"
                            }`}
                          />
                        </button>

                        {/* Botão Excluir */}
                        <button
                          type="button"
                          onClick={() => handleRemoverAlerta(alerta.id)}
                          title="Excluir este alarme"
                          className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Linha Central: O que notificar neste horário (Seletor de Tópico) */}
                    <div className="space-y-1.5 pt-1 border-t border-[var(--card-border)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                        O que notificar às {alerta.hora}:
                      </span>

                      <div className="relative">
                        <select
                          value={alerta.topico}
                          onChange={(e) =>
                            handleTopicoChange(alerta.id, e.target.value as TopicoNotificacao)
                          }
                          className="w-full text-xs font-bold p-2.5 rounded-xl border border-[var(--card-border)] bg-black/5 dark:bg-white/[0.05] text-[var(--text-main)] focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {Object.entries(TOPICOS_INFO).map(([chave, info]) => (
                            <option key={chave} value={chave} className="bg-slate-900 text-white">
                              {info.iconeEmoji} {info.titulo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed italic">
                        {infoTopico.iconeEmoji} {infoTopico.descricao}
                      </p>
                    </div>

                    {/* Linha Inferior: Cidade deste Alarme */}
                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Cidade monitorada: </span>
                        <strong className="text-[var(--text-main)] truncate">
                          {alerta.cidadeNome} - {alerta.uf}
                        </strong>
                      </div>

                      {alerta.cidadeNome !== cidade.municipio && (
                        <button
                          type="button"
                          onClick={() => handleVincularCidadeAlerta(alerta.id)}
                          className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
                        >
                          Mudar para {cidade.municipio}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
            <strong>Privacidade & LGPD:</strong> Você tem controle total. Cada alerta roda com os dados locais salvos no seu aparelho. Sem cadastros, sem e-mails e sem rastreadores.
          </p>
        </div>
      </div>
    </div>
  );
}
