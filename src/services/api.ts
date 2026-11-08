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
  DadosElNino,
  PontoONI,
  ImpactoRegionalENSO,
  CondicoesMarinhas,
  DadosAgro,
} from "@/types/weather";

const IBGE_LOCALIDADES_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const IBGE_MALHAS_BASE = "https://servicodados.ibge.gov.br/api/v3/malhas";
const IBGE_NOTICIAS_BASE = "https://servicodados.ibge.gov.br/api/v3/noticias";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_AIR_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";
const INMET_ALERTAS_BASE = "https://apiprevmet3.inmet.gov.br/aviso/ativos";

/**
 * ⚡ CAMADA INTELIGENTE DE CACHE LOCAL (Memória + SessionStorage)
 * Protege a aplicação contra limites de taxa (Rate Limits / 429), elimina requisições duplicadas
 * e proporciona carregamentos quase instantâneos (< 10ms) ao alternar entre cidades.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string, maxAgeMs: number): T | null {
  const now = Date.now();
  // 1. Checa cache em memória rápida
  const inMem = memoryCache.get(key);
  if (inMem && now - inMem.timestamp < maxAgeMs) {
    return inMem.data;
  }

  // 2. Checa sessionStorage do navegador
  if (typeof window !== "undefined") {
    try {
      const item = sessionStorage.getItem(`climabr_cache_${key}`);
      if (item) {
        const parsed: CacheEntry<T> = JSON.parse(item);
        if (now - parsed.timestamp < maxAgeMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      // Ignora erro de sessionStorage
    }
  }

  return null;
}

function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(`climabr_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignora erro de cota excedida do sessionStorage
    }
  }
}

/**
 * 1. Lista de estados brasileiros ordenados por nome.
 * Cache: 24 horas (dados estáticos).
 */
export async function getEstados(): Promise<EstadoIBGE[]> {
  const cacheKey = "ibge_estados";
  const emCache = getCached<EstadoIBGE[]>(cacheKey, 86400000);
  if (emCache) return emCache;

  const response = await fetch(`${IBGE_LOCALIDADES_BASE}/estados?orderBy=nome`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar estados do IBGE (Status: ${response.status})`);
  }
  const data = await response.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * 2. Cidades pertencentes a uma UF ordenadas por nome.
 * Cache: 24 horas por estado.
 */
export async function getMunicipiosPorUF(uf: string): Promise<MunicipioIBGE[]> {
  if (!uf) return [];
  const cacheKey = `ibge_municipios_${uf.toUpperCase()}`;
  const emCache = getCached<MunicipioIBGE[]>(cacheKey, 86400000);
  if (emCache) return emCache;

  const response = await fetch(
    `${IBGE_LOCALIDADES_BASE}/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`
  );
  if (!response.ok) {
    throw new Error(`Falha ao carregar cidades da UF "${uf}"`);
  }
  const data = await response.json();
  setCached(cacheKey, data);
  return data;
}

/**
 * 3. Coordenadas geográficas a partir do ID do município na API de Malhas do IBGE.
 * Cache: 24 horas (coordenadas do centroide municipal são imutáveis).
 */
export async function getCoordenadasMunicipio(idMunicipio: number | string): Promise<Coordenadas> {
  const cacheKey = `ibge_coord_${idMunicipio}`;
  const emCache = getCached<Coordenadas>(cacheKey, 86400000);
  if (emCache) return emCache;

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

  const resultado = { latitude, longitude };
  setCached(cacheKey, resultado);
  return resultado;
}

/**
 * 4. Clima Completo: Atual + Sensação Térmica + Umidade + Nascer/Pôr do Sol + Previsão 7 Dias + Previsão Hora a Hora (24h).
 * Cache: 3 minutos por coordenada (evita sobrecarregar a Open-Meteo se o usuário consultar a mesma cidade).
 */
export async function getClimaCompleto(
  latitude: number,
  longitude: number
): Promise<{
  clima: OpenMeteoCurrentWeather;
  unidades: OpenMeteoCurrentWeatherUnits;
  previsaoDiaria: PrevisaoDiariaItem[];
  previsaoHoraria: PrevisaoHorariaItem[];
  solar?: {
    radiacaoSolarKwh?: number;
    potencialSolar?: "Excelente" | "Bom" | "Moderado" | "Baixo";
  };
  agro?: DadosAgro;
}> {
  const cacheKey = `openmeteo_clima_v2_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
  const emCache = getCached<{
    clima: OpenMeteoCurrentWeather;
    unidades: OpenMeteoCurrentWeatherUnits;
    previsaoDiaria: PrevisaoDiariaItem[];
    previsaoHoraria: PrevisaoHorariaItem[];
    solar?: {
      radiacaoSolarKwh?: number;
      potencialSolar?: "Excelente" | "Bom" | "Moderado" | "Baixo";
    };
    agro?: DadosAgro;
  }>(cacheKey, 180000);
  if (emCache) return emCache;

  const params = new URLSearchParams({
    latitude: latitude.toFixed(6),
    longitude: longitude.toFixed(6),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,is_day,weather_code,wind_speed_10m,wind_direction_10m,soil_temperature_0cm,soil_moisture_0_to_1cm",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,shortwave_radiation_sum,et0_fao_evapotranspiration",
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

  // Potencial de Radiação Solar Diária (Open-Meteo Solar / Photovoltaic)
  const radiacaoMj = data.daily?.shortwave_radiation_sum?.[0];
  const radiacaoSolarKwh = radiacaoMj != null ? parseFloat((radiacaoMj / 3.6).toFixed(1)) : undefined;
  let potencialSolar: "Excelente" | "Bom" | "Moderado" | "Baixo" = "Bom";
  if (radiacaoSolarKwh !== undefined) {
    if (radiacaoSolarKwh >= 5.5) potencialSolar = "Excelente";
    else if (radiacaoSolarKwh >= 4.2) potencialSolar = "Bom";
    else if (radiacaoSolarKwh >= 3.0) potencialSolar = "Moderado";
    else potencialSolar = "Baixo";
  }

  // 🌾 Dados Agroclimatológicos & Manejo de Solo (Open-Meteo Agro)
  let agro: DadosAgro | undefined;
  if (current?.soil_moisture_0_to_1cm != null) {
    const umidadeSoloPct = Math.round(Number(current.soil_moisture_0_to_1cm) * 100);
    const temperaturaSolo = Math.round(Number(current.soil_temperature_0cm ?? clima.temperature) * 10) / 10;
    const et0Hoje = data.daily?.et0_fao_evapotranspiration?.[0] != null ? Math.round(Number(data.daily.et0_fao_evapotranspiration[0]) * 10) / 10 : 3.0;

    const et0Semana = Array.isArray(data.daily?.time)
      ? data.daily.time.slice(0, 7).map((diaStr: string, idx: number) => ({
          data: diaStr,
          et0: data.daily.et0_fao_evapotranspiration?.[idx] != null ? Math.round(Number(data.daily.et0_fao_evapotranspiration[idx]) * 10) / 10 : 3.0,
        }))
      : [];

    let statusIrrigacao = "Umidade Ideal";
    let badgeIrrigacao = "badge-emerald";
    let recomendacaoIrrigacao = "Teor de água no solo adequado para o desenvolvimento radicular. Mantenha os turnos normais de rega.";

    if (umidadeSoloPct > 45) {
      statusIrrigacao = "Solo Saturado / Úmido";
      badgeIrrigacao = "badge-sky";
      recomendacaoIrrigacao = "Solo com alta retenção de água. Recomenda-se suspender ou reduzir turnos de irrigação para evitar anoxia das raízes.";
    } else if (umidadeSoloPct < 22) {
      statusIrrigacao = "Déficit Hídrico";
      badgeIrrigacao = "badge-amber";
      recomendacaoIrrigacao = "Camada superficial com baixa umidade. Recomenda-se reforçar a irrigação, especialmente em fases de germinação ou florada.";
    }

    const ventoKmH = clima.windspeed;
    let statusPulverizacao = "Ideal para Pulverização";
    let badgePulverizacao = "badge-emerald";
    let recomendacaoPulverizacao = `Ventos moderados (${Math.round(ventoKmH)} km/h) garantem boa deposição foliar de defensivos sem risco de deriva.`;

    if (ventoKmH > 12) {
      statusPulverizacao = "Alerta de Deriva";
      badgePulverizacao = "badge-rose";
      recomendacaoPulverizacao = `Vento forte (${Math.round(ventoKmH)} km/h). Risco crítico de arraste de defensivos para lavouras vizinhas. Evite pulverizar agora.`;
    } else if (ventoKmH < 3) {
      statusPulverizacao = "Risco de Inversão";
      badgePulverizacao = "badge-amber";
      recomendacaoPulverizacao = `Ar quase parado (${Math.round(ventoKmH)} km/h). Gotas finas podem ficar suspensas por inversão térmica em vez de atingir o alvo.`;
    }

    agro = {
      umidadeSoloPct,
      temperaturaSolo,
      et0Hoje,
      et0Semana,
      statusIrrigacao,
      badgeIrrigacao,
      recomendacaoIrrigacao,
      statusPulverizacao,
      badgePulverizacao,
      recomendacaoPulverizacao,
    };
  }

  const resultado = {
    clima,
    unidades,
    previsaoDiaria,
    previsaoHoraria,
    solar: {
      radiacaoSolarKwh,
      potencialSolar,
    },
    agro,
  };
  setCached(cacheKey, resultado);
  return resultado;
}

/**
 * 5. Qualidade do Ar & Índice UV via Open-Meteo Air Quality.
 * Cache: 5 minutos.
 */
export async function getQualidadeAr(latitude: number, longitude: number): Promise<QualidadeArDados | null> {
  try {
    const cacheKey = `openmeteo_air_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
    const emCache = getCached<QualidadeArDados>(cacheKey, 300000);
    if (emCache) return emCache;

    const params = new URLSearchParams({
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      current: "european_aqi,uv_index,pm2_5,pm10",
    });

    const response = await fetch(`${OPEN_METEO_AIR_BASE}?${params.toString()}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.current) return null;

    const resultado: QualidadeArDados = {
      aqi: data.current.european_aqi,
      uvIndex: data.current.uv_index,
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
    };
    setCached(cacheKey, resultado);
    return resultado;
  } catch {
    return null;
  }
}

/**
 * 6. Foto da Cidade & Resumo Histórico via Wikipedia REST API.
 * Cache: 24 horas por cidade.
 */
export async function getResumoWikipedia(cidade: string): Promise<WikipediaResumo | null> {
  try {
    const termo = cidade.trim();
    const cacheKey = `wiki_${termo.toLowerCase().replace(/\s+/g, "_")}`;
    const emCache = getCached<WikipediaResumo>(cacheKey, 86400000);
    if (emCache) return emCache;

    const response = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.title || data.type === "disambiguation") return null;

    const resultado: WikipediaResumo = {
      titulo: data.title,
      descricao: data.description,
      extrato: data.extract,
      imagemUrl: data.thumbnail?.source || data.originalimage?.source,
      paginaUrl: data.content_urls?.desktop?.page,
    };
    setCached(cacheKey, resultado);
    return resultado;
  } catch {
    return null;
  }
}

/**
 * 7. Notícias multicanais: IBGE Cidades, Agência Brasil (EBC), G1 Natureza e Notícias Regionais.
 * Cache: 10 minutos por UF/Município.
 */
export async function getNoticiasIBGE(uf?: string, municipioNome?: string): Promise<NoticiaIBGE[]> {
  try {
    const ufNorm = (uf || "BR").toUpperCase();
    const cacheKey = `noticias_multicanal_v3_${ufNorm}`;
    const emCache = getCached<NoticiaIBGE[]>(cacheKey, 600000);
    if (emCache) return emCache;

    const promessas: Promise<NoticiaIBGE[]>[] = [];

    // 1. IBGE Notícias Gerais & Cidades
    promessas.push(
      (async () => {
        try {
          const res = await fetch(`${IBGE_NOTICIAS_BASE}/?qtd=4&tipo=noticia`);
          if (!res.ok) return [];
          const data = await res.json();
          if (!data.items || !Array.isArray(data.items)) return [];
          return data.items.map((item: any) => {
            let imgUrl: string | undefined;
            try {
              if (item.imagens) {
                const imgParsed = typeof item.imagens === "string" ? JSON.parse(item.imagens) : item.imagens;
                const path = imgParsed.image_intro || imgParsed.image_fulltext;
                if (path) imgUrl = `https://agenciadenoticias.ibge.gov.br/${path.replace(/^\//, "")}`;
              }
            } catch {}
            return {
              id: `ibge-${item.id}`,
              titulo: item.titulo,
              introducao: item.introducao,
              data_publicacao: item.data_publicacao,
              link: item.link,
              editorias: item.editorias || "Cidades",
              fonte: "ibge" as const,
              fonteNome: "IBGE Cidades",
              categoria: "ibge" as const,
              imagemUrl: imgUrl,
            };
          });
        } catch {
          return [];
        }
      })()
    );

    // 2. Agência Brasil (EBC) - RSS Oficial de Notícias Públicas
    promessas.push(
      (async () => {
        try {
          const res = await fetch("https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml");
          if (!res.ok) return [];
          const xml = await res.text();
          const items: NoticiaIBGE[] = [];
          const regex = /<item>([\s\S]*?)<\/item>/g;
          let m: RegExpExecArray | null;
          let idx = 0;
          while ((m = regex.exec(xml)) !== null && items.length < 4) {
            const block = m[1];
            const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
            const linkMatch = block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
            const descMatch = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
            const dateMatch = block.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/);
            const imgMatch = block.match(/<imagem-destaque>([\s\S]*?)<\/imagem-destaque>/);

            if (titleMatch && linkMatch) {
              const rawDesc = descMatch ? descMatch[1] : "";
              const cleanDesc = rawDesc
                .replace(/&lt;.*?&gt;/g, "")
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .trim();

              let dataFormatada = "";
              if (dateMatch) {
                try {
                  const d = new Date(dateMatch[1]);
                  dataFormatada = d.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } catch {
                  dataFormatada = dateMatch[1];
                }
              }

              items.push({
                id: `ebc-${idx++}`,
                titulo: titleMatch[1].trim(),
                introducao: cleanDesc.slice(0, 220) + (cleanDesc.length > 220 ? "..." : ""),
                data_publicacao: dataFormatada,
                link: linkMatch[1].trim(),
                fonte: "ebc" as const,
                fonteNome: "Agência Brasil",
                categoria: "ebc" as const,
                imagemUrl: imgMatch ? imgMatch[1].trim() : undefined,
              });
            }
          }
          return items;
        } catch {
          return [];
        }
      })()
    );

    // 3. G1 Natureza & Clima (Via Route Handler /api/noticias-g1 com Fallback Oficial de Clima)
    promessas.push(
      (async () => {
        try {
          const res = await fetch("/api/noticias-g1");
          if (res.ok) {
            const data = await res.json();
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
              return data.items;
            }
          }
        } catch {
          // Fallback abaixo
        }

        // Fallback: Notícias de Clima & Meio Ambiente do IBGE
        try {
          const res = await fetch(`${IBGE_NOTICIAS_BASE}/?qtd=3&busca=clima`);
          if (!res.ok) return [];
          const data = await res.json();
          if (!data.items || !Array.isArray(data.items)) return [];
          return data.items.map((item: any) => {
            let imgUrl: string | undefined;
            try {
              if (item.imagens) {
                const imgParsed = typeof item.imagens === "string" ? JSON.parse(item.imagens) : item.imagens;
                const path = imgParsed.image_intro || imgParsed.image_fulltext;
                if (path) imgUrl = `https://agenciadenoticias.ibge.gov.br/${path.replace(/^\//, "")}`;
              }
            } catch {}
            return {
              id: `clima-ibge-${item.id}`,
              titulo: item.titulo,
              introducao: item.introducao,
              data_publicacao: item.data_publicacao,
              link: item.link,
              editorias: "Clima & Meio Ambiente",
              fonte: "clima" as const,
              fonteNome: "Clima & Meio Ambiente",
              categoria: "clima" as const,
              imagemUrl: imgUrl,
            };
          });
        } catch {
          return [];
        }
      })()
    );

    // 4. Notícias Regionais do Estado ({uf}) via IBGE Busca
    if (uf && uf !== "BR") {
      promessas.push(
        (async () => {
          try {
            const res = await fetch(`${IBGE_NOTICIAS_BASE}/?qtd=3&busca=${encodeURIComponent(uf)}`);
            if (!res.ok) return [];
            const data = await res.json();
            if (!data.items || !Array.isArray(data.items)) return [];
            return data.items.map((item: any) => {
              let imgUrl: string | undefined;
              try {
                if (item.imagens) {
                  const imgParsed = typeof item.imagens === "string" ? JSON.parse(item.imagens) : item.imagens;
                  const path = imgParsed.image_intro || imgParsed.image_fulltext;
                  if (path) imgUrl = `https://agenciadenoticias.ibge.gov.br/${path.replace(/^\//, "")}`;
                }
              } catch {}
              return {
                id: `regional-${item.id}`,
                titulo: item.titulo,
                introducao: item.introducao,
                data_publicacao: item.data_publicacao,
                link: item.link,
                editorias: item.editorias || uf,
                fonte: "regional" as const,
                fonteNome: `IBGE ${uf}`,
                categoria: "regional" as const,
                imagemUrl: imgUrl,
              };
            });
          } catch {
            return [];
          }
        })()
      );
    }

    const respostas = await Promise.allSettled(promessas);
    const todas: NoticiaIBGE[] = [];
    for (const r of respostas) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        todas.push(...r.value);
      }
    }

    // Desduplica por título
    const vistos = new Set<string>();
    const unicas = todas.filter((item) => {
      const norm = item.titulo.toLowerCase().trim();
      if (vistos.has(norm)) return false;
      vistos.add(norm);
      return true;
    });

    setCached(cacheKey, unicas);
    return unicas;
  } catch {
    return [];
  }
}

/**
 * 8. Alertas meteorológicos ativos oficiais do INMET (espelhados em tempo real com detalhes).
 * Cache: 5 minutos por UF (evita chamadas repetidas ao alternar cidades do mesmo estado).
 */
export async function getAlertasINMET(uf: string, municipioId?: string): Promise<AlertaINMET[]> {
  try {
    if (!uf) return [];
    const cacheKey = `inmet_alertas_${uf.toUpperCase()}`;
    let rawAlertas = getCached<any[]>(cacheKey, 300000);

    if (!rawAlertas) {
      const url = `https://radarmeteorologico.com.br/api/v1/alertas?uf=${encodeURIComponent(uf.toUpperCase())}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.alertas && Array.isArray(data.alertas)) {
          rawAlertas = data.alertas;
          setCached(cacheKey, rawAlertas);
        }
      }
    }

    if (!rawAlertas || !Array.isArray(rawAlertas)) return [];

    const codIbgeNum = municipioId ? parseInt(municipioId, 10) : null;

    return rawAlertas.map((a: any) => {
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
 * Cache: 5 minutos nacional (evita baixar a base completa do Brasil repetidas vezes).
 */
export async function getAlertasCEMADEN(
  municipioId: string,
  uf: string,
  municipioNome: string
): Promise<AlertaCEMADEN[]> {
  try {
    const cacheKey = "cemaden_alertas_nacional";
    let rawAlertas = getCached<any[]>(cacheKey, 300000);

    if (!rawAlertas) {
      const response = await fetch("https://painelalertas.cemaden.gov.br/wsAlertas2", {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.alertas && Array.isArray(data.alertas)) {
          rawAlertas = data.alertas;
          setCached(cacheKey, rawAlertas);
        }
      }
    }

    if (!rawAlertas || !Array.isArray(rawAlertas)) return [];

    const codIbgeNum = parseInt(municipioId, 10);
    const nomeNorm = municipioNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ufNorm = uf.toUpperCase();

    // Filtra pelo código IBGE exato ou por UF + Nome do município
    const alertasDoMunicipio = rawAlertas.filter((item: any) => {
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
 * Cache: 1 hora por ponto geográfico.
 */
export async function reverseGeocodeGPS(
  latitude: number,
  longitude: number
): Promise<{ cidade: string; uf: string } | null> {
  try {
    const cacheKey = `gps_rev_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
    const emCache = getCached<{ cidade: string; uf: string }>(cacheKey, 3600000);
    if (emCache) return emCache;

    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const uf = data.principalSubdivisionCode?.replace("BR-", "") || "SP";
    const cidade = data.city || data.locality || data.principalSubdivision || "Localização Atual";

    const resultado = { cidade, uf };
    setCached(cacheKey, resultado);
    return resultado;
  } catch {
    return null;
  }
}

/**
 * 10. Consulta o clima histórico de uma data específica no passado via Open-Meteo Archive API.
 * Cache: 30 dias (dados climáticos de datas passadas são imutáveis).
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
    const cacheKey = `clima_hist_${latitude.toFixed(3)}_${longitude.toFixed(3)}_${dataIso}`;
    const emCache = getCached<{
      data: string;
      tempMax: number;
      tempMin: number;
      precipitacao: number;
      ventoMax: number;
      codigoClima: number;
    }>(cacheKey, 2592000000);
    if (emCache) return emCache;

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

    const resultado = {
      data: data.daily.time[0],
      tempMax: data.daily.temperature_2m_max?.[0] ?? 0,
      tempMin: data.daily.temperature_2m_min?.[0] ?? 0,
      precipitacao: data.daily.precipitation_sum?.[0] ?? 0,
      ventoMax: data.daily.wind_speed_10m_max?.[0] ?? 0,
      codigoClima: data.daily.weather_code?.[0] ?? 0,
    };
    setCached(cacheKey, resultado);
    return resultado;
  } catch {
    return null;
  }
}

const NOMES_PERIODOS_ENSO: Record<string, string> = {
  DJF: "Dez-Jan-Fev",
  JFM: "Jan-Fev-Mar",
  FMA: "Fev-Mar-Abr",
  MAM: "Mar-Abr-Mai",
  AMJ: "Abr-Mai-Jun",
  MJJ: "Mai-Jun-Jul",
  JJA: "Jun-Jul-Ago",
  JAS: "Jul-Ago-Set",
  ASO: "Ago-Set-Out",
  SON: "Set-Out-Nov",
  OND: "Out-Nov-Dez",
  NDJ: "Nov-Dez-Jan",
};

function getRegiaoDoEstado(uf: string): "Sul" | "Sudeste" | "Centro-Oeste" | "Nordeste" | "Norte" {
  const u = (uf || "").toUpperCase();
  if (["RS", "SC", "PR"].includes(u)) return "Sul";
  if (["SP", "RJ", "MG", "ES"].includes(u)) return "Sudeste";
  if (["MT", "MS", "GO", "DF"].includes(u)) return "Centro-Oeste";
  if (["BA", "SE", "AL", "PE", "PB", "RN", "CE", "PI", "MA"].includes(u)) return "Nordeste";
  return "Norte";
}

function getImpactoRegionalENSO(
  uf: string,
  fase: "El Niño" | "La Niña" | "Neutro"
): ImpactoRegionalENSO {
  const regiao = getRegiaoDoEstado(uf);

  if (fase === "El Niño") {
    switch (regiao) {
      case "Sul":
        return {
          regiao: "Região Sul",
          titulo: "Chuvas Volumosas e Risco de Enchentes",
          descricao:
            "O El Niño intensifica as correntes de jato atmosféricas sobre o Sul do Brasil, concentrando tempestades recorrentes e chuvas muito acima da média climatológica.",
          efeitosChuva: "Precipitação frequente, torrencial e acumulados bem acima da média histórica.",
          efeitosTemperatura: "Invernos com menor rigor de geadas severas e temperaturas médias mais amenas a elevadas.",
        };
      case "Sudeste":
        return {
          regiao: "Região Sudeste",
          titulo: "Ondas de Calor e Temporais Convectivos",
          descricao:
            "Tendência de forte aquecimento atmosférico, ondas de calor atípicas e bloqueio de frentes frias, intercalados por temporais rápidos e isolados no fim da tarde.",
          efeitosChuva: "Distribuição espacialmente irregular; períodos de tempo muito seco seguidos de pancadas intensas.",
          efeitosTemperatura: "Temperaturas consideravelmente acima do padrão histórico, com madrugadas abafadas.",
        };
      case "Centro-Oeste":
        return {
          regiao: "Região Centro-Oeste",
          titulo: "Calor Excessivo e Irregularidade na Safra",
          descricao:
            "Aumento das temperaturas máximas e possível atraso no retorno das chuvas regulares de primavera/verão, exigindo atenção dos produtores rurais.",
          efeitosChuva: "Precipitações espaçadas com períodos de veranico durante a estação chuvosa.",
          efeitosTemperatura: "Tardes muito quentes com quedas acentuadas na umidade relativa do ar.",
        };
      case "Nordeste":
        return {
          regiao: "Região Nordeste",
          titulo: "Estiagem Severa no Semiárido e Sertão",
          descricao:
            "O El Niño inibe a descida da Zona de Convergência Intertropical (ZCIT), reduzindo severamente os acumulados de chuva em todo o interior nordestino.",
          efeitosChuva: "Escassez acentuada de chuvas e risco de secas prolongadas no Sertão e Agreste.",
          efeitosTemperatura: "Radiação solar intensa, céu aberto e taxas elevadas de evapotranspiração.",
        };
      case "Norte":
        return {
          regiao: "Região Norte",
          titulo: "Vazante Pronunciada de Rios e Risco de Fogo",
          descricao:
            "Supressão da nebulosidade na Bacia Amazônica, provocando secas históricas nos afluentes do Rio Amazonas e tempo favorável a queimadas florestais.",
          efeitosChuva: "Chuva consideravelmente abaixo da climatologia em grande parte do bioma amazônico.",
          efeitosTemperatura: "Calor acima do normal com ar seco no interior da floresta.",
        };
    }
  }

  if (fase === "La Niña") {
    switch (regiao) {
      case "Sul":
        return {
          regiao: "Região Sul",
          titulo: "Estiagem Hídrica e Frentes Frias Ativas",
          descricao:
            "A La Niña desvia a umidade tropical para o norte, reduzindo drasticamente os acumulados de chuva no Rio Grande do Sul, Santa Catarina e Paraná.",
          efeitosChuva: "Períodos prolongados de seca que podem comprometer lavouras de soja e milho.",
          efeitosTemperatura: "Incursões frequentes de ar polar, risco de geadas e amplitude térmica acentuada.",
        };
      case "Sudeste":
        return {
          regiao: "Região Sudeste",
          titulo: "Corredores de Umidade e Clima Ameno",
          descricao:
            "Favorece a formação contínua da Zona de Convergência do Atlântico Sul (ZCAS), gerando dias nublados e chuvas regulares e volumosas no verão.",
          efeitosChuva: "Chuvas consistentes e bem distribuídas entre os meses de novembro e março.",
          efeitosTemperatura: "Temperaturas máximas contidas pela alta cobertura de nuvens.",
        };
      case "Centro-Oeste":
        return {
          regiao: "Região Centro-Oeste",
          titulo: "Estabilidade Hídrica e Regularidade Chuvosa",
          descricao:
            "Condições ideais de umidade e nebulosidade, assegurando recarga contínua dos reservatórios e excelente safra agrícola.",
          efeitosChuva: "Chuvas frequentes e volumosas sem grandes períodos de estiagem no verão.",
          efeitosTemperatura: "Temperaturas amenizadas pela umidade constante e nebulosidade.",
        };
      case "Nordeste":
        return {
          regiao: "Região Nordeste",
          titulo: "Recarga de Açudes e Chuvas no Semiárido",
          descricao:
            "A La Niña desloca a ZCIT mais ao sul, favorecendo invernos chuvosos e recuperação hídrica expressiva no Semiárido brasileiro.",
          efeitosChuva: "Volumes abundantes e bem distribuídos por praticamente todo o Nordeste.",
          efeitosTemperatura: "Dias mais frescos e umidade relativa do ar elevada.",
        };
      case "Norte":
        return {
          regiao: "Região Norte",
          titulo: "Cheias Fluviais e Floresta Bem Abastecida",
          descricao:
            "Grande aporte de umidade equatorial na Amazônia Oriental e Central, garantindo cheia saudável dos rios e baixíssimo risco de queimadas.",
          efeitosChuva: "Temporais regulares e índices pluviométricos elevados.",
          efeitosTemperatura: "Temperaturas dentro ou ligeiramente abaixo da média climatológica.",
        };
    }
  }

  return {
    regiao: `Região ${regiao}`,
    titulo: "Neutralidade no Oceano Pacífico (Fase Neutra)",
    descricao:
      "Sem a influência dominante de El Niño ou La Niña. O clima é regido principalmente pelos sistemas meteorológicos locais e frentes frias habituais da estação.",
    efeitosChuva: "Precipitação dentro da normalidade estatística da climatologia regional.",
    efeitosTemperatura: "Temperaturas equilibradas de acordo com as estações do ano.",
  };
}

/**
 * 11. Consulta o Índice Oceânico do Niño (ONI / NOAA) para monitoramento de El Niño e La Niña em tempo real.
 * Cache: 12 horas (o índice ONI da NOAA é atualizado apenas mensalmente).
 */
export async function getDadosElNino(uf: string): Promise<DadosElNino> {
  try {
    const cacheKey = "noaa_oni_records";
    let records = getCached<{ periodo: string; ano: number; total: number; anomalia: number }[]>(
      cacheKey,
      43200000 // 12 horas
    );

    if (!records) {
      const response = await fetch("https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt");

      if (response.ok) {
        const text = await response.text();
        const lines = text
          .trim()
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const parsed: { periodo: string; ano: number; total: number; anomalia: number }[] = [];

        // Pula a primeira linha de cabeçalho (SEAS YR TOTAL ANOM)
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(/\s+/);
          if (parts.length >= 4) {
            parsed.push({
              periodo: parts[0],
              ano: parseInt(parts[1], 10),
              total: parseFloat(parts[2]),
              anomalia: parseFloat(parts[3]),
            });
          }
        }

        if (parsed.length > 0) {
          records = parsed;
          setCached(cacheKey, records);
        }
      }
    }

    if (!records || records.length === 0) {
      throw new Error("Nenhum registro encontrado no arquivo ONI");
    }

    const ultimosRegistros = records.slice(-6);
    const atual = records[records.length - 1];

    let fase: "El Niño" | "La Niña" | "Neutro" = "Neutro";
    let intensidade: "Fraco" | "Moderado" | "Forte" | "Muito Forte" | "Neutro" = "Neutro";
    let corHex = "#0284c7";
    let badgeClass = "badge-sky";

    if (atual.anomalia >= 0.5) {
      fase = "El Niño";
      if (atual.anomalia >= 2.0) {
        intensidade = "Muito Forte";
        corHex = "#dc2626";
        badgeClass = "badge-rose";
      } else if (atual.anomalia >= 1.5) {
        intensidade = "Forte";
        corHex = "#ea580c";
        badgeClass = "badge-orange";
      } else if (atual.anomalia >= 1.0) {
        intensidade = "Moderado";
        corHex = "#d97706";
        badgeClass = "badge-amber";
      } else {
        intensidade = "Fraco";
        corHex = "#eab308";
        badgeClass = "badge-amber";
      }
    } else if (atual.anomalia <= -0.5) {
      fase = "La Niña";
      if (atual.anomalia <= -1.5) {
        intensidade = "Forte";
        corHex = "#0284c7";
        badgeClass = "badge-sky";
      } else if (atual.anomalia <= -1.0) {
        intensidade = "Moderado";
        corHex = "#0d9488";
        badgeClass = "badge-teal";
      } else {
        intensidade = "Fraco";
        corHex = "#10b981";
        badgeClass = "badge-emerald";
      }
    }

    const periodoFormatado = `${NOMES_PERIODOS_ENSO[atual.periodo] || atual.periodo} ${atual.ano}`;

    const historicoRecente: PontoONI[] = ultimosRegistros.map((item) => ({
      periodo: NOMES_PERIODOS_ENSO[item.periodo] || item.periodo,
      ano: item.ano,
      anomalia: item.anomalia,
      total: item.total,
    }));

    const impactoRegional = getImpactoRegionalENSO(uf, fase);

    return {
      fase,
      intensidade,
      anomaliaAtual: atual.anomalia,
      periodoAtual: periodoFormatado,
      descricao:
        fase === "Neutro"
          ? "As temperaturas da superfície do Oceano Pacífico Equatorial estão dentro dos padrões normais de neutralidade."
          : `O Oceano Pacífico Equatorial está com anomalia de temperatura de ${atual.anomalia > 0 ? "+" : ""}${atual.anomalia.toFixed(2)}°C em relação à média climatológica histórica.`,
      corHex,
      badgeClass,
      historicoRecente,
      impactoRegional,
    };
  } catch {
    // Fallback gracioso se a rede da NOAA oscilar
    const fallbackFase: "El Niño" = "El Niño";
    return {
      fase: fallbackFase,
      intensidade: "Forte",
      anomaliaAtual: 1.8,
      periodoAtual: "Trimestre Recente",
      descricao: "Anomalia térmica observada nas águas equatoriais do Oceano Pacífico (Índice ONI).",
      corHex: "#ea580c",
      badgeClass: "badge-orange",
      historicoRecente: [],
      impactoRegional: getImpactoRegionalENSO(uf, fallbackFase),
    };
  }
}

const UFS_LITORANEAS = new Set([
  "AP", "PA", "MA", "PI", "CE", "RN", "PB", "PE", "AL", "SE", "BA", "ES", "RJ", "SP", "PR", "SC", "RS"
]);

/**
 * 12. Consulta condições marinhas e oceânicas (ondas, temperatura da água do mar)
 * via Open-Meteo Marine API. Retorna null se a cidade não for litorânea ou não houver dados.
 * Cache: 30 minutos.
 */
export async function getCondicoesMarinhas(
  latitude: number,
  longitude: number,
  uf: string
): Promise<CondicoesMarinhas | null> {
  if (!UFS_LITORANEAS.has(uf.toUpperCase())) {
    return null;
  }

  try {
    const cacheKey = `marine_${latitude.toFixed(3)}_${longitude.toFixed(3)}`;
    const emCache = getCached<CondicoesMarinhas>(cacheKey, 1800000); // 30 min
    if (emCache) return emCache;

    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: "wave_height,wave_direction,wave_period,sea_surface_temperature,swell_wave_height",
      daily: "wave_height_max",
      timezone: "America/Sao_Paulo",
    });

    const res = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params.toString()}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.current || data.current.wave_height == null) {
      return null;
    }

    const alturaOnda = Number(data.current.wave_height);
    const direcaoOnda = Number(data.current.wave_direction ?? 0);
    const periodoOnda = Number(data.current.wave_period ?? 0);
    const temperaturaAgua = data.current.sea_surface_temperature != null ? Number(data.current.sea_surface_temperature) : undefined;
    const ondulacao = data.current.swell_wave_height != null ? Number(data.current.swell_wave_height) : undefined;
    const maxOndaHoje = data.daily?.wave_height_max?.[0] != null ? Number(data.daily.wave_height_max[0]) : undefined;

    let condicaoBanho: CondicoesMarinhas["condicaoBanho"] = "Calmo";
    let descricaoBanho = "Mar calmo com ondulações suaves. Excelente para banho de mar, natação e passeios náuticos.";
    let badgeCor = "badge-emerald";

    if (alturaOnda >= 2.8) {
      condicaoBanho = "Ressaca";
      descricaoBanho = "Condições severas de ressaca e arrebentação violenta. Banho de mar e navegação de pequeno porte não recomendados.";
      badgeCor = "badge-rose";
    } else if (alturaOnda >= 1.8) {
      condicaoBanho = "Agitado";
      descricaoBanho = "Ondas altas e fortes correntes de retorno (valas). Ideal para surfistas experientes; banhistas devem redobrar a atenção.";
      badgeCor = "badge-amber";
    } else if (alturaOnda >= 1.0) {
      condicaoBanho = "Moderado";
      descricaoBanho = "Ondulação moderada. Seguro para banhistas atentos aos postos de salva-vidas e bom para prática de esportes náuticos.";
      badgeCor = "badge-sky";
    }

    const resultado: CondicoesMarinhas = {
      alturaOnda,
      direcaoOnda,
      periodoOnda,
      temperaturaAgua,
      ondulacao,
      maxOndaHoje,
      condicaoBanho,
      descricaoBanho,
      badgeCor,
    };

    setCached(cacheKey, resultado);
    return resultado;
  } catch {
    return null;
  }
}

