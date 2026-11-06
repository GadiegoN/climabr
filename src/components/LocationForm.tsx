import React from "react";
import { EstadoIBGE, MunicipioIBGE, CidadeHistorico } from "@/types/weather";
import { Search, Loader2, MapPin, Building2, History, LocateFixed } from "lucide-react";

interface LocationFormProps {
  estados: EstadoIBGE[];
  municipios: MunicipioIBGE[];
  estadoSelecionado: string;
  cidadeSelecionadaId: string;
  loadingEstados: boolean;
  loadingMunicipios: boolean;
  loadingClima: boolean;
  loadingGPS: boolean;
  historico: CidadeHistorico[];
  onEstadoChange: (uf: string) => void;
  onCidadeChange: (id: string) => void;
  onSelecionarHistorico: (item: CidadeHistorico) => void;
  onUsarGPS: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LocationForm({
  estados,
  municipios,
  estadoSelecionado,
  cidadeSelecionadaId,
  loadingEstados,
  loadingMunicipios,
  loadingClima,
  loadingGPS,
  historico,
  onEstadoChange,
  onCidadeChange,
  onSelecionarHistorico,
  onUsarGPS,
  onSubmit,
}: LocationFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
      }}
      className="w-full max-w-3xl mx-auto rounded-3xl p-6 sm:p-8 border backdrop-blur-xl transition-all duration-300 space-y-5"
    >
      {/* Botão de Localização Atual por GPS */}
      <div
        style={{ borderColor: "var(--card-border)" }}
        className="flex items-center justify-between border-b pb-4"
      >
        <span style={{ color: "var(--text-muted)" }} className="text-xs font-semibold">
          Buscar por município ou:
        </span>
        <button
          type="button"
          onClick={onUsarGPS}
          disabled={loadingClima || loadingGPS}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loadingGPS ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span>{loadingGPS ? "Obtendo GPS..." : "Usar minha localização atual"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Campo 1: Estado (UF) */}
        <div className="space-y-2">
          <label
            htmlFor="estado-select"
            style={{ color: "var(--text-main)" }}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <MapPin className="w-4 h-4 text-emerald-500" />
            Estado (UF)
          </label>
          <div className="relative">
            <select
              id="estado-select"
              value={estadoSelecionado}
              disabled={loadingEstados || loadingClima || loadingGPS}
              onChange={(e) => onEstadoChange(e.target.value)}
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
              className="w-full appearance-none rounded-2xl px-4 py-3.5 pr-10 border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-inner cursor-pointer"
            >
              <option value="">
                {loadingEstados ? "Carregando estados do IBGE..." : "Selecione um Estado"}
              </option>
              {estados.map((estado) => (
                <option
                  key={estado.id}
                  value={estado.sigla}
                  style={{ backgroundColor: "var(--bg-page)", color: "var(--text-main)" }}
                >
                  {estado.nome} ({estado.sigla})
                </option>
              ))}
            </select>
            <div
              style={{ color: "var(--text-muted)" }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
            >
              {loadingEstados ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              ) : (
                <span className="text-xs">▼</span>
              )}
            </div>
          </div>
        </div>

        {/* Campo 2: Cidade */}
        <div className="space-y-2">
          <label
            htmlFor="cidade-select"
            style={{ color: "var(--text-main)" }}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Building2 className="w-4 h-4 text-emerald-500" />
            Município
          </label>
          <div className="relative">
            <select
              id="cidade-select"
              value={cidadeSelecionadaId}
              disabled={!estadoSelecionado || loadingMunicipios || loadingClima || loadingGPS}
              onChange={(e) => onCidadeChange(e.target.value)}
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
              className="w-full appearance-none rounded-2xl px-4 py-3.5 pr-10 border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium shadow-inner cursor-pointer"
            >
              <option value="">
                {!estadoSelecionado
                  ? "Primeiro escolha um estado"
                  : loadingMunicipios
                  ? "Carregando cidades do IBGE..."
                  : "Selecione uma Cidade"}
              </option>
              {municipios.map((municipio) => (
                <option
                  key={municipio.id}
                  value={municipio.id.toString()}
                  style={{ backgroundColor: "var(--bg-page)", color: "var(--text-main)" }}
                >
                  {municipio.nome}
                </option>
              ))}
            </select>
            <div
              style={{ color: "var(--text-muted)" }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
            >
              {loadingMunicipios ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              ) : (
                <span className="text-xs">▼</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Cidades Recentes (Salvo no Navegador) */}
      {historico.length > 0 && (
        <div className="pt-1">
          <p style={{ color: "var(--text-muted)" }} className="text-xs font-semibold flex items-center gap-1.5 mb-2">
            <History className="w-3.5 h-3.5 text-emerald-500" />
            Consultas recentes (salvas localmente):
          </p>
          <div className="flex flex-wrap gap-2">
            {historico.map((item) => (
              <button
                key={`${item.municipioId}-${item.uf}`}
                type="button"
                onClick={() => onSelecionarHistorico(item)}
                disabled={loadingClima || loadingMunicipios || loadingGPS}
                style={{
                  backgroundColor: "var(--chip-bg)",
                  borderColor: "var(--chip-border)",
                  color: "var(--chip-text)",
                }}
                className="text-xs px-3 py-1.5 rounded-xl border transition-all hover:opacity-90 disabled:opacity-40 active:scale-95 cursor-pointer shadow-sm font-medium"
              >
                {item.municipioNome} ({item.uf})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Botão de Ação: Ver Clima */}
      <button
        type="submit"
        disabled={!cidadeSelecionadaId || loadingClima || loadingMunicipios || loadingGPS}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
      >
        {loadingClima ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Consultando IBGE, Open-Meteo e Wikipedia...</span>
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            <span>Ver Clima e Dados da Cidade</span>
          </>
        )}
      </button>
    </form>
  );
}
