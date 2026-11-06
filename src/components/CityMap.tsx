import React, { useState } from "react";
import { Coordenadas } from "@/types/weather";
import { Map, ExternalLink, Layers, ZoomIn, ZoomOut } from "lucide-react";

interface CityMapProps {
  municipio: string;
  uf: string;
  coordenadas: Coordenadas;
}

export function CityMap({ municipio, uf, coordenadas }: CityMapProps) {
  const [zoomLevel, setZoomLevel] = useState(0.06);

  const { latitude, longitude } = coordenadas;

  // Calcula o bounding box para o embed do OpenStreetMap
  const minLon = (longitude - zoomLevel * 1.5).toFixed(4);
  const minLat = (latitude - zoomLevel).toFixed(4);
  const maxLon = (longitude + zoomLevel * 1.5).toFixed(4);
  const maxLat = (latitude + zoomLevel).toFixed(4);

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${latitude.toFixed(
    4
  )}%2C${longitude.toFixed(4)}`;

  const osmFullUrl = `https://www.openstreetmap.org/?mlat=${latitude.toFixed(
    4
  )}&mlon=${longitude.toFixed(4)}#map=12/${latitude.toFixed(4)}/${longitude.toFixed(4)}`;

  const ajustarZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(0.2, Math.max(0.015, prev + delta)));
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
      }}
      className="rounded-3xl p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-4"
    >
      {/* Cabeçalho do Mapa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <h3 style={{ color: "var(--text-main)" }} className="text-base font-bold">
              Localização Cartográfica
            </h3>
            <p style={{ color: "var(--text-muted)" }} className="text-xs">
              Centroide geográfico do IBGE ({latitude.toFixed(3)}°, {longitude.toFixed(3)}°)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Controles de Zoom */}
          <button
            type="button"
            onClick={() => ajustarZoom(-0.02)}
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
            onClick={() => ajustarZoom(0.02)}
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
            className="text-xs text-emerald-500 hover:opacity-80 flex items-center gap-1 font-semibold ml-1"
          >
            OpenStreetMap <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame do Mapa com Bordas Arredondadas */}
      <div className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden border border-slate-700/40 shadow-inner">
        <iframe
          key={`${latitude}-${longitude}-${zoomLevel}`}
          title={`Mapa de ${municipio} - ${uf}`}
          src={osmEmbedUrl}
          className="w-full h-full border-0 select-none"
          loading="lazy"
        />
        <div
          style={{
            backgroundColor: "var(--chip-bg)",
            borderColor: "var(--chip-border)",
            color: "var(--chip-text)",
          }}
          className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg border text-[11px] font-medium backdrop-blur-md pointer-events-none opacity-90 flex items-center gap-1 shadow"
        >
          <Layers className="w-3 h-3 text-emerald-500" />
          <span>{municipio} ({uf})</span>
        </div>
      </div>
    </div>
  );
}

