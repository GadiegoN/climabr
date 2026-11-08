"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  EstadoIBGE,
  MunicipioIBGE,
  DadosClimaCidade,
  CidadeHistorico,
  TipoTema,
} from "@/types/weather";
import {
  getEstados,
  getMunicipiosPorUF,
  getCoordenadasMunicipio,
  getClimaCompleto,
  getQualidadeAr,
  getResumoWikipedia,
  getNoticiasIBGE,
  getAlertasINMET,
  getAlertasCEMADEN,
  calcularRiscoFogo,
  getDadosElNino,
  reverseGeocodeGPS,
  getCondicoesMarinhas,
} from "@/services/api";
import { resolverTemaEfetivo } from "@/utils/theme";
import { ThemeSelector } from "@/components/ThemeSelector";
import { LocationForm } from "@/components/LocationForm";
import { WeatherCard } from "@/components/WeatherCard";
import { WeatherSkeleton } from "@/components/WeatherSkeleton";
import { WeatherEffects } from "@/components/WeatherEffects";
import { CityComparisonModal } from "@/components/CityComparisonModal";
import { TimeCapsuleModal } from "@/components/TimeCapsuleModal";
import { Footer } from "@/components/Footer";
import { CloudSunRain, AlertCircle, Info, Sparkles } from "lucide-react";

const HISTORICO_LOCALSTORAGE_KEY = "climabr_cidades_recentes";
const FAVORITOS_LOCALSTORAGE_KEY = "climabr_cidades_favoritas";
const TEMA_LOCALSTORAGE_KEY = "climabr_tema_preferido";

function WeatherAppContent() {
  const searchParams = useSearchParams();
  const inicializouRef = useRef<boolean>(false);

  // Estados de Tema
  const [tema, setTema] = useState<TipoTema>("auto");

  // Estados para dados de seleção
  const [estados, setEstados] = useState<EstadoIBGE[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("");
  const [cidadeSelecionadaId, setCidadeSelecionadaId] = useState<string>("");

  // Histórico de buscas recentes (LocalStorage)
  const [historico, setHistorico] = useState<CidadeHistorico[]>([]);
  // Cidades Favoritas (LocalStorage)
  const [favoritos, setFavoritos] = useState<CidadeHistorico[]>([]);

  // Estados de carregamento e erro
  const [loadingEstados, setLoadingEstados] = useState<boolean>(true);
  const [loadingMunicipios, setLoadingMunicipios] = useState<boolean>(false);
  const [loadingClima, setLoadingClima] = useState<boolean>(false);
  const [loadingGPS, setLoadingGPS] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  // Modal de Batalha / Comparação de Cidades
  const [isComparadorAberto, setIsComparadorAberto] = useState<boolean>(false);
  // Modal de Cápsula do Tempo
  const [isCapsulaAberta, setIsCapsulaAberta] = useState<boolean>(false);

  // Estado do resultado do clima
  const [dadosClima, setDadosClima] = useState<DadosClimaCidade | null>(null);

  // Resolver o tema ativo em tempo real
  const temaEfetivo = resolverTemaEfetivo(tema, dadosClima);

  // Atualizar data-theme no HTML e no BODY do navegador sempre que o tema mudar
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", temaEfetivo);
      document.body.setAttribute("data-theme", temaEfetivo);
    }
  }, [temaEfetivo]);

  // Troca e persistência do tema
  const handleTemaChange = (novoTema: TipoTema) => {
    setTema(novoTema);
    try {
      localStorage.setItem(TEMA_LOCALSTORAGE_KEY, novoTema);
    } catch {
      // Ignora
    }
  };

  // Salvar cidade no histórico local
  const salvarNoHistorico = useCallback((municipioId: string, municipioNome: string, uf: string, coordenadas?: { latitude: number; longitude: number }) => {
    setHistorico((prev) => {
      const filtrado = prev.filter((item) => item.municipioId !== municipioId);
      const novo = [{ municipioId, municipioNome, uf, coordenadas }, ...filtrado].slice(0, 5);
      try {
        localStorage.setItem(HISTORICO_LOCALSTORAGE_KEY, JSON.stringify(novo));
      } catch {
        // Ignora erros de localStorage
      }
      return novo;
    });
  }, []);

  // Alternar cidade como favorita (Fixar / Desafixar)
  const handleToggleFavorito = useCallback(() => {
    if (!dadosClima) return;
    const id = dadosClima.municipioId;
    const nome = dadosClima.municipio;
    const uf = dadosClima.uf;
    const coordenadas = dadosClima.coordenadas;

    setFavoritos((prev) => {
      const jaExiste = prev.some((item) => item.municipioId === id);
      let novo: CidadeHistorico[];
      if (jaExiste) {
        novo = prev.filter((item) => item.municipioId !== id);
      } else {
        novo = [{ municipioId: id, municipioNome: nome, uf, coordenadas }, ...prev];
      }
      try {
        localStorage.setItem(FAVORITOS_LOCALSTORAGE_KEY, JSON.stringify(novo));
      } catch {
        // Ignora erros
      }
      return novo;
    });
  }, [dadosClima]);

  // Remover cidade favorita específica
  const handleRemoverFavorito = useCallback((id: string) => {
    setFavoritos((prev) => {
      const novo = prev.filter((item) => item.municipioId !== id);
      try {
        localStorage.setItem(FAVORITOS_LOCALSTORAGE_KEY, JSON.stringify(novo));
      } catch {
        // Ignora erros
      }
      return novo;
    });
  }, []);

  // Remover consulta recente específica
  const handleRemoverHistorico = useCallback((id: string) => {
    setHistorico((prev) => {
      const novo = prev.filter((item) => item.municipioId !== id);
      try {
        localStorage.setItem(HISTORICO_LOCALSTORAGE_KEY, JSON.stringify(novo));
      } catch {
        // Ignora erros
      }
      return novo;
    });
  }, []);

  // Limpar todo o histórico recente
  const handleLimparHistorico = useCallback(() => {
    setHistorico([]);
    try {
      localStorage.removeItem(HISTORICO_LOCALSTORAGE_KEY);
    } catch {
      // Ignora erros
    }
  }, []);

  // Executa a busca completa com coordenadas conhecidas ou id do IBGE
  const executarBusca = useCallback(
    async (
      municipioId: string,
      municipioNome: string,
      uf: string,
      coordenadasPreDefinidas?: { latitude: number; longitude: number }
    ) => {
      try {
        setLoadingClima(true);
        setErro(null);

        // Passo 1: Obter coordenadas geográficas (via IBGE ou GPS)
        let coordenadas = coordenadasPreDefinidas;
        if (!coordenadas) {
          if (municipioId === "gps") {
            // Tenta obter coordenadas pelo nome do município no IBGE se não foram salvas
            try {
              const cidadesUf = await getMunicipiosPorUF(uf);
              const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              const encontrada = cidadesUf.find((c) => norm(c.nome) === norm(municipioNome));
              if (encontrada) {
                coordenadas = await getCoordenadasMunicipio(encontrada.id);
              } else {
                throw new Error("Esta consulta gravada não possui coordenadas. Use o botão 'Usar minha localização atual' para renovar.");
              }
            } catch {
              throw new Error("Esta consulta gravada não possui coordenadas. Use o botão 'Usar minha localização atual' para renovar.");
            }
          } else {
            coordenadas = await getCoordenadasMunicipio(municipioId);
          }
        }

        // Passo 2: Buscar clima e dados complementares em paralelo com resiliência total
        const [climaRes, qualidadeArRes, wikiRes, noticiasRes, alertasInmetRes, cemadenRes, elNinoRes, marinhaRes] = await Promise.allSettled([
          getClimaCompleto(coordenadas.latitude, coordenadas.longitude),
          getQualidadeAr(coordenadas.latitude, coordenadas.longitude),
          getResumoWikipedia(municipioNome),
          getNoticiasIBGE(uf),
          getAlertasINMET(uf, municipioId),
          getAlertasCEMADEN(municipioId, uf, municipioNome),
          getDadosElNino(uf),
          getCondicoesMarinhas(coordenadas.latitude, coordenadas.longitude, uf),
        ]);

        if (climaRes.status !== "fulfilled") {
          throw new Error("Não foi possível obter os dados meteorológicos no momento.");
        }

        const { clima, unidades, previsaoDiaria, previsaoHoraria, solar, agro } = climaRes.value;
        const riscoFogo = calcularRiscoFogo(clima.temperature, clima.relative_humidity, clima.windspeed);

        const baseQualidadeAr = qualidadeArRes.status === "fulfilled" ? qualidadeArRes.value : null;
        const qualidadeArComSolar = (baseQualidadeAr || solar)
          ? {
              ...(baseQualidadeAr ?? {}),
              radiacaoSolarKwh: solar?.radiacaoSolarKwh,
              potencialSolar: solar?.potencialSolar,
            }
          : undefined;

        setDadosClima({
          municipioId,
          municipio: municipioNome,
          uf,
          coordenadas,
          clima,
          unidades,
          previsaoDiaria,
          previsaoHoraria,
          qualidadeAr: qualidadeArComSolar,
          wikipedia: wikiRes.status === "fulfilled" ? wikiRes.value ?? undefined : undefined,
          noticiasIBGE: noticiasRes.status === "fulfilled" ? noticiasRes.value : [],
          alertasINMET: alertasInmetRes.status === "fulfilled" ? alertasInmetRes.value : [],
          alertasCEMADEN: cemadenRes.status === "fulfilled" ? cemadenRes.value : [],
          riscoFogo,
          elNino: elNinoRes.status === "fulfilled" ? elNinoRes.value : undefined,
          condicoesMarinhas: marinhaRes.status === "fulfilled" ? marinhaRes.value : null,
          agro,
        });

        // Atualiza a URL do navegador suavemente apenas para permitir copiar o link
        if (typeof window !== "undefined" && municipioId !== "gps") {
          const url = new URL(window.location.origin + window.location.pathname);
          url.searchParams.set("uf", uf);
          url.searchParams.set("cidadeId", municipioId);
          url.searchParams.set("cidade", municipioNome);
          window.history.replaceState(null, "", url.toString());
        }

        salvarNoHistorico(municipioId, municipioNome, uf, coordenadas);
      } catch (err) {
        setErro(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao consultar as informações meteorológicas."
        );
      } finally {
        setLoadingClima(false);
      }
    },
    [salvarNoHistorico]
  );

  // 1. Carregamento inicial único (Estados do IBGE, histórico local, tema e checagem de URL)
  useEffect(() => {
    if (inicializouRef.current) return;
    inicializouRef.current = true;

    async function init() {
      // Carregar tema salvo
      try {
        const temaSalvo = localStorage.getItem(TEMA_LOCALSTORAGE_KEY) as TipoTema;
        if (temaSalvo) {
          setTema(temaSalvo);
        }
      } catch {
        // Ignora
      }

      // Carregar histórico salvo no localStorage
      try {
        const historicoSalvo = localStorage.getItem(HISTORICO_LOCALSTORAGE_KEY);
        if (historicoSalvo) {
          setHistorico(JSON.parse(historicoSalvo));
        }
      } catch {
        // Ignora
      }

      // Carregar cidades favoritas salvas no localStorage
      try {
        const favoritosSalvo = localStorage.getItem(FAVORITOS_LOCALSTORAGE_KEY);
        if (favoritosSalvo) {
          setFavoritos(JSON.parse(favoritosSalvo));
        }
      } catch {
        // Ignora
      }

      // Carregar estados do IBGE
      try {
        setLoadingEstados(true);
        setErro(null);
        const data = await getEstados();
        setEstados(data);

        // Se houver parâmetros de compartilhamento na URL inicial
        const paramUf = searchParams.get("uf");
        const paramCidadeId = searchParams.get("cidadeId");
        const paramCidadeNome = searchParams.get("cidade");

        if (paramUf) {
          setEstadoSelecionado(paramUf);
          const cidadesDaUf = await getMunicipiosPorUF(paramUf);
          setMunicipios(cidadesDaUf);

          if (paramCidadeId && paramCidadeNome) {
            setCidadeSelecionadaId(paramCidadeId);
            executarBusca(paramCidadeId, paramCidadeNome, paramUf);
          }
        }
      } catch (err) {
        setErro(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os estados do IBGE."
        );
      } finally {
        setLoadingEstados(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Mudança de Estado (UF)
  const handleEstadoChange = useCallback(async (uf: string) => {
    setEstadoSelecionado(uf);
    setCidadeSelecionadaId("");
    setMunicipios([]);
    setErro(null);

    if (!uf) return;

    try {
      setLoadingMunicipios(true);
      const data = await getMunicipiosPorUF(uf);
      setMunicipios(data);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : `Erro ao buscar cidades para o estado ${uf}.`
      );
    } finally {
      setLoadingMunicipios(false);
    }
  }, []);

  const handleCidadeChange = useCallback((id: string) => {
    setCidadeSelecionadaId(id);
    setErro(null);
  }, []);

  // 3. Submissão do formulário
  const handleBuscarClima = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cidadeSelecionadaId) {
      setErro("Por favor, selecione uma cidade para continuar.");
      return;
    }

    const cidadeObj = municipios.find((m) => m.id.toString() === cidadeSelecionadaId);
    if (!cidadeObj) {
      setErro("Cidade selecionada não encontrada na lista.");
      return;
    }

    await executarBusca(cidadeSelecionadaId, cidadeObj.nome, estadoSelecionado);
  };

  // 4. Seleção rápida pelo histórico de consultas recentes
  const handleSelecionarHistorico = async (item: CidadeHistorico) => {
    setEstadoSelecionado(item.uf);
    setCidadeSelecionadaId(item.municipioId);

    getMunicipiosPorUF(item.uf)
      .then(setMunicipios)
      .catch(() => {});

    await executarBusca(item.municipioId, item.municipioNome, item.uf, item.coordenadas);
  };

  // 5. Botão "Usar Minha Localização Atual" (GPS do Navegador)
  const handleUsarGPS = () => {
    if (!navigator.geolocation) {
      setErro("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setLoadingGPS(true);
    setErro(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const geo = await reverseGeocodeGPS(latitude, longitude);
          const cidadeNome = geo?.cidade || "Minha Localização";
          const uf = geo?.uf || "BR";

          setEstadoSelecionado(uf);

          // Tenta identificar o ID oficial do município correspondente no IBGE
          let idFinal = "gps";
          let nomeFinal = cidadeNome;

          try {
            const cidadesDaUf = await getMunicipiosPorUF(uf);
            setMunicipios(cidadesDaUf);

            const normalizar = (s: string) =>
              s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const buscado = normalizar(cidadeNome);

            const encontrada = cidadesDaUf.find(
              (m) =>
                normalizar(m.nome) === buscado ||
                normalizar(m.nome).includes(buscado) ||
                buscado.includes(normalizar(m.nome))
            );

            if (encontrada) {
              idFinal = String(encontrada.id);
              nomeFinal = encontrada.nome;
              setCidadeSelecionadaId(idFinal);
            } else {
              setCidadeSelecionadaId("gps");
            }
          } catch {
            setCidadeSelecionadaId("gps");
          }

          await executarBusca(idFinal, nomeFinal, uf, { latitude, longitude });
        } catch {
          setErro("Não foi possível identificar a cidade correspondente ao seu GPS.");
        } finally {
          setLoadingGPS(false);
        }
      },
      (geoError) => {
        setLoadingGPS(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setErro("Permissão de localização foi negada no seu navegador.");
            break;
          case geoError.POSITION_UNAVAILABLE:
            setErro("Sinal de GPS indisponível no momento.");
            break;
          case geoError.TIMEOUT:
            setErro("Tempo esgotado ao tentar obter o GPS.");
            break;
          default:
            setErro("Não foi possível obter a sua localização atual.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <main className="relative min-h-screen flex flex-col justify-between p-3 sm:p-6 lg:p-10 transition-colors duration-500 overflow-x-hidden">
      {/* 🌧️ Efeitos Climáticos Sutis de Fundo (Chuva, Estrelas, Sol) */}
      <WeatherEffects
        weatherCode={dadosClima?.clima?.weathercode}
        isDay={dadosClima?.clima?.is_day}
      />

      <div className="relative z-10 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8">
        {/* Barra Superior: Seletor de Temas */}
        <div className="flex justify-end pt-1 sm:pt-2">
          <ThemeSelector
            temaSelecionado={tema}
            temaEfetivo={temaEfetivo}
            onTemaChange={handleTemaChange}
          />
        </div>

        {/* Cabeçalho da Aplicação */}
        <header className="text-center space-y-3 sm:space-y-4">
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              borderColor: "rgba(16, 185, 129, 0.3)",
              color: "var(--accent-color)",
            }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs md:text-sm font-semibold border text-center"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">IBGE • Open-Meteo • Wikipedia • INMET</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 sm:gap-3">
            <CloudSunRain className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-emerald-500 shrink-0" />
            <h1 style={{ color: "var(--text-main)" }} className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight">
              Clima<span className="text-emerald-500">BR</span>
            </h1>
          </div>

          <p
            style={{ color: "var(--text-muted)" }}
            className="text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed px-1"
          >
            Consulte a previsão meteorológica em tempo real, hora a hora, qualidade do ar, radiação UV e dados oficiais de qualquer município do Brasil.
          </p>
        </header>

        {/* Formulário de Seleção com Histórico Local & GPS */}
        <section aria-label="Seleção de Localidade">
          <LocationForm
            estados={estados}
            municipios={municipios}
            estadoSelecionado={estadoSelecionado}
            cidadeSelecionadaId={cidadeSelecionadaId}
            loadingEstados={loadingEstados}
            loadingMunicipios={loadingMunicipios}
            loadingClima={loadingClima}
            loadingGPS={loadingGPS}
            historico={historico}
            favoritos={favoritos}
            onRemoverFavorito={handleRemoverFavorito}
            onRemoverHistorico={handleRemoverHistorico}
            onLimparHistorico={handleLimparHistorico}
            onEstadoChange={handleEstadoChange}
            onCidadeChange={handleCidadeChange}
            onSelecionarHistorico={handleSelecionarHistorico}
            onUsarGPS={handleUsarGPS}
            onSubmit={handleBuscarClima}
          />
        </section>

        {/* Mensagem de Erro Amigável */}
        {erro && (
          <div
            role="alert"
            className="w-full max-w-3xl mx-auto bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 text-rose-500 flex items-start gap-3 backdrop-blur-md animate-fade-in"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <div className="text-sm font-medium">
              <span className="font-semibold block">Não foi possível prosseguir</span>
              {erro}
            </div>
          </div>
        )}

        {/* Feedback Visual: Skeleton ou Dashboard Completo */}
        <section aria-label="Resultado Meteorológico" className="pb-8">
          {loadingClima ? (
            <WeatherSkeleton />
          ) : dadosClima ? (
            <WeatherCard
              data={dadosClima}
              isFavorito={favoritos.some((f) => f.municipioId === dadosClima.municipioId)}
              favoritos={favoritos}
              onToggleFavorito={handleToggleFavorito}
              onSelecionarCidade={(id, nome, uf, coords) => {
                setEstadoSelecionado(uf);
                setCidadeSelecionadaId(id);
                getMunicipiosPorUF(uf).then(setMunicipios).catch(() => {});
                executarBusca(id, nome, uf, coords);
              }}
              onAbrirComparador={() => setIsComparadorAberto(true)}
              onAbrirCapsula={() => setIsCapsulaAberta(true)}
            />
          ) : (
            <div
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
                boxShadow: "var(--card-shadow)",
              }}
              className="w-full max-w-3xl mx-auto rounded-3xl p-8 border text-center space-y-3 transition-all backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-500">
                <Info className="w-6 h-6" />
              </div>
              <h3 style={{ color: "var(--text-main)" }} className="text-lg font-semibold">
                Nenhuma consulta realizada
              </h3>
              <p style={{ color: "var(--text-muted)" }} className="text-sm max-w-md mx-auto">
                Escolha o Estado e a Cidade desejados, clique em &ldquo;Usar minha localização atual&rdquo; ou use os atalhos de consultas recentes.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal de Batalha / Comparação de Cidades */}
      {dadosClima && (
        <CityComparisonModal
          cidadePrincipal={dadosClima}
          estados={estados}
          isOpen={isComparadorAberto}
          onClose={() => setIsComparadorAberto(false)}
        />
      )}

      {/* Modal de Cápsula do Tempo do Clima */}
      {dadosClima && (
        <TimeCapsuleModal
          cidade={dadosClima}
          isOpen={isCapsulaAberta}
          onClose={() => setIsCapsulaAberta(false)}
        />
      )}

      {/* Rodapé Executivo Institucional */}
      <Footer />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<WeatherSkeleton />}>
      <WeatherAppContent />
    </Suspense>
  );
}
