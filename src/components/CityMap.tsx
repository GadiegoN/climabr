"use client";

import React, { useState, useEffect, useRef } from "react";
import { Coordenadas, CidadeHistorico } from "@/types/weather";
import { getCoordenadasMunicipio } from "@/services/api";
import {
  Map as MapIcon,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Star,
  ExternalLink,
  Layers,
  Loader2,
} from "lucide-react";

interface CityMapProps {
  municipio: string;
  uf: string;
  coordenadas: Coordenadas;
  favoritos?: CidadeHistorico[];
  onSelecionarCidade?: (id: string, nome: string, uf: string, coordenadas?: Coordenadas) => void;
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
  const [mapCarregado, setMapCarregado] = useState(false);
  const [falhaScript, setFalhaScript] = useState(false);
  const [favoritosComCoords, setFavoritosComCoords] = useState<CidadeHistorico[]>([]);

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

    // Se Leaflet já estiver carregado no window
    if ((window as any).L) {
      setMapCarregado(true);
      return;
    }

    // Carrega CSS do Leaflet
    const linkId = "leaflet-css-cdn";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Carrega JS do Leaflet
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

    // Se o mapa ainda não foi criado
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([latitude, longitude], 11);

      // Camada de Tiles oficiais OpenStreetMap (100% gratuita, sem necessidade de API key)
      L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }
      ).addTo(map);

      // Camada para os Marcadores (Pins)
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    if (!markersLayer) return;
    markersLayer.clearLayers();

    const todosPontos: [number, number][] = [];

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
    todosPontos.push([latitude, longitude]);

    // --- PINS 2: CIDADES FAVORITAS SALVAS (Dourado com Estrela ⭐) ---
    favoritosComCoords.forEach((fav) => {
      if (!fav.coordenadas) return;
      const fLat = fav.coordenadas.latitude;
      const fLon = fav.coordenadas.longitude;

      // Pula se for a mesma cidade atual para não sobrepor
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

      // Evento de clique no botão do popup
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

      todosPontos.push([fLat, fLon]);
    });

    // Centraliza na cidade atual
    map.setView([latitude, longitude], 11);
  }, [mapCarregado, latitude, longitude, municipio, uf, favoritosComCoords, onSelecionarCidade]);

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

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
      }}
      className="rounded-3xl p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-4"
    >
      {/* Cabeçalho do Mapa com Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <MapIcon className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 style={{ color: "var(--text-main)" }} className="text-base font-bold">
                Lugares Salvos
              </h3>
              {totalSalvas > 0 && (
                <span className="badge-amber px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 shrink-0">
                  <span>{totalSalvas} {totalSalvas === 1 ? "salva" : "salvas"}</span>
                  <span>⭐</span>
                </span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)" }} className="text-xs">
              Clique nos pins no mapa para inspecionar a previsão
            </p>
          </div>
        </div>

        {/* Barra de Ferramentas / Ações Rápidas */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Botão Focar Cidade Atual */}
          <button
            type="button"
            onClick={handleFocarAtual}
            title="Centralizar na cidade atual"
            style={{
              backgroundColor: "var(--chip-bg)",
              borderColor: "var(--chip-border)",
              color: "var(--chip-text)",
            }}
            className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Cidade Atual</span>
          </button>

          {/* Botão Ver Todas as Salvas */}
          {totalSalvas > 0 && (
            <button
              type="button"
              onClick={handleVerTodas}
              title="Ajustar zoom para mostrar todas as cidades salvas no mapa do Brasil"
              style={{
                backgroundColor: "var(--chip-bg)",
                borderColor: "var(--chip-border)",
                color: "var(--chip-text)",
              }}
              className="px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Ver Salvas ({totalSalvas})</span>
            </button>
          )}

          {/* Controles de Zoom */}
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

          <a
            href={osmFullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-400 hover:opacity-80 flex items-center gap-1 font-semibold ml-1"
          >
            OSM <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Frame do Mapa Interativo */}
      <div className="relative w-full h-72 md:h-80 rounded-2xl overflow-hidden border border-slate-700/40 shadow-inner bg-slate-900/50">
        {falhaScript ? (
          // Fallback caso a rede bloqueie o CDN do Leaflet
          <iframe
            title={`Mapa de ${municipio} - ${uf}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(longitude - 0.08).toFixed(4)}%2C${(latitude - 0.06).toFixed(4)}%2C${(longitude + 0.08).toFixed(4)}%2C${(latitude + 0.06).toFixed(4)}&layer=mapnik&marker=${latitude.toFixed(4)}%2C${longitude.toFixed(4)}`}
            className="w-full h-full border-0 select-none"
            loading="lazy"
          />
        ) : (
          <>
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            {!mapCarregado && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10 gap-2 text-xs font-semibold text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Carregando mapa interativo...</span>
              </div>
            )}
          </>
        )}

        {/* Legenda Informativa no Canto Inferior */}
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--card-border)",
            color: "var(--text-main)",
          }}
          className="absolute bottom-2 left-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md pointer-events-none opacity-95 flex items-center gap-2 shadow z-[400]"
        >
          <div className="flex items-center gap-1.5 font-bold text-emerald-500">
            <span>📍</span>
            <span>Atual: {municipio}</span>
          </div>
          {totalSalvas > 0 && (
            <div className="flex items-center gap-1.5 font-bold text-amber-500 border-l border-[var(--card-border)] pl-2">
              <span>⭐</span>
              <span>{totalSalvas} Salva{totalSalvas > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
