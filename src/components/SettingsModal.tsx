"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Settings,
  Sliders,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Sunrise,
  Sunset,
  LineChart,
  Clock,
  Wind,
  Radio,
  Sprout,
  Waves,
  BookOpen,
  Megaphone,
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle2,
  MapPin,
  Trash2,
  AlertCircle,
  Shirt,
  Plus,
  Flame,
  Newspaper,
} from "lucide-react";
import { ConfiguracoesVisualizacao, CONFIG_VISUALIZACAO_PADRAO } from "@/types/settings";
import {
  getConfiguracoesVisualizacao,
  salvarConfiguracoesVisualizacao,
  restaurarConfiguracoesPadrao,
} from "@/utils/userSettings";
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
import { DadosClimaCidade, TipoTema } from "@/types/weather";
import { getClimaCompleto } from "@/services/api";
import { mapearCodigoClima } from "@/utils/weatherCodes";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cidadeAtual?: DadosClimaCidade | null;
  temaAtual: TipoTema;
  temaEfetivo: "claro" | "escuro" | "amanhecer" | "anoitecer";
  onTemaChange: (tema: TipoTema) => void;
  configVisualizacao: ConfiguracoesVisualizacao;
  onVisualizacaoChange: (novaConfig: ConfiguracoesVisualizacao) => void;
  onAbrirPrivacidade?: () => void;
}

type TabConfig = "visualizacao" | "notificacoes" | "aparencia" | "dados";

export function SettingsModal({
  isOpen,
  onClose,
  cidadeAtual,
  temaAtual,
  temaEfetivo,
  onTemaChange,
  configVisualizacao,
  onVisualizacaoChange,
  onAbrirPrivacidade,
}: SettingsModalProps) {
  const [abaAtiva, setAbaAtiva] = useState<TabConfig>("visualizacao");

  // Notificações
  const [configNotif, setConfigNotif] = useState<NotificacoesConfig>(getNotificacoesConfig());
  const [permissaoNotif, setPermissaoNotif] = useState<string>("default");
  const [testandoId, setTestandoId] = useState<string | null>(null);
  const [testeSucessoId, setTesteSucessoId] = useState<string | null>(null);
  const [erroNotif, setErroNotif] = useState<string | null>(null);

  // Limpeza de dados
  const [dadosLimpos, setDadosLimpos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfigNotif(getNotificacoesConfig());
      setPermissaoNotif(getStatusPermissao());
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

  // Toggle de visualização individual
  const handleToggleVisualizacao = (campo: keyof ConfiguracoesVisualizacao) => {
    const nova = {
      ...configVisualizacao,
      [campo]: !configVisualizacao[campo],
    };
    onVisualizacaoChange(nova);
    salvarConfiguracoesVisualizacao(nova);
  };

  // Restaurar visualização padrão
  const handleRestaurarPadroes = () => {
    const padrao = restaurarConfiguracoesPadrao();
    onVisualizacaoChange(padrao);
  };

  // Toggle ativação global
  const handleToggleGlobalNotif = async () => {
    setErroNotif(null);
    if (configNotif.ativa) {
      const nova = { ...configNotif, ativa: false };
      setConfigNotif(nova);
      salvarNotificacoesConfig(nova);
      return;
    }

    const perm = await solicitarPermissao();
    setPermissaoNotif(perm);

    if (perm === "granted") {
      const nova = { ...configNotif, ativa: true };
      setConfigNotif(nova);
      salvarNotificacoesConfig(nova);
    } else if (perm === "denied") {
      setErroNotif("Notificações bloqueadas nas configurações do seu navegador. Por favor, desbloqueie para ativar.");
    }
  };

  // Alterar horário de um alerta
  const handleHoraChange = (id: string, novaHora: string) => {
    const novosAlertas = configNotif.alertas.map((a) =>
      a.id === id ? { ...a, hora: novaHora, ultimoDisparoData: undefined } : a
    );
    const nova = { ...configNotif, alertas: novosAlertas };
    setConfigNotif(nova);
    salvarNotificacoesConfig(nova);
  };

  // Alterar tópico de um alerta
  const handleTopicoChange = (id: string, novoTopico: TopicoNotificacao) => {
    const novosAlertas = configNotif.alertas.map((a) =>
      a.id === id ? { ...a, topico: novoTopico } : a
    );
    const nova = { ...configNotif, alertas: novosAlertas };
    setConfigNotif(nova);
    salvarNotificacoesConfig(nova);
  };

  // Alterar rótulo de um alerta
  const handleRotuloChange = (id: string, novoRotulo: string) => {
    const novosAlertas = configNotif.alertas.map((a) =>
      a.id === id ? { ...a, rotulo: novoRotulo } : a
    );
    const nova = { ...configNotif, alertas: novosAlertas };
    setConfigNotif(nova);
    salvarNotificacoesConfig(nova);
  };

  // Ativar/desativar alerta individual
  const handleToggleAlerta = (id: string) => {
    const novosAlertas = configNotif.alertas.map((a) =>
      a.id === id ? { ...a, ativo: !a.ativo } : a
    );
    const nova = { ...configNotif, alertas: novosAlertas };
    setConfigNotif(nova);
    salvarNotificacoesConfig(nova);
  };

  // Vincular alerta à cidade atual
  const handleVincularCidadeAlerta = (id: string) => {
    if (!cidadeAtual) return;
    const novosAlertas = configNotif.alertas.map((a) =>
      a.id === id
        ? {
            ...a,
            cidadeNome: cidadeAtual.municipio,
            uf: cidadeAtual.uf,
            cidadeId: cidadeAtual.municipioId,
            coordenadas: cidadeAtual.coordenadas,
          }
        : a
    );
    const nova = { ...configNotif, alertas: novosAlertas };
    setConfigNotif(nova);
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
      cidadeNome: cidadeAtual?.municipio || "Minha Cidade",
      uf: cidadeAtual?.uf || "BR",
      cidadeId: cidadeAtual?.municipioId,
      coordenadas: cidadeAtual?.coordenadas,
    };
    const nova = { ...configNotif, ativa: true, alertas: [...configNotif.alertas, novo] };
    setConfigNotif(nova);
    salvarNotificacoesConfig(nova);
  };

  // Remover alerta
  const handleRemoverAlerta = (id: string) => {
    const novosAlertas = configNotif.alertas.filter((a) => a.id !== id);
    const nova = { ...configNotif, alertas: novosAlertas };
    setConfigNotif(nova);
    salvarNotificacoesConfig(nova);
  };

  // Testar um alerta específico
  const handleTestarAlerta = async (alerta: ItemAlertaNotificacao) => {
    setTestandoId(alerta.id);
    setErroNotif(null);

    let perm = getStatusPermissao();
    if (perm !== "granted") {
      perm = await solicitarPermissao();
      setPermissaoNotif(perm);
    }

    if (perm !== "granted") {
      setErroNotif("Permissão de notificação necessária para testar o alerta.");
      setTestandoId(null);
      return;
    }

    const sucesso = await dispararAlertaEspecifico(alerta, true);
    setTestandoId(null);

    if (sucesso) {
      setTesteSucessoId(alerta.id);
      setTimeout(() => setTesteSucessoId(null), 3500);
    } else {
      setErroNotif("Não foi possível emitir a notificação. Verifique se o navegador está autorizado no sistema.");
    }
  };

  // Limpar todos os dados locais
  const handleLimparTodosDados = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    }
    setDadosLimpos(true);
    setTimeout(() => {
      setDadosLimpos(false);
      window.location.reload();
    }, 1500);
  };

  // Lista de itens configuráveis da visualização
  const itensVisualizacao = [
    {
      campo: "mostrarGrafico24h" as keyof ConfiguracoesVisualizacao,
      titulo: "Gráfico de Curva Térmica & Chuva (24h)",
      descricao: "Área de gradiente suave com probabilidade horária de chuva.",
      icone: <LineChart className="w-4 h-4 text-emerald-400" />,
    },
    {
      campo: "mostrarHoraAHora" as keyof ConfiguracoesVisualizacao,
      titulo: "Carrossel Hora a Hora & 7 Dias",
      descricao: "Linha do tempo deslizável com previsão para a semana inteira.",
      icone: <Clock className="w-4 h-4 text-sky-400" />,
    },
    {
      campo: "mostrarDicasRotina" as keyof ConfiguracoesVisualizacao,
      titulo: "Dicas de Rotina Diária",
      descricao: "Sugestões de vestimenta, secar roupas no varal e esportes.",
      icone: <Shirt className="w-4 h-4 text-purple-400" />,
    },
    {
      campo: "mostrarQualidadeArUV" as keyof ConfiguracoesVisualizacao,
      titulo: "Qualidade do Ar & Radiação UV",
      descricao: "Índice UV de risco e concentração de partículas poluentes (AQI).",
      icone: <Wind className="w-4 h-4 text-cyan-400" />,
    },
    {
      campo: "mostrarRadarChuva" as keyof ConfiguracoesVisualizacao,
      titulo: "Radar Meteorológico RainViewer ao Vivo",
      descricao: "Mapa Doppler com histórico e animação de frentes de chuva.",
      icone: <Radio className="w-4 h-4 text-emerald-500" />,
    },
    {
      campo: "mostrarAlertasDefesaCivil" as keyof ConfiguracoesVisualizacao,
      titulo: "Avisos de Risco da Defesa Civil (INMET)",
      descricao: "Banners de alertas severos em caso de tempestades ou vendavais.",
      icone: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    },
    {
      campo: "mostrarInsightsTabs" as keyof ConfiguracoesVisualizacao,
      titulo: "História & Notícias da Cidade",
      descricao: "Abas enciclopédicas com artigos do IBGE, Agência Brasil e Wikipédia.",
      icone: <BookOpen className="w-4 h-4 text-blue-400" />,
    },
    {
      campo: "mostrarAgro" as keyof ConfiguracoesVisualizacao,
      titulo: "Painel Agroclimatológico & Solo",
      descricao: "Botão de acesso à evapotranspiração FAO-56 e manejo agrícola.",
      icone: <Sprout className="w-4 h-4 text-emerald-400" />,
    },
    {
      campo: "mostrarLitoral" as keyof ConfiguracoesVisualizacao,
      titulo: "Modo Litoral & Marés",
      descricao: "Altura de ondas, direção do swell e temperatura marítima.",
      icone: <Waves className="w-4 h-4 text-teal-400" />,
    },
    {
      campo: "mostrarAnunciosMock" as keyof ConfiguracoesVisualizacao,
      titulo: "Vitrine de Anúncios Demonstrativos",
      descricao: "Permite desligar 100% da vitrine demonstrativa de anunciantes.",
      icone: <Megaphone className="w-4 h-4 text-rose-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        style={cardStyle}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-7 space-y-5"
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shrink-0">
              <Settings className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight">
                Central de Configurações
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Personalize módulos, notificações, temas e privacidade
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Navegação por Abas */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--card-border)] overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAbaAtiva("visualizacao")}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              abaAtiva === "visualizacao"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Exibição</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("notificacoes")}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              abaAtiva === "notificacoes"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alertas</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("aparencia")}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              abaAtiva === "aparencia"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Temas</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("dados")}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              abaAtiva === "dados"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacidade</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ABA 1: VISUALIZAÇÃO & MODULAR DASHBOARD                    */}
        {/* ========================================================= */}
        {abaAtiva === "visualizacao" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                Ligue ou desligue módulos da tela conforme sua preferência:
              </span>
              <button
                type="button"
                onClick={handleRestaurarPadroes}
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrões</span>
              </button>
            </div>

            <div className="space-y-2">
              {itensVisualizacao.map((item) => {
                const ativo = configVisualizacao[item.campo];

                return (
                  <div
                    key={item.campo}
                    onClick={() => handleToggleVisualizacao(item.campo)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] hover:border-emerald-500/30 flex items-center justify-between gap-3 transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 shrink-0">
                        {item.icone}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold block text-[var(--text-main)] truncate">
                          {item.titulo}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] block truncate">
                          {item.descricao}
                        </span>
                      </div>
                    </div>

                    {/* Switch estilo iOS/Tailwind */}
                    <div
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                        ativo ? "bg-emerald-500" : "bg-black/20 dark:bg-white/20"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          ativo ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: NOTIFICAÇÕES & ALERTAS                              */}
        {/* ========================================================= */}
        {abaAtiva === "notificacoes" && (
          <div className="space-y-4 animate-fade-in">
            {erroNotif && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{erroNotif}</span>
              </div>
            )}

            {/* Interruptor Principal */}
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs sm:text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <span>Sistema de Notificações</span>
                  {configNotif.ativa && permissaoNotif === "granted" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                      Ativo ({configNotif.alertas?.filter((a) => a.ativo).length ?? 0} programados)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10 text-[var(--text-muted)] font-medium">
                      Pausado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Cada alarme dispara no minuto exato com o tópico que você escolheu.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleGlobalNotif}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 ${
                  configNotif.ativa && permissaoNotif === "granted"
                    ? "bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30"
                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold"
                }`}
              >
                {configNotif.ativa && permissaoNotif === "granted" ? "Pausar Todos" : "Ativar Alertas"}
              </button>
            </div>

            {/* Lista de Alertas Programados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Seus Alarmes Programados</span>
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

              {(!configNotif.alertas || configNotif.alertas.length === 0) ? (
                <div className="p-6 rounded-2xl border border-dashed border-[var(--card-border)] text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                  <p className="text-sm font-bold text-[var(--text-main)]">Nenhum alerta cadastrado</p>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    Clique em &ldquo;Novo Alerta&rdquo; acima para definir o horário e escolher qual assunto receber.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {configNotif.alertas.map((alerta, index) => {
                    const infoTopico = TOPICOS_INFO[alerta.topico] || TOPICOS_INFO.previsao;
                    const estaTestando = testandoId === alerta.id;
                    const testouComSucesso = testeSucessoId === alerta.id;

                    return (
                      <div
                        key={alerta.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                          alerta.ativo
                            ? "bg-black/5 dark:bg-white/[0.03] border-emerald-500/30 shadow-sm"
                            : "bg-black/5 dark:bg-white/[0.01] border-[var(--card-border)] opacity-60"
                        }`}
                      >
                        {/* Linha 1: Hora, Rótulo, Switch, Testar, Excluir */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={alerta.hora}
                              onChange={(e) => handleHoraChange(alerta.id, e.target.value)}
                              className="bg-black/10 dark:bg-white/10 text-[var(--text-main)] font-mono font-black text-base px-3 py-1 rounded-xl border border-[var(--card-border)] focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
                            />

                            <input
                              type="text"
                              value={alerta.rotulo || ""}
                              placeholder={`Alerta #${index + 1}`}
                              onChange={(e) => handleRotuloChange(alerta.id, e.target.value)}
                              className="text-xs font-semibold bg-transparent text-[var(--text-main)] placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[var(--card-border)] w-24 sm:w-32 outline-none truncate"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Botão de Testar */}
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
                                {testouComSucesso ? "Disparado!" : "Testar"}
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

                        {/* Linha 2: O que notificar neste horário (Select de Tópico) */}
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

                        {/* Linha 3: Cidade deste Alarme */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Cidade monitorada: </span>
                            <strong className="text-[var(--text-main)] truncate">
                              {alerta.cidadeNome} - {alerta.uf}
                            </strong>
                          </div>

                          {cidadeAtual && alerta.cidadeNome !== cidadeAtual.municipio && (
                            <button
                              type="button"
                              onClick={() => handleVincularCidadeAlerta(alerta.id)}
                              className="text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
                            >
                              Mudar para {cidadeAtual.municipio}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: APARÊNCIA & TEMAS                                   */}
        {/* ========================================================= */}
        {abaAtiva === "aparencia" && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs text-[var(--text-muted)] block">
              Escolha seu tema preferido ou use o cálculo solar automático:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "auto" as TipoTema,
                  label: `Automático (${temaEfetivo})`,
                  descricao: "Alterna sozinho de acordo com o nascer e pôr do sol da cidade.",
                  icone: <Sparkles className="w-4 h-4 text-emerald-400" />,
                },
                {
                  id: "claro" as TipoTema,
                  label: "Modo Claro",
                  descricao: "Visual diurno com alto contraste e clareza.",
                  icone: <Sun className="w-4 h-4 text-amber-400" />,
                },
                {
                  id: "escuro" as TipoTema,
                  label: "Modo Escuro",
                  descricao: "Tons profundos para descansar a visão à noite.",
                  icone: <Moon className="w-4 h-4 text-indigo-400" />,
                },
                {
                  id: "amanhecer" as TipoTema,
                  label: "Modo Amanhecer",
                  descricao: "Paleta quente com tons dourados e alaranjados.",
                  icone: <Sunrise className="w-4 h-4 text-orange-400" />,
                },
                {
                  id: "anoitecer" as TipoTema,
                  label: "Modo Anoitecer",
                  descricao: "Degradê crepuscular com roxo e azul-marinho.",
                  icone: <Sunset className="w-4 h-4 text-purple-400" />,
                },
              ].map((opcao) => {
                const isAtivo = temaAtual === opcao.id;

                return (
                  <div
                    key={opcao.id}
                    onClick={() => onTemaChange(opcao.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-1.5 ${
                      isAtivo
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-sm"
                        : "bg-black/5 dark:bg-white/[0.02] border-[var(--card-border)] hover:bg-black/10 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5">
                          {opcao.icone}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                          {opcao.label}
                        </span>
                      </div>
                      {isAtivo && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                      {opcao.descricao}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 4: PRIVACIDADE & DADOS                                 */}
        {/* ========================================================= */}
        {abaAtiva === "dados" && (
          <div className="space-y-4 animate-fade-in text-xs text-[var(--text-muted)] leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-[var(--text-main)]">
              <div className="flex items-center gap-2 font-bold text-emerald-500 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Privacidade & LGPD em Primeiro Lugar</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                O ClimaBR não possui banco de dados central nem rastreadores. Suas cidades recentes, favoritas, preferências de visualização e notificações ficam estritamente no armazenamento local do seu próprio navegador.
              </p>
              {onAbrirPrivacidade && (
                <button
                  type="button"
                  onClick={onAbrirPrivacidade}
                  className="text-xs text-emerald-400 font-bold underline underline-offset-2 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Abrir Relatório Completo de Governança LGPD &rarr;
                </button>
              )}
            </div>

            {/* Ação Crítica: Limpar tudo */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Limpar Todos os Dados e Preferências</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Apaga histórico, favoritos, configurações de tela e alertas do seu navegador.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLimparTodosDados}
                className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                {dadosLimpos ? "Dados Apagados!" : "Limpar Tudo"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

