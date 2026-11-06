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

// Tipagem para Qualidade do Ar & Índice UV
export interface QualidadeArDados {
  aqi?: number;
  uvIndex?: number;
  pm25?: number;
  pm10?: number;
}

// Tipagem para Wikipedia (Foto e Resumo da Cidade)
export interface WikipediaResumo {
  titulo: string;
  descricao?: string;
  extrato?: string;
  imagemUrl?: string;
  paginaUrl?: string;
}

// Tipagem para Notícias do IBGE
export interface NoticiaIBGE {
  id: number;
  titulo: string;
  introducao: string;
  data_publicacao: string;
  link: string;
  editorias?: string;
}

// Tipagem para Alertas do INMET
export interface AlertaINMET {
  id: number | string;
  aviso_id?: number | string;
  severidade: string;
  descricao: string;
  titulo: string;
  inicio: string;
  fim: string;
  corHex?: string;
}

// Histórico de buscas recentes salvas no navegador (LocalStorage)
export interface CidadeHistorico {
  municipioId: string;
  municipioNome: string;
  uf: string;
}

// Tipos para o Sistema de Temas Visuais
export type TipoTema = "auto" | "claro" | "escuro" | "amanhecer" | "anoitecer";

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
}

// Tipagem para descrição e estilo visual da condição climática
export interface CondicaoVisualClima {
  descricao: string;
  icone: "sun" | "moon" | "cloud-sun" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "thunderstorm";
  gradienteFundo: string;
  badgeCor: string;
  corTexto: string;
}
