/**
 * Módulo de Gerenciamento de Notificações Locais & PWA do ClimaBR
 * LGPD & PRIVACIDADE:
 * - 100% Opt-in: nenhuma notificação é enviada sem autorização explícita do usuário.
 * - Todos os dados de preferências de horário (08h e 20h) e cidade ficam gravados exclusivamente no localStorage.
 * - Zero coleta de dados pessoais, e-mail ou identificadores de rastreamento.
 * - Desativação imediata (Opt-out) com 1 clique a qualquer momento.
 */

export const NOTIFICACOES_STORAGE_KEY = "climabr_notificacoes_config";

export interface NotificacoesConfig {
  ativa: boolean;
  horarioManha: boolean; // 08:00
  horarioNoite: boolean; // 20:00
  cidadeId: string;
  cidadeNome: string;
  uf: string;
  coordenadas?: { latitude: number; longitude: number };
  ultimaDataManha?: string; // YYYY-MM-DD
  ultimaDataNoite?: string; // YYYY-MM-DD
}

export const CONFIG_PADRAO: NotificacoesConfig = {
  ativa: false,
  horarioManha: true, // 08:00
  horarioNoite: true, // 20:00
  cidadeId: "",
  cidadeNome: "",
  uf: "",
};

/**
 * Registra o Service Worker do ClimaBR no navegador e aguarda ativação.
 */
export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    // Aguarda o Service Worker estar 100% ativo e pronto para notificações
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn("Falha ao registrar Service Worker do ClimaBR:", err);
    return null;
  }
}

/**
 * Obtém o status da permissão de notificações do navegador.
 */
export function getStatusPermissao(): "granted" | "denied" | "default" | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Solicita formalmente a permissão ao usuário.
 */
export async function solicitarPermissao(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return await Notification.requestPermission();
}

/**
 * Recupera as preferências de notificações salvas localmente.
 */
export function getNotificacoesConfig(): NotificacoesConfig {
  if (typeof window === "undefined") return CONFIG_PADRAO;
  try {
    const salvo = localStorage.getItem(NOTIFICACOES_STORAGE_KEY);
    if (salvo) {
      return { ...CONFIG_PADRAO, ...JSON.parse(salvo) };
    }
  } catch {
    // Ignora erros
  }
  return CONFIG_PADRAO;
}

/**
 * Salva as preferências de notificação no localStorage.
 */
export function salvarNotificacoesConfig(config: NotificacoesConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICACOES_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignora erros de quota
  }
}

/**
 * Dispara uma notificação nativa através do Service Worker com fallback.
 */
export async function emitirNotificacao(
  titulo: string,
  corpo: string,
  urlDestino: string = "/",
  tag: string = "climabr-alerta"
): Promise<boolean> {
  if (getStatusPermissao() !== "granted") {
    console.warn("ClimaBR: Permissão de notificação não concedida.");
    return false;
  }

  // Tag única com timestamp para impedir que o Windows suprima a notificação como duplicada
  const tagUnica = `${tag}-${Date.now()}`;
  const opcoes: NotificationOptions = {
    body: corpo,
    icon: "/icon",
    badge: "/icon",
    tag: tagUnica,
    data: { url: urlDestino },
    silent: false,
  };

  // 1. Tenta disparar via Service Worker (Método recomendado para PWA / Mobile)
  try {
    const registration = await registrarServiceWorker();
    if (registration && typeof registration.showNotification === "function") {
      await registration.showNotification(titulo, opcoes);
      console.log("ClimaBR: Notificação disparada com sucesso via Service Worker.", { titulo, corpo });
      return true;
    }
  } catch (swErr) {
    console.warn("ClimaBR: Falha ao emitir via Service Worker, tentando fallback direto:", swErr);
  }

  // 2. Fallback direto via new Notification() (Desktop Chrome / Firefox / Safari)
  try {
    const n = new Notification(titulo, opcoes);
    n.onclick = () => {
      window.focus();
      if (urlDestino && typeof window !== "undefined") {
        window.location.href = urlDestino;
      }
    };
    console.log("ClimaBR: Notificação disparada com sucesso via Notification API.", { titulo, corpo });
    return true;
  } catch (notifErr) {
    console.error("ClimaBR: Erro ao disparar notificação no navegador:", notifErr);
    return false;
  }
}

/**
 * Dispara notificação imediata de demonstração / teste.
 */
export async function dispararNotificacaoTeste(
  cidadeNome: string,
  uf: string,
  tempAtual: number,
  condicao: string,
  max?: number,
  min?: number,
  chuva?: number
): Promise<boolean> {
  const titulo = `⛅ Clima em ${cidadeNome} - ${uf}: ${tempAtual}°C`;
  const detalhes = [
    condicao,
    max !== undefined ? `Máx: ${max}°C` : "",
    min !== undefined ? `Mín: ${min}°C` : "",
    chuva !== undefined && chuva > 0 ? `Chuva: ${chuva}%` : "Sem chuva",
  ]
    .filter(Boolean)
    .join(" • ");

  const corpo = `${detalhes}. Notificação de teste do ClimaBR ativada com sucesso!`;
  return await emitirNotificacao(titulo, corpo, "/", "climabr-teste");
}

/**
 * Rotina inteligente que verifica se é hora de enviar a notificação das 08h ou 20h.
 */
export async function checarEAgendarNotificacaoAutomatica(
  cidadeNome: string,
  uf: string,
  tempAtual: number,
  condicao: string,
  max?: number,
  min?: number,
  chuva?: number,
  cidadeId?: string
): Promise<void> {
  const config = getNotificacoesConfig();
  if (!config.ativa || getStatusPermissao() !== "granted") return;

  // Garante que a notificação automática seja disparada apenas para a cidade monitorada
  if (config.cidadeId && cidadeId && config.cidadeId !== cidadeId) {
    return;
  }

  const agora = new Date();
  const hora = agora.getHours();
  const hojeStr = agora.toISOString().slice(0, 10); // YYYY-MM-DD
  const urlDestino = cidadeId ? `/?uf=${encodeURIComponent(uf)}&cidadeId=${encodeURIComponent(cidadeId)}&cidade=${encodeURIComponent(cidadeNome)}` : "/";

  // 1. Janela da Manhã (08:00 às 09:59)
  if (config.horarioManha && (hora === 8 || hora === 9) && config.ultimaDataManha !== hojeStr) {
    const titulo = `☀️ Bom dia! Previsão para ${cidadeNome} (${tempAtual}°C)`;
    const dicas = [];
    if (chuva && chuva >= 50) {
      dicas.push(`Alta probabilidade de chuva (${chuva}%). Leve guarda-chuva!`);
    } else if (tempAtual >= 28) {
      dicas.push(`Dia quente (máxima de ${max ?? tempAtual}°C). Beba bastante água.`);
    } else if (tempAtual <= 16) {
      dicas.push(`Manhã fria (mínima de ${min ?? tempAtual}°C). Leve agasalho.`);
    } else {
      dicas.push(`Condição: ${condicao}. Tenha um ótimo dia!`);
    }

    const sucesso = await emitirNotificacao(titulo, dicas.join(" "), urlDestino, "climabr-manha");
    if (sucesso) {
      config.ultimaDataManha = hojeStr;
      salvarNotificacoesConfig(config);
    }
  }

  // 2. Janela da Noite (20:00 às 21:59)
  if (config.horarioNoite && (hora === 20 || hora === 21) && config.ultimaDataNoite !== hojeStr) {
    const titulo = `🌙 Boa noite! Clima em ${cidadeNome}: ${tempAtual}°C`;
    const resumo = `Temperatura atual: ${tempAtual}°C com ${condicao.toLowerCase()}. Mínima prevista para a madrugada: ${min ?? tempAtual}°C.`;

    const sucesso = await emitirNotificacao(titulo, resumo, urlDestino, "climabr-noite");
    if (sucesso) {
      config.ultimaDataNoite = hojeStr;
      salvarNotificacoesConfig(config);
    }
  }
}

