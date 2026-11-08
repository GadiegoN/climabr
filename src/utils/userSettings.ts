import { ConfiguracoesVisualizacao, CONFIG_VISUALIZACAO_PADRAO } from "@/types/settings";

export const CONFIG_VISUALIZACAO_STORAGE_KEY = "climabr_config_visualizacao";

/**
 * Recupera as preferências de exibição de cards do usuário salvas no localStorage.
 */
export function getConfiguracoesVisualizacao(): ConfiguracoesVisualizacao {
  if (typeof window === "undefined") return CONFIG_VISUALIZACAO_PADRAO;

  try {
    const salvo = localStorage.getItem(CONFIG_VISUALIZACAO_STORAGE_KEY);
    if (salvo) {
      return { ...CONFIG_VISUALIZACAO_PADRAO, ...JSON.parse(salvo) };
    }
  } catch {
    // Ignora erros de JSON ou storage
  }

  return CONFIG_VISUALIZACAO_PADRAO;
}

/**
 * Salva as preferências de exibição no localStorage.
 */
export function salvarConfiguracoesVisualizacao(config: ConfiguracoesVisualizacao): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CONFIG_VISUALIZACAO_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignora erro de quota
  }
}

/**
 * Redefine todas as preferências de visualização para o padrão (todos visíveis).
 */
export function restaurarConfiguracoesPadrao(): ConfiguracoesVisualizacao {
  salvarConfiguracoesVisualizacao(CONFIG_VISUALIZACAO_PADRAO);
  return CONFIG_VISUALIZACAO_PADRAO;
}

