"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Coordenadas, CidadeHistorico } from "@/types/weather";
import { getCoordenadasMunicipio } from "@/services/api";
import {
  Map as MapIcon,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Star,
  ExternalLink,
  Loader2,
  CloudRain,
  Play,
  Pause,
  RotateCcw,
  Radio,
} from "lucide-react";

interface CityMapProps {
  municipio: string;
  uf: string;
  coordenadas: Coordenadas;
  favoritos?: CidadeHistorico[];
  onSelecionarCidade?: (id: string, nome: string, uf: string, coordenadas?: Coordenadas) => void;
}

type ModoVisualizacao = "cidades" | "radar";

interface RadarFrame {
  time: number;
  path: string;
}

export function CityMap({
  municipio,
  uf,
  coordenadas,
  favoritos = [],
  onSelecionarCidade,
}: CityMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const radarLayerRef = useRef<any>(null);

  const [mapCarregado, setMapCarregado] = useState(false);
  const [falhaScript, setFalhaScript] = useState(false);
  const [favoritosComCoords, setFavoritosComCoords] = useState<CidadeHistorico[]>([]);

  // Estados do Modo de Visualização (Pins de Cidades vs Radar de Chuva)
  const [modo, setModo] = useState<ModoVisualizacao>("cidades");

  // Estados do Radar RainViewer
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarHost, setRadarHost] = useState<string>("https://tilecache.rainviewer.com");
  const [frameAtualIdx, setFrameAtualIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loadingRadar, setLoadingRadar] = useState<boolean>(false);

  const { latitude, longitude } = coordenadas;

  // 1. Assegura que todas as cidades favoritas tenham coordenadas para serem marcadas no mapa
  useEffect(() => {
    let isMounted = true;

    async function resolverCoordenadas() {
      const atualizados: CidadeHistorico[] = [];
      for (const fav of favoritos) {
        if (fav.coordenadas && fav.coordenadas.latitude && fav.coordenadas.longitude) {
          atualizados.push(fav);
        } else if (fav.municipioId && fav.municipioId !== "gps") {
          try {
            const coords = await getCoordenadasMunicipio(fav.municipioId);
            atualizados.push({ ...fav, coordenadas: coords });
          } catch {
            // Ignora falha individual
          }
        }
      }
      if (isMounted) {
        setFavoritosComCoords(atualizados);
      }
    }

    resolverCoordenadas();
    return () => {
      isMounted = false;
    };
  }, [favoritos]);

  // 2. Carrega Leaflet de forma dinâmica sem pesar no bundle inicial da aplicação
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setMapCarregado(true);
      return;
    }

    const linkId = "leaflet-css-cdn";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-js-cdn";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        setMapCarregado(true);
      };
      script.onerror = () => {
        setFalhaScript(true);
      };
      document.body.appendChild(script);
    } else {
      setMapCarregado(true);
    }
  }, []);

  // 3. Inicializa o Mapa Interativo Leaflet
  useEffect(() => {
    if (!mapCarregado || !mapContainerRef.current || (window as any).L === undefined) return;

    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 11);

      // Camada de Tiles oficiais OpenStreetMap (100% gratuita, sem API key)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    if (!markersLayer) return;
    markersLayer.clearLayers();

    // --- PIN 1: CIDADE ATUAL (Esmeralda com Pulso) ---
    const iconeCidadeAtual = L.divIcon({
      className: "custom-pin-atual",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; cursor: pointer;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(16, 185, 129, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #10b981; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
            📍
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -18],
    });

    const markerAtual = L.marker([latitude, longitude], { icon: iconeCidadeAtual }).addTo(markersLayer);
    markerAtual.bindPopup(`
      <div style="font-family: system-ui, sans-serif; text-align: center; padding: 4px; min-width: 140px;">
        <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${municipio} - ${uf}</div>
        <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 3px;">● Localização Atual</div>
      </div>
    `);

    // --- PINS 2: CIDADES FAVORITAS SALVAS (Dourado com Estrela ⭐) ---
    favoritosComCoords.forEach((fav) => {
      if (!fav.coordenadas) return;
      const fLat = fav.coordenadas.latitude;
      const fLon = fav.coordenadas.longitude;

      if (
        Math.abs(fLat - latitude) < 0.005 &&
        Math.abs(fLon - longitude) < 0.005
      ) {
        return;
      }

      const iconeFavorito = L.divIcon({
        className: "custom-pin-favorito",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer;">
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #f59e0b; border: 2px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
              ⭐
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -16],
      });

      const markerFav = L.marker([fLat, fLon], { icon: iconeFavorito }).addTo(markersLayer);

      const popupHtml = document.createElement("div");
      popupHtml.style.fontFamily = "system-ui, sans-serif";
      popupHtml.style.textAlign = "center";
      popupHtml.style.padding = "4px";
      popupHtml.style.minWidth = "150px";

      popupHtml.innerHTML = `
        <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${fav.municipioNome} - ${fav.uf}</div>
        <div style="font-size: 11px; color: #d97706; font-weight: 700; margin-top: 2px;">⭐ Cidade Salva</div>
        <button id="btn-ver-clima-${fav.municipioId}" style="margin-top: 8px; width: 100%; padding: 6px 10px; background: #0284c7; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; font-size: 11px; cursor: pointer; transition: background 0.2s;">
          Ver Previsão Completa
        </button>
      `;

      markerFav.bindPopup(popupHtml);

      markerFav.on("popupopen", () => {
        const btn = document.getElementById(`btn-ver-clima-${fav.municipioId}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelecionarCidade) {
              onSelecionarCidade(fav.municipioId, fav.municipioNome, fav.uf, fav.coordenadas);
            }
          };
        }
      });
    });

    map.setView([latitude, longitude], 11);
  }, [mapCarregado, latitude, longitude, municipio, uf, favoritosComCoords, onSelecionarCidade]);

  // 4. Integração com a API do RainViewer para Radar de Chuva em Tempo Real
  const carregarRadar = useCallback(async () => {
    try {
      setLoadingRadar(true);
      const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      if (!res.ok) throw new Error("Falha RainViewer");
      const data = await res.json();

      const host = data.host || "https://tilecache.rainviewer.com";
      setRadarHost(host);

      const past = Array.isArray(data.radar?.past) ? data.radar.past : [];
      const nowcast = Array.isArray(data.radar?.nowcast) ? data.radar.nowcast : [];
      const todosFrames: RadarFrame[] = [...past, ...nowcast];

      if (todosFrames.length > 0) {
        setRadarFrames(todosFrames);
        // Começa no último frame registrado (tempo atual / agora)
        const idxInicial = past.length > 0 ? past.length - 1 : todosFrames.length - 1;
        setFrameAtualIdx(idxInicial);
      }
    } catch (err) {
      console.warn("Não foi possível carregar radar RainViewer:", err);
    } finally {
      setLoadingRadar(false);
    }
  }, []);

  // Quando o usuário alterna para a aba "radar", busca os dados de chuva caso ainda não tenha
  useEffect(() => {
    if (modo === "radar" && radarFrames.length === 0) {
      carregarRadar();
    }
  }, [modo, radarFrames.length, carregarRadar]);

  // 5. Atualização da Camada de Radar no Leaflet
  useEffect(() => {
    if (!mapInstanceRef.current || (window as any).L === undefined) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    if (modo !== "radar" || radarFrames.length === 0) {
      // Se saiu do modo radar, remove a camada de chuva
      if (radarLayerRef.current) {
        map.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
      return;
    }

    const frame = radarFrames[frameAtualIdx];
    if (!frame) return;

    // Esquema de cores 2: Padrão universal (verde = leve, amarelo = moderada, vermelho = forte, roxo = severa)
    const tileUrl = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    if (!radarLayerRef.current) {
      radarLayerRef.current = L.tileLayer(tileUrl, {
        opacity: 0.72,
        zIndex: 50,
      }).addTo(map);
    } else {
      radarLayerRef.current.setUrl(tileUrl);
    }
  }, [modo, radarFrames, frameAtualIdx, radarHost]);

  // 6. Loop de Reprodução Automática (Animação de Chuva)
  useEffect(() => {
    if (!isPlaying || modo !== "radar" || radarFrames.length === 0) return;

    const interval = setInterval(() => {
      setFrameAtualIdx((prev) => (prev + 1) % radarFrames.length);
    }, 700);

    return () => clearInterval(interval);
  }, [isPlaying, modo, radarFrames.length]);

  // Controles de Ação do Mapa
  const handleFocarAtual = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([latitude, longitude], 12, { duration: 1 });
    }
  };

  const handleVerTodas = () => {
    if (!mapInstanceRef.current || (window as any).L === undefined) return;
    const L = (window as any).L;

    const pontos: [number, number][] = [[latitude, longitude]];
    favoritosComCoords.forEach((f) => {
      if (f.coordenadas) {
        pontos.push([f.coordenadas.latitude, f.coordenadas.longitude]);
      }
    });

    if (pontos.length > 1) {
      const bounds = L.latLngBounds(pontos);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
    } else {
      handleFocarAtual();
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const osmFullUrl = `https://www.openstreetmap.org/?mlat=${latitude.toFixed(
    4
  )}&mlon=${longitude.toFixed(4)}#map=12/${latitude.toFixed(4)}/${longitude.toFixed(4)}`;

  const totalSalvas = favoritosComCoords.length;

  // Formatação do timestamp do radar
  const getHoraFrame = (timestamp?: number) => {
    if (!timestamp) return "--:--";
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const frameAtual = radarFrames[frameAtualIdx];

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
      }}
      className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-3.5 sm:space-y-4"
    >
      {/* Cabeçalho do Mapa com Alternador de Modos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <MapIcon className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 style={{ color: "var(--text-main)" }} className="text-sm sm:text-base font-bold">
                {modo === "cidades" ? "Lugares Salvos" : "Radar de Chuva em Tempo Real"}
              </h3>
              {modo === "cidades" && totalSalvas > 0 && (
                <span className="badge-amber px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 shrink-0">
                  <span>{totalSalvas} {totalSalvas === 1 ? "salva" : "salvas"}</span>
                  <span>⭐</span>
                </span>
              )}
              {modo === "radar" && (
                <span className="badge-sky px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>RainViewer Satélite</span>
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)" }} className="text-xs truncate sm:whitespace-normal">
              {modo === "cidades"
                ? "Clique nos pins para inspecionar o clima de cada localidade"
                : "Acompanhe o movimento das nuvens de chuva nas últimas horas"}
            </p>
          </div>
        </div>

        {/* Barra de Ações & Alternador de Modo */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Seletor Segmentado de Modo */}
          <div className="flex items-center p-0.5 sm:p-1 rounded-2xl bg-black/10 dark:bg-white/5 border border-[var(--card-border)]">
            <button
              type="button"
              onClick={() => {
                setModo("cidades");
                setIsPlaying(false);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([latitude, longitude], 11);
                }
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                modo === "cidades"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Pins Salvos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModo("radar");
                setIsPlaying(true);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([latitude, longitude], 9);
                }
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                modo === "radar"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 shrink-0" />
              <span>Chuva ao Vivo</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>

          {/* Botões de Navegação & Zoom */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleFocarAtual}
              title="Centralizar na cidade atual"
              style={{
                backgroundColor: "var(--chip-bg)",
                borderColor: "var(--chip-border)",
                color: "var(--chip-text)",
              }}
              className="p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            {modo === "cidades" && totalSalvas > 0 && (
              <button
                type="button"
                onClick={handleVerTodas}
                title="Mostrar todas as cidades salvas no mapa"
                style={{
                  backgroundColor: "var(--chip-bg)",
                  borderColor: "var(--chip-border)",
                  color: "var(--chip-text)",
                }}
                className="px-2 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="hidden md:inline">Salvas</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleZoomIn}
              title="Aproximar zoom"
              style={{
                backgroundColor: "var(--chip-bg)",
                borderColor: "var(--chip-border)",
                color: "var(--chip-text)",
              }}
              className="p-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="Afastar zoom"
              style={{
                backgroundColor: "var(--chip-bg)",
                borderColor: "var(--chip-border)",
                color: "var(--chip-text)",
              }}
              className="p-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Frame do Mapa Interativo */}
      <div className="relative w-full h-[300px] sm:h-80 md:h-96 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700/40 shadow-inner bg-slate-900/50">
        {falhaScript ? (
          <iframe
            title={`Mapa de ${municipio} - ${uf}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(longitude - 0.08).toFixed(4)}%2C${(latitude - 0.06).toFixed(4)}%2C${(longitude + 0.08).toFixed(4)}%2C${(latitude + 0.06).toFixed(4)}&layer=mapnik&marker=${latitude.toFixed(4)}%2C${longitude.toFixed(4)}`}
            className="w-full h-full border-0 select-none"
            loading="lazy"
          />
        ) : (
          <>
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            {(!mapCarregado || loadingRadar) && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10 gap-2 text-xs font-semibold text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>{loadingRadar ? "Carregando dados de satélite do RainViewer..." : "Carregando mapa interativo..."}</span>
              </div>
            )}
          </>
        )}

        {/* 🌧️ PLAYER CONTROLLER DE RADAR (Visível apenas no Modo Radar) */}
        {modo === "radar" && radarFrames.length > 0 && (
          <div className="absolute bottom-2.5 inset-x-2 sm:inset-x-4 md:inset-x-6 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-white/20 backdrop-blur-md shadow-2xl z-[400] space-y-1.5 sm:space-y-2 text-white">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {/* Botão Play / Pause */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? "Pausar animação" : "Iniciar animação de chuva"}
                  className="p-1.5 sm:p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-all active:scale-95 cursor-pointer shadow-md shadow-sky-500/25 shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <div className="min-w-0">
                  <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                    <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>{getHoraFrame(frameAtual?.time)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 text-slate-300 font-medium">
                      {frameAtualIdx === radarFrames.length - 1 ? "Agora" : `${frameAtualIdx + 1}/${radarFrames.length}`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate hidden sm:block">Precipitação detectada por radar</p>
                </div>
              </div>

              {/* Escala de Intensidade de Chuva */}
              <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-300 font-semibold bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 shrink-0">
                <span>Leve</span>
                <div className="w-16 md:w-20 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 via-rose-500 to-purple-600 shadow-inner" />
                <span>Severa</span>
              </div>
            </div>

            {/* Linha do Tempo / Slider Interativo */}
            <input
              type="range"
              min={0}
              max={radarFrames.length - 1}
              value={frameAtualIdx}
              onChange={(e) => {
                setIsPlaying(false);
                setFrameAtualIdx(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        )}

        {/* Legenda Informativa no Modo Cidades */}
        {modo === "cidades" && (
          <div
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--card-border)",
              color: "var(--text-main)",
            }}
            className="absolute bottom-2 left-2 max-w-[calc(100%-16px)] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold backdrop-blur-md pointer-events-none opacity-95 flex items-center gap-2 shadow z-[400] overflow-hidden"
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-500 truncate">
              <span>📍</span>
              <span className="truncate">{municipio}</span>
            </div>
            {totalSalvas > 0 && (
              <div className="flex items-center gap-1.5 font-bold text-amber-500 border-l border-[var(--card-border)] pl-2 shrink-0">
                <span>⭐</span>
                <span>{totalSalvas} Salva{totalSalvas > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
