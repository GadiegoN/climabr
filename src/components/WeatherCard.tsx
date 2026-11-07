import React, { useState, useRef } from "react";
import { DadosClimaCidade } from "@/types/weather";
import { mapearCodigoClima } from "@/utils/weatherCodes";
import { WeatherIcon } from "./WeatherIcon";
import { WeatherChart } from "./WeatherChart";
import EnvironmentalRadar from "./EnvironmentalRadar";
import CityInsightsTabs from "./CityInsightsTabs";
import {
  MapPin,
  Wind,
  Compass,
  Calendar,
  Navigation,
  Droplets,
  Thermometer,
  Sun,
  Sunset,
  Sunrise,
  ShieldAlert,
  CloudRain,
  Share2,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  Swords,
  Hourglass,
} from "lucide-react";

interface WeatherCardProps {
  data: DadosClimaCidade;
  onAbrirComparador?: () => void;
  onAbrirCapsula?: () => void;
}

export function WeatherCard({ data, onAbrirComparador, onAbrirCapsula }: WeatherCardProps) {
  const [copiado, setCopiado] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const condicao = mapearCodigoClima(data.clima.weathercode, data.clima.is_day);

  // Formatar horário da medição
  const dataFormatada = new Date(data.clima.time).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Função para copiar o link direto da cidade atual
  const handleCopiarLink = async () => {
    try {
      const url = `${window.location.origin}/?uf=${encodeURIComponent(data.uf)}&cidadeId=${encodeURIComponent(data.municipioId)}&cidade=${encodeURIComponent(data.municipio)}`;
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Scroll suave para a esquerda / direita no carrossel hora a hora
  const rolarCarrossel = (direcao: "esq" | "dir") => {
    if (scrollContainerRef.current) {
      const distancia = direcao === "esq" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: distancia, behavior: "smooth" });
    }
  };

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderColor: "var(--card-border)",
    boxShadow: "var(--card-shadow)",
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* ⚠️ Banner de Alerta Crítico (se houver aviso severo ativo na região) */}
      {data.alertasINMET && data.alertasINMET.some((a) => a.severidade?.toLowerCase().includes("perigo") || a.nivel >= 2) && (
        <div className="space-y-2">
          {data.alertasINMET
            .filter((a) => a.severidade?.toLowerCase().includes("perigo") || a.nivel >= 2)
            .slice(0, 1)
            .map((alerta, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl badge-amber flex items-start gap-3 backdrop-blur-md shadow-lg"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-bold flex items-center gap-2">
                    <span>Aviso Meteorológico INMET: {alerta.evento} ({alerta.severidade})</span>
                  </div>
                  {alerta.riscos && alerta.riscos.length > 0 && (
                    <p className="opacity-90 text-xs mt-1">{alerta.riscos[0]}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 🌤️ Card Principal de Clima Atual */}
      <div
        className={`w-full rounded-3xl p-6 md:p-8 text-white shadow-2xl transition-all duration-500 bg-gradient-to-br ${condicao.gradienteFundo} relative overflow-hidden border border-white/20`}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Topo do Card: Localização e Condição em linha limpa */}
        <div className="relative z-10 border-b border-white/20 pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-white drop-shadow-sm flex-shrink-0" />
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow whitespace-nowrap">
                  {data.municipio} - {data.uf}
                </h2>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1 flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 opacity-80" />
                Atualizado em: {dataFormatada}
              </p>
            </div>

            {/* Badge da Condição Climática */}
            <span
              className={`self-start sm:self-auto px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide shadow-sm backdrop-blur-md whitespace-nowrap ${condicao.badgeCor}`}
            >
              {condicao.descricao}
            </span>
          </div>

          {/* Barra de Ferramentas / Ações Rápidas (Organizada e sem quebrar texto) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Botão de Comparação de Cidades */}
            {onAbrirComparador && (
              <button
                type="button"
                onClick={onAbrirComparador}
                title="Comparar com outra cidade brasileira"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/25 text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Swords className="w-3.5 h-3.5 text-amber-300" />
                <span>Comparar</span>
              </button>
            )}

            {/* Botão de Cápsula do Tempo */}
            {onAbrirCapsula && (
              <button
                type="button"
                onClick={onAbrirCapsula}
                title="Ver o clima histórico desta cidade em anos anteriores"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/25 text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Hourglass className="w-3.5 h-3.5 text-purple-300" />
                <span>Cápsula do Tempo</span>
              </button>
            )}

            {/* Botão de Compartilhar Link Direto */}
            <button
              type="button"
              onClick={handleCopiarLink}
              title="Copiar link direto para esta cidade"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/25 text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
            >
              {copiado ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-200">Link copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bloco Central: Temperatura, Sensação e Ícone */}
        <div className="relative z-10 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-baseline">
              <span className="text-6xl md:text-7xl font-black tracking-tighter drop-shadow-lg">
                {Math.round(data.clima.temperature)}
              </span>
              <span className="text-3xl md:text-4xl font-light text-white/90 ml-1">
                {data.unidades.temperature || "°C"}
              </span>
            </div>

            {data.clima.apparent_temperature !== undefined && (
              <div className="text-sm font-medium text-white/90 flex items-center gap-1 mt-1">
                <Thermometer className="w-4 h-4 opacity-80" />
                Sensação térmica: {Math.round(data.clima.apparent_temperature)}°C
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 bg-black/15 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start sm:self-auto">
            <WeatherIcon
              tipo={condicao.icone}
              className="w-14 h-14 md:w-16 md:h-16 text-white drop-shadow-md"
            />
            <div className="text-right sm:text-left">
              <span className="text-xs uppercase tracking-wider text-white/75 font-semibold block">
                Condição
              </span>
              <span className="text-base font-bold drop-shadow">
                {condicao.descricao}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de Detalhes: Vento, Umidade, Sol e Coordenadas do IBGE */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Vento */}
          <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase">
              <Wind className="w-4 h-4" /> Vento
            </div>
            <p className="text-base font-bold text-white mt-1">
              {data.clima.windspeed} {data.unidades.windspeed || "km/h"}
            </p>
            <span className="text-[11px] text-white/70 flex items-center gap-1">
              <Compass className="w-3 h-3" /> {data.clima.winddirection}°
            </span>
          </div>

          {/* Umidade */}
          <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase">
              <Droplets className="w-4 h-4" /> Umidade
            </div>
            <p className="text-base font-bold text-white mt-1">
              {data.clima.relative_humidity !== undefined ? `${data.clima.relative_humidity}%` : "N/D"}
            </p>
            <span className="text-[11px] text-white/70">
              {data.clima.precipitation && data.clima.precipitation > 0
                ? `${data.clima.precipitation} mm`
                : "Sem chuva"}
            </span>
          </div>

          {/* Sol (Nascer & Pôr) */}
          <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase">
              <Sun className="w-4 h-4" /> Sol
            </div>
            <div className="text-xs font-medium text-white mt-1 space-y-0.5">
              <div className="flex items-center gap-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-300" /> {data.clima.nascerDoSol || "--:--"}
              </div>
              <div className="flex items-center gap-1">
                <Sunset className="w-3.5 h-3.5 text-orange-300" /> {data.clima.porDoSol || "--:--"}
              </div>
            </div>
          </div>

          {/* Coordenadas IBGE */}
          <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase">
              <Navigation className="w-4 h-4" /> IBGE
            </div>
            <p className="text-xs font-mono font-medium text-white mt-1 leading-tight">
              {data.coordenadas.latitude.toFixed(3)}° <br />
              {data.coordenadas.longitude.toFixed(3)}°
            </p>
          </div>
        </div>
      </div>

      {/* ⏰ Previsão Hora a Hora (Próximas 24 horas) com Scroll Aprimorado */}
      {data.previsaoHoraria && data.previsaoHoraria.length > 0 && (
        <div
          style={cardStyle}
          className="rounded-3xl p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 style={{ color: "var(--text-main)" }} className="text-base font-bold">
                  Previsão Hora a Hora
                </h3>
                <p style={{ color: "var(--text-muted)" }} className="text-xs">
                  Próximas 24 horas
                </p>
              </div>
            </div>

            {/* Controles de Navegação Lateral */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => rolarCarrossel("esq")}
                title="Rolar para a esquerda"
                style={{
                  backgroundColor: "var(--chip-bg)",
                  borderColor: "var(--chip-border)",
                  color: "var(--chip-text)",
                }}
                className="p-2 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => rolarCarrossel("dir")}
                title="Rolar para a direita"
                style={{
                  backgroundColor: "var(--chip-bg)",
                  borderColor: "var(--chip-border)",
                  color: "var(--chip-text)",
                }}
                className="p-2 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-sm hover:opacity-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Carrossel Horizontal Estilizado */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-3 pt-1 custom-scrollbar scroll-smooth"
          >
            {data.previsaoHoraria.map((horaItem, idx) => {
              const condHora = mapearCodigoClima(horaItem.codigoClima, 1);
              const isAgora = idx === 0;

              return (
                <div
                  key={idx}
                  style={
                    isAgora
                      ? {
                          borderColor: "var(--accent-color)",
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                        }
                      : {
                          backgroundColor: "var(--chip-bg)",
                          borderColor: "var(--chip-border)",
                        }
                  }
                  className={`flex-shrink-0 w-24 p-3.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all duration-200 select-none border ${
                    isAgora ? "border-2 shadow-lg" : "hover:-translate-y-1 hover:shadow-md"
                  }`}
                >
                  {/* Cabeçalho do Card da Hora */}
                  <div className="flex items-center gap-1">
                    {isAgora && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    )}
                    <span
                      style={{ color: isAgora ? "var(--accent-color)" : "var(--text-main)" }}
                      className="text-xs font-bold tracking-tight"
                    >
                      {isAgora ? "Agora" : horaItem.hora}
                    </span>
                  </div>

                  {/* Ícone */}
                  <div
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.15)" }}
                    className="my-2.5 p-2 rounded-xl"
                  >
                    <WeatherIcon
                      tipo={condHora.icone}
                      className={`w-7 h-7 ${isAgora ? "text-emerald-500" : ""}`}
                      style={{ color: isAgora ? "var(--accent-color)" : "var(--text-main)" }}
                    />
                  </div>

                  {/* Temperatura */}
                  <span style={{ color: "var(--text-main)" }} className="text-base font-black">
                    {Math.round(horaItem.temperatura)}°
                  </span>

                  {/* Probabilidade de Chuva */}
                  <div className="mt-1.5 h-5 flex items-center justify-center">
                    {horaItem.probabilidadeChuva !== undefined && horaItem.probabilidadeChuva > 0 ? (
                      <span className="text-[11px] font-semibold badge-sky px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CloudRain className="w-2.5 h-2.5" />
                        {horaItem.probabilidadeChuva}%
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }} className="text-[10px] font-medium">
                        0%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📊 Gráfico Interativo de Curva Térmica e Chuva (24h) */}
      {data.previsaoHoraria && data.previsaoHoraria.length > 0 && (
        <WeatherChart dados={data.previsaoHoraria} />
      )}

      {/* 🛡️ Radar Ambiental & Defesa Civil (Consolidação de INMET, CEMADEN, Risco de Fogo e Ar/UV) */}
      <EnvironmentalRadar
        municipio={data.municipio}
        uf={data.uf}
        alertasINMET={data.alertasINMET}
        alertasCEMADEN={data.alertasCEMADEN}
        riscoFogo={data.riscoFogo}
        qualidadeAr={data.qualidadeAr}
      />

      {/* 📅 Previsão para os Próximos 7 Dias (Open-Meteo) */}
      {data.previsaoDiaria && data.previsaoDiaria.length > 0 && (
        <div
          style={cardStyle}
          className="rounded-3xl p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 style={{ color: "var(--text-main)" }} className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Previsão para a Semana
            </h3>
            <span style={{ color: "var(--text-muted)" }} className="text-xs font-medium">
              Open-Meteo Forecast
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {data.previsaoDiaria.slice(0, 7).map((dia, index) => {
              const cond = mapearCodigoClima(dia.codigoClima, 1);
              const dataObj = new Date(`${dia.data}T12:00:00`);
              const nomeDia =
                index === 0
                  ? "Hoje"
                  : dataObj.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
              const dataMes = dataObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

              return (
                <div
                  key={dia.data}
                  style={
                    index === 0
                      ? {
                          backgroundColor: "rgba(16, 185, 129, 0.12)",
                          borderColor: "var(--accent-color)",
                        }
                      : {
                          backgroundColor: "var(--chip-bg)",
                          borderColor: "var(--chip-border)",
                        }
                  }
                  className="p-3 rounded-2xl border flex flex-col items-center justify-between text-center transition-all hover:opacity-90"
                >
                  <div style={{ color: "var(--text-main)" }} className="text-xs font-semibold capitalize">
                    {nomeDia}
                  </div>
                  <div style={{ color: "var(--text-muted)" }} className="text-[11px] mb-2">
                    {dataMes}
                  </div>

                  <WeatherIcon tipo={cond.icone} className="w-7 h-7 text-emerald-500 my-1" />

                  <div style={{ color: "var(--text-main)" }} className="mt-2 text-xs font-bold">
                    {Math.round(dia.tempMax)}°{" "}
                    <span style={{ color: "var(--text-muted)" }} className="font-normal">
                      {Math.round(dia.tempMin)}°
                    </span>
                  </div>

                  {dia.probabilidadeChuva !== undefined && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-[11px] badge-sky px-2 py-0.5 rounded-full font-medium">
                      <CloudRain className="w-3 h-3" />
                      {dia.probabilidadeChuva}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🏛️ Sobre a Cidade (Abas Unificadas: Mapa Interativo, História Wikipedia e Notícias IBGE) */}
      <CityInsightsTabs
        coordenadas={data.coordenadas}
        municipio={data.municipio}
        uf={data.uf}
        wikipedia={data.wikipedia}
        noticiasIBGE={data.noticiasIBGE}
      />
    </div>
  );
}
