import {
  EstadoIBGE,
  MunicipioIBGE,
  MetadadoMalhaIBGE,
  Coordenadas,
  OpenMeteoCurrentWeather,
  OpenMeteoCurrentWeatherUnits,
  PrevisaoDiariaItem,
  PrevisaoHorariaItem,
  QualidadeArDados,
  WikipediaResumo,
  NoticiaIBGE,
  AlertaINMET,
  AlertaCEMADEN,
  RiscoFogo,
} from "@/types/weather";

const IBGE_LOCALIDADES_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const IBGE_MALHAS_BASE = "https://servicodados.ibge.gov.br/api/v3/malhas";
const IBGE_NOTICIAS_BASE = "https://servicodados.ibge.gov.br/api/v3/noticias";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_AIR_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";
const INMET_ALERTAS_BASE = "https://apiprevmet3.inmet.gov.br/aviso/ativos";

/**
 * 1. Lista de estados brasileiros ordenados por nome.
 */
export async function getEstados(): Promise<EstadoIBGE[]> {
  const response = await fetch(`${IBGE_LOCALIDADES_BASE}/estados?orderBy=nome`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar estados do IBGE (Status: ${response.status})`);
  }
  return response.json();
}

/**
 * 2. Cidades pertencentes a uma UF ordenadas por nome.
 */
export async function getMunicipiosPorUF(uf: string): Promise<MunicipioIBGE[]> {
  if (!uf) return [];
  const response = await fetch(
    `${IBGE_LOCALIDADES_BASE}/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`
  );
  if (!response.ok) {
    throw new Error(`Falha ao carregar cidades da UF "${uf}"`);
  }
  return response.json();
}

/**
 * 3. Coordenadas geográficas a partir do ID do município na API de Malhas do IBGE.
 */
export async function getCoordenadasMunicipio(idMunicipio: number | string): Promise<Coordenadas> {
  const response = await fetch(`${IBGE_MALHAS_BASE}/municipios/${idMunicipio}/metadados`);
  if (!response.ok) {
    throw new Error(`Falha ao obter coordenadas do município no IBGE`);
  }

  const data: MetadadoMalhaIBGE[] = await response.json();
  if (!Array.isArray(data) || data.length === 0 || !data[0]?.centroide) {
    throw new Error("Não foi possível identificar o centroide geográfico deste município.");
  }

  const centroide = data[0].centroide;
  let latitude: number | undefined;
  let longitude: number | undefined;

  if (Array.isArray(centroide.coordenadas) && centroide.coordenadas.length >= 2) {
    longitude = Number(centroide.coordenadas[0]);
    latitude = Number(centroide.coordenadas[1]);
  } else if (centroide.latitude !== undefined && centroide.longitude !== undefined) {
    latitude = Number(centroide.latitude);
    longitude = Number(centroide.longitude);
  }

  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    throw new Error("Formato de coordenadas inválido.");
  }

  return { latitude, longitude };
}

/**
 * 4. Clima Completo: Atual + Sensação Térmica + Umidade + Nascer/Pôr do Sol + Previsão 7 Dias + Previsão Hora a Hora (24h).
 */
export async function getClimaCompleto(
  latitude: number,
  longitude: number
): Promise<{
  clima: OpenMeteoCurrentWeather;
  unidades: OpenMeteoCurrentWeatherUnits;
  previsaoDiaria: PrevisaoDiariaItem[];
  previsaoHoraria: PrevisaoHorariaItem[];
}> {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    current_weather: "true",
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,is_day,weather_code,wind_speed_10m,wind_direction_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    forecast_hours: "24",
    timezone: "auto",
  });

  const response = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Falha ao consultar clima na Open-Meteo`);
  }

  const data = await response.json();
  const current = data.current;
  const legacy = data.current_weather;

  const hojeSunrise = data.daily?.sunrise?.[0];
  const hojeSunset = data.daily?.sunset?.[0];

  const formatarHora = (isoStr?: string) => {
    if (!isoStr) return undefined;
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? undefined : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const clima: OpenMeteoCurrentWeather = {
    time: current?.time || legacy?.time || new Date().toISOString(),
    temperature: current?.temperature_2m ?? legacy?.temperature ?? 0,
    windspeed: current?.wind_speed_10m ?? legacy?.windspeed ?? 0,
    winddirection: current?.wind_direction_10m ?? legacy?.winddirection ?? 0,
    is_day: current?.is_day ?? legacy?.is_day ?? 1,
    weathercode: current?.weather_code ?? legacy?.weathercode ?? 0,
    relative_humidity: current?.relative_humidity_2m,
    apparent_temperature: current?.apparent_temperature,
    precipitation: current?.precipitation,
    nascerDoSol: formatarHora(hojeSunrise),
    porDoSol: formatarHora(hojeSunset),
  };

  const unidades: OpenMeteoCurrentWeatherUnits = {
    temperature: data.current_units?.temperature_2m || "°C",
    windspeed: data.current_units?.wind_speed_10m || "km/h",
    winddirection: data.current_units?.wind_direction_10m || "°",
  };

  // Previsão diária (próximos 7 dias)
  const previsaoDiaria: PrevisaoDiariaItem[] = [];
  if (data.daily && Array.isArray(data.daily.time)) {
    for (let i = 0; i < data.daily.time.length; i++) {
      previsaoDiaria.push({
        data: data.daily.time[i],
        codigoClima: data.daily.weather_code[i] ?? 0,
        tempMax: data.daily.temperature_2m_max[i] ?? 0,
        tempMin: data.daily.temperature_2m_min[i] ?? 0,
        probabilidadeChuva: data.daily.precipitation_probability_max?.[i],
      });
    }
  }

  // Previsão hora a hora (próximas 24 horas)
  const previsaoHoraria: PrevisaoHorariaItem[] = [];
  if (data.hourly && Array.isArray(data.hourly.time)) {
    for (let i = 0; i < data.hourly.time.length; i++) {
      const horaFormatada = new Date(data.hourly.time[i]).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      previsaoHoraria.push({
        hora: horaFormatada,
        temperatura: data.hourly.temperature_2m[i] ?? 0,
        codigoClima: data.hourly.weather_code[i] ?? 0,
        probabilidadeChuva: data.hourly.precipitation_probability?.[i],
      });
    }
  }

  return { clima, unidades, previsaoDiaria, previsaoHoraria };
}

/**
 * 5. Qualidade do Ar & Índice UV via Open-Meteo Air Quality.
 */
export async function getQualidadeAr(latitude: number, longitude: number): Promise<QualidadeArDados | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      current: "european_aqi,uv_index,pm2_5,pm10",
    });

    const response = await fetch(`${OPEN_METEO_AIR_BASE}?${params.toString()}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.current) return null;

    return {
      aqi: data.current.european_aqi,
      uvIndex: data.current.uv_index,
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
    };
  } catch {
    return null;
  }
}

/**
 * 6. Foto da Cidade & Resumo Histórico via Wikipedia REST API.
 */
export async function getResumoWikipedia(cidade: string): Promise<WikipediaResumo | null> {
  try {
    const termo = encodeURIComponent(cidade.trim());
    const response = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${termo}`);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.title || data.type === "disambiguation") return null;

    return {
      titulo: data.title,
      descricao: data.description,
      extrato: data.extract,
      imagemUrl: data.thumbnail?.source || data.originalimage?.source,
      paginaUrl: data.content_urls?.desktop?.page,
    };
  } catch {
    return null;
  }
}

/**
 * 7. Últimas notícias do IBGE filtradas pelo Estado (UF).
 */
export async function getNoticiasIBGE(uf: string): Promise<NoticiaIBGE[]> {
  try {
    const response = await fetch(`${IBGE_NOTICIAS_BASE}/?qtd=3&tipo=noticia`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((item: any) => ({
      id: item.id,
      titulo: item.titulo,
      introducao: item.introducao,
      data_publicacao: item.data_publicacao,
      link: item.link,
      editorias: item.editorias,
    }));
  } catch {
    return [];
  }
}

/**
 * 8. Alertas meteorológicos ativos oficiais do INMET (espelhados em tempo real com detalhes).
 */
export async function getAlertasINMET(uf: string, municipioId?: string): Promise<AlertaINMET[]> {
  try {
    if (!uf) return [];
    const url = `https://radarmeteorologico.com.br/api/v1/alertas?uf=${encodeURIComponent(uf.toUpperCase())}`;
    const response = await fetch(url, {
      next: { revalidate: 600 },
    });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.alertas || !Array.isArray(data.alertas)) return [];

    const codIbgeNum = municipioId ? parseInt(municipioId, 10) : null;

    return data.alertas.map((a: any) => {
      const afeta = codIbgeNum && Array.isArray(a.geocodes)
        ? a.geocodes.includes(codIbgeNum) || a.geocodes.some((g: any) => String(g).startsWith(municipioId!))
        : true;

      let cor = "#f59e0b"; // Amarelo (Perigo Potencial)
      if (a.severidade?.toLowerCase().includes("grande perigo") || a.nivel === 3) {
        cor = "#ef4444"; // Vermelho
      } else if (a.severidade?.toLowerCase().includes("perigo") || a.nivel === 2) {
        cor = "#f97316"; // Laranja
      }

      return {
        id: a.id,
        evento: a.evento || "Aviso Meteorológico",
        severidade: a.severidade || "Aviso",
        nivel: a.nivel || 1,
        inicio: a.inicio || "",
        fim: a.fim || "",
        riscos: Array.isArray(a.riscos) ? a.riscos : [],
        instrucoes: Array.isArray(a.instrucoes) ? a.instrucoes : [],
        url: a.url,
        municipiosAfetados: a.municipios_afetados,
        afetaMunicipioAtual: afeta,
        corHex: cor,
      };
    });
  } catch {
    return [];
  }
}

/**
 * 8b. Alertas de Riscos de Desastres Naturais do CEMADEN (Inundações, Enxurradas, Deslizamentos).
 */
export async function getAlertasCEMADEN(
  municipioId: string,
  uf: string,
  municipioNome: string
): Promise<AlertaCEMADEN[]> {
  try {
    const response = await fetch("https://painelalertas.cemaden.gov.br/wsAlertas2", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 600 },
    });
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.alertas || !Array.isArray(data.alertas)) return [];

    const codIbgeNum = parseInt(municipioId, 10);
    const nomeNorm = municipioNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ufNorm = uf.toUpperCase();

    // Filtra pelo código IBGE exato ou por UF + Nome do município
    const alertasDoMunicipio = data.alertas.filter((item: any) => {
      if (item.codibge && codIbgeNum && (item.codibge === codIbgeNum || String(item.codibge).startsWith(municipioId))) {
        return true;
      }
      if (item.uf?.toUpperCase() === ufNorm) {
        const itemNomeNorm = (item.municipio || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (itemNomeNorm && (itemNomeNorm === nomeNorm || itemNomeNorm.includes(nomeNorm) || nomeNorm.includes(itemNomeNorm))) {
          return true;
        }
      }
      return false;
    });

    return alertasDoMunicipio.map((a: any) => ({
      codAlerta: a.cod_alerta || a.id,
      codibge: a.codibge,
      evento: a.evento || "Risco Hidrológico / Deslizamento",
      nivel: a.nivel || "Moderado",
      uf: a.uf || uf,
      municipio: a.municipio || municipioNome,
      dataHoraCriacao: a.datahoracriacao,
    }));
  } catch {
    return [];
  }
}

/**
 * 8c. Cálculo Científico do Risco de Fogo e Queimadas (Baseado na Fórmula de Monte Alegre e INPE).
 */
export function calcularRiscoFogo(
  temperatura: number,
  umidade?: number,
  vento?: number
): RiscoFogo {
  const u = umidade ?? 50;
  const t = temperatura;
  const v = vento ?? 10;

  let fatorUmidade = 0;
  if (u <= 15) fatorUmidade = 50;
  else if (u <= 30) fatorUmidade = 40;
  else if (u <= 45) fatorUmidade = 25;
  else if (u <= 60) fatorUmidade = 15;
  else fatorUmidade = 5;

  let fatorTemp = 0;
  if (t >= 35) fatorTemp = 30;
  else if (t >= 30) fatorTemp = 20;
  else if (t >= 25) fatorTemp = 10;
  else fatorTemp = 2;

  let fatorVento = 0;
  if (v >= 40) fatorVento = 20;
  else if (v >= 25) fatorVento = 15;
  else if (v >= 15) fatorVento = 10;
  else fatorVento = 3;

  const score = Math.min(100, Math.max(0, fatorUmidade + fatorTemp + fatorVento));

  if (score >= 80) {
    return {
      nivel: "Crítico",
      indice: score,
      descricao: "Risco extremo de queimadas e propagação descontrolada de fogo.",
      corHex: "#ef4444",
      recomendacao: "Proibido qualquer uso de fogo. Vegetação altamente inflamável e tempo seco.",
    };
  }
  if (score >= 60) {
    return {
      nivel: "Muito Alto",
      indice: score,
      descricao: "Condições meteorológicas muito propícias a incêndios em vegetação.",
      corHex: "#f97316",
      recomendacao: "Evite queimadas de lixo ou pasto. Faíscas podem se propagar rapidamente.",
    };
  }
  if (score >= 40) {
    return {
      nivel: "Alto",
      indice: score,
      descricao: "Tempo seco com probabilidade moderada a alta de ignição.",
      corHex: "#f59e0b",
      recomendacao: "Atenção redobrada em áreas rurais e beiras de rodovias.",
    };
  }
  if (score >= 25) {
    return {
      nivel: "Moderado",
      indice: score,
      descricao: "Risco moderado de fogo florestal.",
      corHex: "#eab308",
      recomendacao: "Condições normais com atenção rotineira.",
    };
  }

  return {
    nivel: "Baixo",
    indice: score,
    descricao: "Umidade e temperatura em níveis que desfavorecem queimadas.",
    corHex: "#10b981",
    recomendacao: "Sem risco relevante de incêndios florestais hoje.",
  };
}

/**
 * 9. Geocodificação reversa a partir de Latitude e Longitude (GPS do navegador).
 * Identifica o nome da cidade e UF correspondentes.
 */
export async function reverseGeocodeGPS(
  latitude: number,
  longitude: number
): Promise<{ cidade: string; uf: string } | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const uf = data.principalSubdivisionCode?.replace("BR-", "") || "SP";
    const cidade = data.city || data.locality || data.principalSubdivision || "Localização Atual";

    return { cidade, uf };
  } catch {
    return null;
  }
}


/**
 * 10. Consulta o clima histórico de uma data específica no passado via Open-Meteo Archive API.
 */
export async function getClimaHistorico(
  latitude: number,
  longitude: number,
  dataIso: string // YYYY-MM-DD
): Promise<{
  data: string;
  tempMax: number;
  tempMin: number;
  precipitacao: number;
  ventoMax: number;
  codigoClima: number;
} | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      start_date: dataIso,
      end_date: dataIso,
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code",
      timezone: "auto",
    });

    const response = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params.toString()}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.daily || !data.daily.time || data.daily.time.length === 0) return null;

    return {
      data: data.daily.time[0],
      tempMax: data.daily.temperature_2m_max?.[0] ?? 0,
      tempMin: data.daily.temperature_2m_min?.[0] ?? 0,
      precipitacao: data.daily.precipitation_sum?.[0] ?? 0,
      ventoMax: data.daily.wind_speed_10m_max?.[0] ?? 0,
      codigoClima: data.daily.weather_code?.[0] ?? 0,
    };
  } catch {
    return null;
  }
}
