import { TipoTema } from "./weather";

export interface ConfiguracoesVisualizacao {
  mostrarGrafico24h: boolean;         // Gráfico de curva térmica & chuva 24h
  mostrarHoraAHora: boolean;          // Carrossel hora a hora & 7 dias
  mostrarDicasRotina: boolean;        // Dicas do dia (o que vestir, varal, lavar carro)
  mostrarQualidadeArUV: boolean;      // Card de Qualidade do Ar & Índice UV
  mostrarRadarChuva: boolean;         // Radar RainViewer ao vivo
  mostrarAgro: boolean;               // Botão e painel Agroclimatológico & Solo
  mostrarLitoral: boolean;            // Aba Modo Litoral & Marés
  mostrarInsightsTabs: boolean;       // Bloco de abas (Mapa, História, Notícias)
  mostrarAnunciosMock: boolean;       // Vitrine de anúncios demonstrativos
  mostrarAlertasDefesaCivil: boolean; // Banner de avisos severos do INMET
}

export const CONFIG_VISUALIZACAO_PADRAO: ConfiguracoesVisualizacao = {
  mostrarGrafico24h: true,
  mostrarHoraAHora: true,
  mostrarDicasRotina: true,
  mostrarQualidadeArUV: true,
  mostrarRadarChuva: true,
  mostrarAgro: true,
  mostrarLitoral: true,
  mostrarInsightsTabs: true,
  mostrarAnunciosMock: true,
  mostrarAlertasDefesaCivil: true,
};

