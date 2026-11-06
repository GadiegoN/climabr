import React, { useState } from "react";
import { EstadoIBGE, MunicipioIBGE, DadosClimaCidade } from "@/types/weather";
import {
  getMunicipiosPorUF,
  getCoordenadasMunicipio,
  getClimaCompleto,
  getQualidadeAr,
} from "@/services/api";
import {
  X,
  Swords,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface CityComparisonModalProps {
  cidadePrincipal: DadosClimaCidade;
  estados: EstadoIBGE[];
  isOpen: boolean;
  onClose: () => void;
}

export function CityComparisonModal({
  cidadePrincipal,
  estados,
  isOpen,
  onClose,
}: CityComparisonModalProps) {
  const [ufComp, setUfComp] = useState<string>("");
  const [cidadesComp, setCidadesComp] = useState<MunicipioIBGE[]>([]);
  const [cidadeIdComp, setCidadeIdComp] = useState<string>("");
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [erroComp, setErroComp] = useState<string | null>(null);
  const [dadosComparada, setDadosComparada] = useState<DadosClimaCidade | null>(null);

  if (!isOpen) return null;

  const handleUfChange = async (uf: string) => {
    setUfComp(uf);
    setCidadeIdComp("");
    setDadosComparada(null);
    setErroComp(null);

    if (!uf) return;
    try {
      setLoadingCidades(true);
      const data = await getMunicipiosPorUF(uf);
      setCidadesComp(data);
    } catch {
      setErroComp("Erro ao carregar cidades.");
    } finally {
      setLoadingCidades(false);
    }
  };

  const handleBuscarComparacao = async () => {
    if (!cidadeIdComp) return;
    const cidadeObj = cidadesComp.find((c) => c.id.toString() === cidadeIdComp);
    if (!cidadeObj) return;

    try {
      setLoadingComp(true);
      setErroComp(null);

      const coordenadas = await getCoordenadasMunicipio(cidadeIdComp);
      const [climaRes, arRes] = await Promise.allSettled([
        getClimaCompleto(coordenadas.latitude, coordenadas.longitude),
        getQualidadeAr(coordenadas.latitude, coordenadas.longitude),
      ]);

      if (climaRes.status !== "fulfilled") {
        throw new Error("Erro ao buscar clima da cidade.");
      }

      setDadosComparada({
        municipioId: cidadeIdComp,
        municipio: cidadeObj.nome,
        uf: ufComp,
        coordenadas,
        clima: climaRes.value.clima,
        unidades: climaRes.value.unidades,
        previsaoDiaria: climaRes.value.previsaoDiaria,
        previsaoHoraria: climaRes.value.previsaoHoraria,
        qualidadeAr: arRes.status === "fulfilled" ? arRes.value ?? undefined : undefined,
      });
    } catch (err) {
      setErroComp(err instanceof Error ? err.message : "Erro na comparação.");
    } finally {
      setLoadingComp(false);
    }
  };

  const c1 = cidadePrincipal;
  const c2 = dadosComparada;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
          color: "var(--text-main)",
        }}
        className="relative w-full max-w-3xl rounded-3xl border p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-6"
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">Batalha do Clima (Comparador)</h2>
              <p style={{ color: "var(--text-muted)" }} className="text-xs">
                Compare as condições meteorológicas de duas cidades brasileiras lado a lado
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seleção da Cidade 2 */}
        <div
          style={{
            backgroundColor: "var(--chip-bg)",
            borderColor: "var(--chip-border)",
          }}
          className="p-4 rounded-2xl border space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 block">
            Escolha a segunda cidade para comparar com {c1.municipio} ({c1.uf}):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={ufComp}
              onChange={(e) => handleUfChange(e.target.value)}
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecione o Estado</option>
              {estados.map((e) => (
                <option key={e.id} value={e.sigla} style={{ backgroundColor: "var(--bg-page)", color: "var(--text-main)" }}>
                  {e.nome} ({e.sigla})
                </option>
              ))}
            </select>

            <select
              value={cidadeIdComp}
              disabled={!ufComp || loadingCidades}
              onChange={(e) => setCidadeIdComp(e.target.value)}
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value="">
                {!ufComp ? "Escolha a UF primeiro" : loadingCidades ? "Carregando..." : "Selecione a Cidade"}
              </option>
              {cidadesComp.map((c) => (
                <option key={c.id} value={c.id.toString()} style={{ backgroundColor: "var(--bg-page)", color: "var(--text-main)" }}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleBuscarComparacao}
            disabled={!cidadeIdComp || loadingComp}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loadingComp ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
            <span>Comparar Agora</span>
          </button>

          {erroComp && <p className="text-xs text-rose-400 text-center font-medium">{erroComp}</p>}
        </div>

        {/* Tabela Comparativa Lado a Lado */}
        {c2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-3 gap-2 text-center font-bold text-sm border-b pb-3" style={{ borderColor: "var(--card-border)" }}>
              <div className="text-emerald-500 truncate">{c1.municipio} ({c1.uf})</div>
              <div style={{ color: "var(--text-muted)" }}>Métrica</div>
              <div className="text-sky-500 truncate">{c2.municipio} ({c2.uf})</div>
            </div>

            {/* Linha 1: Temperatura */}
            <div className="grid grid-cols-3 gap-2 items-center text-center p-3 rounded-xl" style={{ backgroundColor: "var(--chip-bg)" }}>
              <div className={`text-xl font-black ${c1.clima.temperature >= c2.clima.temperature ? "text-amber-400 font-extrabold" : ""}`}>
                {Math.round(c1.clima.temperature)}°C
              </div>
              <div className="text-xs flex items-center justify-center gap-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                <Thermometer className="w-4 h-4 text-emerald-500" /> Temperatura
              </div>
              <div className={`text-xl font-black ${c2.clima.temperature >= c1.clima.temperature ? "text-amber-400 font-extrabold" : ""}`}>
                {Math.round(c2.clima.temperature)}°C
              </div>
            </div>

            {/* Linha 2: Vento */}
            <div className="grid grid-cols-3 gap-2 items-center text-center p-3 rounded-xl" style={{ backgroundColor: "var(--chip-bg)" }}>
              <div className="text-sm font-bold">
                {c1.clima.windspeed} km/h
              </div>
              <div className="text-xs flex items-center justify-center gap-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                <Wind className="w-4 h-4 text-teal-400" /> Vento
              </div>
              <div className="text-sm font-bold">
                {c2.clima.windspeed} km/h
              </div>
            </div>

            {/* Linha 3: Umidade */}
            <div className="grid grid-cols-3 gap-2 items-center text-center p-3 rounded-xl" style={{ backgroundColor: "var(--chip-bg)" }}>
              <div className="text-sm font-bold">
                {c1.clima.relative_humidity !== undefined ? `${c1.clima.relative_humidity}%` : "N/D"}
              </div>
              <div className="text-xs flex items-center justify-center gap-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                <Droplets className="w-4 h-4 text-sky-400" /> Umidade
              </div>
              <div className="text-sm font-bold">
                {c2.clima.relative_humidity !== undefined ? `${c2.clima.relative_humidity}%` : "N/D"}
              </div>
            </div>

            {/* Linha 4: Índice UV */}
            <div className="grid grid-cols-3 gap-2 items-center text-center p-3 rounded-xl" style={{ backgroundColor: "var(--chip-bg)" }}>
              <div className="text-sm font-bold">
                {c1.qualidadeAr?.uvIndex !== undefined ? c1.qualidadeAr.uvIndex.toFixed(1) : "--"}
              </div>
              <div className="text-xs flex items-center justify-center gap-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                <Sun className="w-4 h-4 text-amber-400" /> Índice UV
              </div>
              <div className="text-sm font-bold">
                {c2.qualidadeAr?.uvIndex !== undefined ? c2.qualidadeAr.uvIndex.toFixed(1) : "--"}
              </div>
            </div>

            {/* Linha 5: Chuva Atual */}
            <div className="grid grid-cols-3 gap-2 items-center text-center p-3 rounded-xl" style={{ backgroundColor: "var(--chip-bg)" }}>
              <div className="text-xs font-bold text-sky-400">
                {c1.clima.precipitation && c1.clima.precipitation > 0 ? `${c1.clima.precipitation} mm` : "Sem chuva"}
              </div>
              <div className="text-xs flex items-center justify-center gap-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                <CloudRain className="w-4 h-4 text-blue-400" /> Chuva
              </div>
              <div className="text-xs font-bold text-sky-400">
                {c2.clima.precipitation && c2.clima.precipitation > 0 ? `${c2.clima.precipitation} mm` : "Sem chuva"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

