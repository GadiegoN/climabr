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
 * 8. Alertas meteorológicos ativos no Brasil via INMET.
 */
export async function getAlertasINMET(uf: string): Promise<AlertaINMET[]> {
  try {
    const response = await fetch(INMET_ALERTAS_BASE);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.hoje || !Array.isArray(data.hoje)) return [];

    const alertasUF = data.hoje.filter((alerta: any) => {
      const estados = alerta.estados || "";
      return estados.includes(uf.toUpperCase());
    });

    return alertasUF.slice(0, 2).map((a: any) => ({
      id: a.id || a.aviso_id,
      severidade: a.severidade || "Aviso Meteorológico",
      descricao: a.descricao || a.aviso || "",
      titulo: a.descricao || "Alerta Meteorológico",
      inicio: a.inicio || "",
      fim: a.fim || "",
      corHex: a.severidade === "Perigo" ? "#ef4444" : "#f59e0b",
    }));
  } catch {
    return [];
  }
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
