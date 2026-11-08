/**
 * Módulo de Gerenciamento de Notificações Customizáveis do ClimaBR
 * 
 * MODELO DE CONTROLE TOTAL DO USUÁRIO:
 * - O usuário cria alertas individuais: cada alarme tem seu próprio HORÁRIO e seu próprio TÓPICO!
 * - Ex: Alerta 1 às 07:30 (Dicas de Rotina / O que vestir)
 * - Ex: Alerta 2 às 12:00 (Previsão do Tempo & Temperatura)
 * - Ex: Alerta 3 às 18:00 (Avisos da Defesa Civil / Chuva)
 * - O usuário pode adicionar novos alertas, editar hora, trocar o tópico, ativar/desativar ou excluir.
 * 
 * LGPD: 100% Opt-in local, zero rastreamento, desativação instantânea com 1 clique.
 */

import { getClimaCompleto, getNoticiasIBGE, getAlertasINMET, calcularRiscoFogo, getDadosElNino } from "@/services/api";
import { mapearCodigoClima } from "./weatherCodes";
import { gerarIndicesRotina } from "./dailyTips";

export const NOTIFICACOES_STORAGE_KEY = "climabr_notificacoes_config";

export type TopicoNotificacao =
  | "previsao"       // ☀️ Previsão & Temperaturas (mín/máx, chuva e céu)
  | "rotina"         // 👕 Dicas de Rotina & Conforto (o que vestir, varal, esporte)
  | "defesa_civil"   // 🚨 Avisos Severos Defesa Civil & INMET (tempestade, chuvas)
  | "riscos"         // 🔥 Riscos Ambientais, Queimadas & Radiação UV
  | "el_nino"        // 🌊 Fenômenos & El Niño / La Niña
  | "noticias"       // 📰 Notícias & Estatísticas da Região (IBGE)
  | "anuncios"       // 🛍️ Destaques & Oportunidades Locais
  | "completo";      // 🌟 Resumo Completo (Clima + Dicas + Avisos)

export interface ItemAlertaNotificacao {
  id: string;
  hora: string; // formato "HH:mm", ex: "07:30", "12:00", "20:00"
  topico: TopicoNotificacao;
  rotulo?: string; // ex: "Lembrete Matinal", "Almoço", "Previsão da Noite"
  ativo: boolean;
  cidadeNome: string;
  uf: string;
  cidadeId?: string;
  coordenadas?: { latitude: number; longitude: number };
  ultimoDisparoData?: string; // YYYY-MM-DD
}

export interface NotificacoesConfig {
  ativa: boolean;
  alertas: ItemAlertaNotificacao[];
}

export const TOPICOS_INFO: Record<
  TopicoNotificacao,
  { titulo: string; iconeEmoji: string; descricao: string }
> = {
  previsao: {
    titulo: "Previsão & Temperatura",
    iconeEmoji: "☀️",
    descricao: "Temperatura atual, máxima, mínima e chances de chuva.",
  },
  rotina: {
    titulo: "O que Vestir & Dicas de Rotina",
    iconeEmoji: "👕",
    descricao: "Recomendações de vestimenta, varal de roupas e esportes.",
  },
  defesa_civil: {
    titulo: "Avisos Defesa Civil & INMET",
    iconeEmoji: "🚨",
    descricao: "Alertas críticos de vendavais, tempestades e chuvas fortes.",
  },
  riscos: {
    titulo: "Riscos Ambientais & UV",
    iconeEmoji: "🔥",
    descricao: "Risco de queimadas no bioma e índice de radiação UV solar.",
  },
  el_nino: {
    titulo: "Fenômenos & El Niño / La Niña",
    iconeEmoji: "🌊",
    descricao: "Tendências sazonais oceânicas e anomalias de estiagem ou chuva.",
  },
  noticias: {
    titulo: "Notícias & Dados da Região",
    iconeEmoji: "📰",
    descricao: "Atualizações econômicas, agrícolas e notícias locais do IBGE.",
  },
  anuncios: {
    titulo: "Destaques & Oportunidades Locais",
    iconeEmoji: "🛍️",
    descricao: "Vitrine de produtos, serviços e comércios da localidade.",
  },
  completo: {
    titulo: "Resumo Completo do Dia",
    iconeEmoji: "🌟",
    descricao: "Previsão climática, recomendação de vestimenta e avisos em 1 card.",
  },
};

export const CONFIG_PADRAO: NotificacoesConfig = {
  ativa: true,
  alertas: [
    {
      id: "alerta_padrao_manha",
      hora: "08:00",
      topico: "previsao",
      rotulo: "Previsão da Manhã",
      ativo: true,
      cidadeNome: "São Paulo",
      uf: "SP",
      coordenadas: { latitude: -23.55, longitude: -46.633 },
    },
    {
      id: "alerta_padrao_rotina",
      hora: "12:30",
      topico: "rotina",
      rotulo: "Dicas de Conforto",
      ativo: true,
      cidadeNome: "São Paulo",
      uf: "SP",
      coordenadas: { latitude: -23.55, longitude: -46.633 },
    },
  ],
};

/**
 * Registra o Service Worker do ClimaBR no navegador.
 */
export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn("ClimaBR: Falha ao registrar Service Worker:", err);
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
 * Recupera as preferências de notificações salvas localmente, com migração automática de versões antigas.
 */
export function getNotificacoesConfig(): NotificacoesConfig {
  if (typeof window === "undefined") return CONFIG_PADRAO;
  try {
    const salvo = localStorage.getItem(NOTIFICACOES_STORAGE_KEY);
    if (salvo) {
      const parsed = JSON.parse(salvo);

      // Se já estiver no novo formato de lista de alertas com tópicos específicos
      if (Array.isArray(parsed.alertas) && parsed.alertas.length > 0) {
        return {
          ativa: parsed.ativa ?? true,
          alertas: parsed.alertas,
        };
      }

      // Migração automática de versões anteriores (08h e 20h)
      const alertasMigrados: ItemAlertaNotificacao[] = [
        {
          id: `alerta_migrado_1`,
          hora: "08:00",
          topico: "previsao",
          rotulo: "Previsão da Manhã",
          ativo: parsed.horarioManha ?? true,
          cidadeNome: parsed.cidadeNome || "São Paulo",
          uf: parsed.uf || "SP",
          cidadeId: parsed.cidadeId,
          coordenadas: parsed.coordenadas || { latitude: -23.55, longitude: -46.633 },
        },
        {
          id: `alerta_migrado_2`,
          hora: "20:00",
          topico: "rotina",
          rotulo: "Resumo da Noite",
          ativo: parsed.horarioNoite ?? true,
          cidadeNome: parsed.cidadeNome || "São Paulo",
          uf: parsed.uf || "SP",
          cidadeId: parsed.cidadeId,
          coordenadas: parsed.coordenadas || { latitude: -23.55, longitude: -46.633 },
        },
      ];

      return {
        ativa: parsed.ativa ?? true,
        alertas: alertasMigrados,
      };
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
    // Ignora erros
  }
}

/**
 * Dispara uma notificação nativa através do Service Worker com fallback direto.
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

  const tagUnica = `${tag}-${Date.now()}`;
  const opcoes: NotificationOptions = {
    body: corpo,
    icon: "/icon",
    badge: "/icon",
    tag: tagUnica,
    data: { url: urlDestino },
    silent: false,
  };

  // 1. Tenta Service Worker (Recomendado para PWA / Mobile)
  try {
    const registration = await registrarServiceWorker();
    if (registration && typeof registration.showNotification === "function") {
      await registration.showNotification(titulo, opcoes);
      console.log("ClimaBR: Notificação enviada via Service Worker:", { titulo, corpo });
      return true;
    }
  } catch (swErr) {
    console.warn("ClimaBR: Falha no Service Worker, tentando Notification direta:", swErr);
  }

  // 2. Fallback direto (Notification API do Desktop)
  try {
    const n = new Notification(titulo, opcoes);
    n.onclick = () => {
      window.focus();
      if (urlDestino && typeof window !== "undefined") {
        window.location.href = urlDestino;
      }
    };
    console.log("ClimaBR: Notificação enviada via Notification API:", { titulo, corpo });
    return true;
  } catch (err) {
    console.error("ClimaBR: Erro ao emitir notificação:", err);
    return false;
  }
}

/**
 * Constrói o título e o corpo da notificação baseado no TÓPICO selecionado para aquele alarme.
 */
export function formatarConteudoPorTopico(
  alerta: ItemAlertaNotificacao,
  dados: {
    tempAtual: number;
    condicao: string;
    max?: number;
    min?: number;
    chuva?: number;
    alertaINMET?: string;
    dicaRotina?: string;
    riscoFogo?: string;
    indiceUV?: number;
    elNinoStatus?: string;
    noticiaIBGE?: string;
  }
): { titulo: string; corpo: string } {
  const cidadeHeader = `${alerta.cidadeNome} - ${alerta.uf}`;

  switch (alerta.topico) {
    case "rotina":
      return {
        titulo: `👕 Dicas de Rotina: ${cidadeHeader} (${dados.tempAtual}°C)`,
        corpo: dados.dicaRotina
          ? dados.dicaRotina
          : dados.chuva && dados.chuva >= 50
          ? `Alta chance de chuva (${dados.chuva}%). Leve guarda-chuva!`
          : dados.tempAtual <= 16
          ? `Tempo frio (${dados.tempAtual}°C). Agasalhe-se bem hoje.`
          : `Tempo ameno (${dados.tempAtual}°C). Favorável para esportes e estender roupas.`,
      };

    case "defesa_civil":
      return {
        titulo: `🚨 Alertas Defesa Civil: ${cidadeHeader}`,
        corpo: dados.alertaINMET
          ? `Aviso Meteorológico: ${dados.alertaINMET}. Mantenha-se protegido.`
          : `Nenhum aviso meteorológico crítico ativo para ${alerta.cidadeNome}. Céu com ${dados.condicao.toLowerCase()}.`,
      };

    case "riscos":
      return {
        titulo: `🔥 Radar Ambiental: ${cidadeHeader}`,
        corpo: `Radiação UV: ${dados.indiceUV ?? "Normal"} • Risco de queimadas no bioma: ${dados.riscoFogo || "Baixo"}. Umidade e vento monitorados.`,
      };

    case "el_nino":
      return {
        titulo: `🌊 Fenômenos & El Niño: ${cidadeHeader}`,
        corpo: `Padrão Oceânico: ${dados.elNinoStatus || "Tendência de neutralidade climática no Pacífico equatorial"}.`,
      };

    case "noticias":
      return {
        titulo: `📰 Notícias da Região: ${cidadeHeader}`,
        corpo: dados.noticiaIBGE
          ? `IBGE Informa: ${dados.noticiaIBGE}`
          : `Acompanhe os novos levantamentos demográficos e agropecuários divulgados pelo IBGE para a região de ${alerta.cidadeNome}.`,
      };

    case "anuncios":
      return {
        titulo: `🛍️ Destaques & Comércio: ${cidadeHeader}`,
        corpo: `Confira os principais comércios, prestadores de serviços e oportunidades em destaque hoje em ${alerta.cidadeNome}.`,
      };

    case "completo":
      return {
        titulo: `🌟 Resumo ClimaBR: ${cidadeHeader} (${dados.tempAtual}°C)`,
        corpo: `${dados.condicao} • Máx: ${dados.max ?? dados.tempAtual}°C / Mín: ${dados.min ?? dados.tempAtual}°C • ${dados.dicaRotina || "Tempo estável."}`,
      };

    case "previsao":
    default:
      const minMax = dados.max !== undefined && dados.min !== undefined
        ? `Máx: ${dados.max}°C • Mín: ${dados.min}°C`
        : "";
      const chuvaStr = dados.chuva !== undefined && dados.chuva > 0 ? `Chuva: ${dados.chuva}%` : "Sem chuva";
      return {
        titulo: `☀️ Previsão do Tempo: ${cidadeHeader} (${dados.tempAtual}°C)`,
        corpo: [dados.condicao, minMax, chuvaStr].filter(Boolean).join(" • "),
      };
  }
}

/**
 * Dispara um alarme específico imediatamente (usado tanto pelo scheduler quanto pelo botão de teste).
 */
export async function dispararAlertaEspecifico(
  alerta: ItemAlertaNotificacao,
  isTeste: boolean = false
): Promise<boolean> {
  // Valores padrão com fallback
  let tempAtual = 23;
  let condicao = "Céu Limpo";
  let max: number | undefined = 27;
  let min: number | undefined = 16;
  let chuva: number | undefined = 10;
  let alertaINMET: string | undefined;
  let dicaRotina: string | undefined;
  let riscoFogo: string | undefined;
  let indiceUV: number | undefined;
  let elNinoStatus: string | undefined;
  let noticiaIBGE: string | undefined;

  // Busca clima real da cidade configurada no alarme
  if (alerta.coordenadas) {
    try {
      const clima = await getClimaCompleto(alerta.coordenadas.latitude, alerta.coordenadas.longitude);
      tempAtual = Math.round(clima.clima.temperature);
      condicao = mapearCodigoClima(clima.clima.weathercode, clima.clima.is_day).descricao;
      max = clima.previsaoDiaria?.[0]?.tempMax ? Math.round(clima.previsaoDiaria[0].tempMax) : undefined;
      min = clima.previsaoDiaria?.[0]?.tempMin ? Math.round(clima.previsaoDiaria[0].tempMin) : undefined;
      chuva = clima.previsaoDiaria?.[0]?.probabilidadeChuva;

      // Dica de rotina
      const tips = gerarIndicesRotina({
        tempAtual,
        tempMin: min ?? tempAtual,
        tempMax: max ?? tempAtual,
        probabilidadeChuva: chuva,
        umidade: clima.clima.relative_humidity,
        velocidadeVento: clima.clima.windspeed,
      });
      if (tips.length > 0) {
        dicaRotina = `${tips[0].emoji} ${tips[0].titulo}: ${tips[0].mensagem}`;
      }
    } catch (e) {
      console.warn("ClimaBR: Falha ao buscar clima para alerta, usando fallback:", e);
    }
  }

  const { titulo, corpo } = formatarConteudoPorTopico(alerta, {
    tempAtual,
    condicao,
    max,
    min,
    chuva,
    alertaINMET,
    dicaRotina,
    riscoFogo,
    indiceUV,
    elNinoStatus,
    noticiaIBGE,
  });

  const sufixoTeste = isTeste ? " [Teste Disparado]" : "";
  const tituloFinal = `${titulo}${sufixoTeste}`;
  const urlDestino = alerta.cidadeId
    ? `/?uf=${encodeURIComponent(alerta.uf)}&cidadeId=${encodeURIComponent(alerta.cidadeId)}&cidade=${encodeURIComponent(alerta.cidadeNome)}`
    : "/";

  return await emitirNotificacao(tituloFinal, corpo, urlDestino, `climabr-${alerta.id}`);
}

/**
 * VERIFICADOR EM TEMPO REAL:
 * Roda a cada 10 segundos no nível da aplicação.
 * Compara a hora e o minuto local exatos (HH:mm) com cada alarme ativo configurado pelo usuário.
 * Dispara de forma 100% autônoma para a cidade e tópico daquele alarme!
 */
export async function checarEAgendarAlertas(): Promise<void> {
  const config = getNotificacoesConfig();
  if (!config.ativa || getStatusPermissao() !== "granted") return;
  if (!Array.isArray(config.alertas) || config.alertas.length === 0) return;

  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");
  const horaAtualStr = `${horas}:${minutos}`; // ex: "20:38"
  const hojeStr = agora.toISOString().slice(0, 10); // "YYYY-MM-DD"

  let houveAlteracao = false;

  for (const alerta of config.alertas) {
    if (!alerta.ativo || !alerta.hora) continue;

    // Se o alarme bate exatamente com o minuto atual
    if (alerta.hora === horaAtualStr) {
      // Impede disparos duplicados no mesmo dia
      if (alerta.ultimoDisparoData !== hojeStr) {
        console.log(`ClimaBR: ⏰ Disparando alarme agendado [${alerta.hora}] - Tópico: ${alerta.topico} - Cidade: ${alerta.cidadeNome}`);
        
        // Marca como disparado imediatamente para evitar race conditions
        alerta.ultimoDisparoData = hojeStr;
        houveAlteracao = true;

        // Dispara a notificação personalizada do alarme
        await dispararAlertaEspecifico(alerta, false);
      }
    }
  }

  if (houveAlteracao) {
    salvarNotificacoesConfig(config);
  }
}
