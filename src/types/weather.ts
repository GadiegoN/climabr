// Tipagens para a API de Localidades do IBGE
export interface RegiaoIBGE {
  id: number;
  sigla: string;
  nome: string;
}

export interface EstadoIBGE {
  id: number;
  sigla: string;
  nome: string;
  regiao: RegiaoIBGE;
}

export interface MunicipioIBGE {
  id: number;
  nome: string;
}

// Tipagens para a API de Malhas do IBGE (Metadados / Coordenadas)
export interface CentroideIBGE {
  latitude?: number;
  longitude?: number;
  coordenadas?: [number, number]; // [longitude, latitude]
}

export interface MetadadoMalhaIBGE {
  id: string | number;
  "nivel-geografico"?: string;
  centroide: CentroideIBGE;
}

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

// Tipagens para a API Open-Meteo Weather
export interface OpenMeteoCurrentWeatherUnits {
  time?: string;
  interval?: string;
  temperature?: string;
  windspeed?: string;
  winddirection?: string;
  is_day?: string;
  weathercode?: string;
}

export interface OpenMeteoCurrentWeather {
  time: string;
  interval?: number;
  temperature: number;
  windspeed: number;
  winddirection: number;
  is_day: number;
  weathercode: number;
  relative_humidity?: number;
  apparent_temperature?: number;
  precipitation?: number;
  nascerDoSol?: string;
  porDoSol?: string;
}

export interface PrevisaoDiariaItem {
  data: string;
  codigoClima: number;
  tempMax: number;
  tempMin: number;
  probabilidadeChuva?: number;
}

export interface PrevisaoHorariaItem {
  hora: string;
  temperatura: number;
  codigoClima: number;
  probabilidadeChuva?: number;
}

// Tipagem para Qualidade do Ar, Índice UV & Potencial Solar
export interface QualidadeArDados {
  aqi?: number;
  uvIndex?: number;
  pm25?: number;
  pm10?: number;
  radiacaoSolarKwh?: number; // kWh/m² por dia
  potencialSolar?: "Excelente" | "Bom" | "Moderado" | "Baixo";
}

// Tipagem para Wikipedia (Foto e Resumo da Cidade)
export interface WikipediaResumo {
  titulo: string;
  descricao?: string;
  extrato?: string;
  imagemUrl?: string;
  paginaUrl?: string;
}

// Tipagem para Notícias Integradas (IBGE, Agência Brasil / EBC, G1 Clima)
export type CategoriaNoticia = "todas" | "ibge" | "ebc" | "clima" | "regional";

export interface NoticiaIBGE {
  id: number | string;
  titulo: string;
  introducao: string;
  data_publicacao: string;
  link: string;
  editorias?: string;
  fonte?: "ibge" | "ebc" | "clima" | "regional";
  fonteNome?: string;
  categoria?: CategoriaNoticia;
  imagemUrl?: string;
}

// Tipagem para Alertas do INMET (com detalhes avançados de riscos e instruções)
export interface AlertaINMET {
  id: number | string;
  evento: string;
  severidade: string;
  nivel: number;
  inicio: string;
  fim: string;
  riscos?: string[];
  instrucoes?: string[];
  url?: string;
  municipiosAfetados?: number;
  afetaMunicipioAtual?: boolean;
  corHex?: string;
}

// Tipagem para Alertas do CEMADEN (Centro Nacional de Monitoramento e Alertas de Desastres Naturais)
export interface AlertaCEMADEN {
  codAlerta: number;
  codibge?: number;
  evento: string; // Ex: "Risco Hidrológico - Moderado", "Movimento de Massa - Alto"
  nivel: string; // "Moderado" | "Alto" | "Muito Alto"
  uf: string;
  municipio: string;
  dataHoraCriacao?: string;
}

// Tipagem para Risco de Queimadas & Fogo (Modelo Meteorológico Monte Alegre / INPE)
export interface RiscoFogo {
  nivel: "Baixo" | "Moderado" | "Alto" | "Muito Alto" | "Crítico";
  indice: number; // 0 a 100
  descricao: string;
  corHex: string;
  recomendacao: string;
}

// Tipagem para Ponto do Índice Oceânico do Niño (ONI / NOAA)
export interface PontoONI {
  periodo: string; // Ex: "Ago-Set-Out"
  ano: number;
  anomalia: number; // Ex: +2.46
  total: number;
}

// Tipagem para Impacto Regional do El Niño / La Niña
export interface ImpactoRegionalENSO {
  regiao: string;
  titulo: string;
  descricao: string;
  efeitosChuva: string;
  efeitosTemperatura: string;
}

// Tipagem Geral para Monitoramento do El Niño / La Niña (ENSO)
export interface DadosElNino {
  fase: "El Niño" | "La Niña" | "Neutro";
  intensidade: "Fraco" | "Moderado" | "Forte" | "Muito Forte" | "Neutro";
  anomaliaAtual: number; // Ex: +2.46
  periodoAtual: string; // Ex: "Ago-Set-Out 2026"
  descricao: string;
  corHex: string;
  badgeClass: string;
  historicoRecente: PontoONI[];
  impactoRegional: ImpactoRegionalENSO;
}

// Histórico de buscas recentes e favoritos salvos no navegador (LocalStorage)
export interface CidadeHistorico {
  municipioId: string;
  municipioNome: string;
  uf: string;
  coordenadas?: Coordenadas;
}

// Tipos para o Sistema de Temas Visuais
export type TipoTema = "auto" | "claro" | "escuro" | "amanhecer" | "anoitecer";

// Tipagem para Condições Marinhas e Oceânicas (Open-Meteo Marine)
export interface CondicoesMarinhas {
  alturaOnda: number; // metros
  direcaoOnda: number; // graus
  periodoOnda: number; // segundos
  temperaturaAgua?: number; // °C
  ondulacao?: number; // metros (swell)
  maxOndaHoje?: number;
  condicaoBanho: "Calmo" | "Moderado" | "Agitado" | "Ressaca";
  descricaoBanho: string;
  badgeCor: string;
}

// Tipagem para Painel Agroclimatológico & Solo (Open-Meteo Agro)
export interface PrevisaoET0Item {
  data: string;
  et0: number; // mm
}

export interface DadosAgro {
  umidadeSoloPct: number; // %
  temperaturaSolo: number; // °C
  et0Hoje: number; // mm
  et0Semana: PrevisaoET0Item[];
  statusIrrigacao: string;
  badgeIrrigacao: string;
  recomendacaoIrrigacao: string;
  statusPulverizacao: string;
  badgePulverizacao: string;
  recomendacaoPulverizacao: string;
}

// Estrutura agregada completa para exibição no Dashboard
export interface DadosClimaCidade {
  municipioId: string;
  municipio: string;
  uf: string;
  coordenadas: Coordenadas;
  clima: OpenMeteoCurrentWeather;
  unidades: OpenMeteoCurrentWeatherUnits;
  previsaoDiaria?: PrevisaoDiariaItem[];
  previsaoHoraria?: PrevisaoHorariaItem[];
  qualidadeAr?: QualidadeArDados;
  wikipedia?: WikipediaResumo;
  noticiasIBGE?: NoticiaIBGE[];
  alertasINMET?: AlertaINMET[];
  alertasCEMADEN?: AlertaCEMADEN[];
  riscoFogo?: RiscoFogo;
  elNino?: DadosElNino;
  condicoesMarinhas?: CondicoesMarinhas | null;
  agro?: DadosAgro;
}

// Tipagem para descrição e estilo visual da condição climática
export interface CondicaoVisualClima {
  descricao: string;
  icone: "sun" | "moon" | "cloud-sun" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "thunderstorm";
  gradienteFundo: string;
  badgeCor: string;
  corTexto: string;
}
