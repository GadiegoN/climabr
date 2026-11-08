import React, { useState, useRef, useEffect } from "react";
import { DadosClimaCidade, CidadeHistorico, Coordenadas } from "@/types/weather";
import { mapearCodigoClima } from "@/utils/weatherCodes";
import { WeatherIcon } from "./WeatherIcon";
import { WeatherChart } from "./WeatherChart";
import EnvironmentalRadar from "./EnvironmentalRadar";
import CityInsightsTabs from "./CityInsightsTabs";
import { ShareModal } from "./ShareModal";
import { AgroModal } from "./AgroModal";
import { getFaseDaLua } from "@/utils/astronomy";
import { gerarIndicesRotina, CategoriaRotina } from "@/utils/dailyTips";
import { ConfiguracoesVisualizacao } from "@/types/settings";
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
  Star,
  Sparkles,
  Moon,
  Camera,
  Sprout,
} from "lucide-react";

/**
 * Identifica o fuso horário oficial IANA para qualquer localidade brasileira.
 * Usa o fuso oficial retornado pela Open-Meteo com fallback geográfico por UF/Município.
 */
function resolverFusoHorario(uf: string, municipio: string, timezoneApi?: string): string {
  if (timezoneApi && timezoneApi.includes("/")) return timezoneApi;

  const ufNorm = (uf || "").toUpperCase().trim();
  const munNorm = (municipio || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Fernando de Noronha (PE) -> UTC-2
  if (ufNorm === "PE" && munNorm.includes("noronha")) return "America/Noronha";

  // Acre -> UTC-5
  if (ufNorm === "AC") return "America/Rio_Branco";

  // Amazonas: extremo oeste (UTC-5) vs demais cidades (UTC-4)
  if (ufNorm === "AM") {
    const municipiosAcre = [
      "atalaia do norte",
      "benjamin constant",
      "boca do acre",
      "eirunepe",
      "envira",
      "guajara",
      "ipixuna",
      "itamarati",
      "jurua",
      "labrea",
      "pauini",
      "sao paulo de olivenca",
      "tabatinga",
    ];
    if (municipiosAcre.some((m) => munNorm.includes(m))) {
      return "America/Rio_Branco";
    }
    return "America/Manaus";
  }

  // Estados no fuso UTC-4
  if (["RO", "RR", "MT", "MS"].includes(ufNorm)) {
    if (ufNorm === "MT") return "America/Cuiaba";
    if (ufNorm === "MS") return "America/Campo_Grande";
    if (ufNorm === "RR") return "America/Boa_Vista";
    return "America/Porto_Velho";
  }

  // Padrão nacional (Horário de Brasília - UTC-3)
  return "America/Sao_Paulo";
}

function formatarHoraAoVivo(data: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(data);
  } catch {
    return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
}

function extrairInfoFuso(timeZone: string, utcOffsetSeconds?: number): { utcLabel: string; relacaoBrasilia: string } {
  let offsetHoras: number;
  if (typeof utcOffsetSeconds === "number") {
    offsetHoras = Math.round(utcOffsetSeconds / 3600);
  } else if (timeZone.includes("Noronha")) {
    offsetHoras = -2;
  } else if (timeZone.includes("Rio_Branco")) {
    offsetHoras = -5;
  } else if (
    timeZone.includes("Manaus") ||
    timeZone.includes("Porto_Velho") ||
    timeZone.includes("Cuiaba") ||
    timeZone.includes("Boa_Vista") ||
    timeZone.includes("Campo_Grande")
  ) {
    offsetHoras = -4;
  } else {
    offsetHoras = -3;
  }

  const difBrasilia = offsetHoras - -3;
  let relacao = "Horário de Brasília";
  if (difBrasilia < 0) {
    relacao = `${Math.abs(difBrasilia)}h a menos que Brasília`;
  } else if (difBrasilia > 0) {
    relacao = `${difBrasilia}h a mais que Brasília`;
  }

  const sinal = offsetHoras >= 0 ? `+${offsetHoras}` : `${offsetHoras}`;
  return {
    utcLabel: `UTC${sinal}`,
    relacaoBrasilia: relacao,
  };
}

interface WeatherCardProps {
  data: DadosClimaCidade;
  isFavorito?: boolean;
  favoritos?: CidadeHistorico[];
  onToggleFavorito?: () => void;
  onSelecionarCidade?: (id: string, nome: string, uf: string, coordenadas?: Coordenadas) => void;
  onAbrirComparador?: () => void;
  onAbrirCapsula?: () => void;
  configVisualizacao?: ConfiguracoesVisualizacao;
}

export function WeatherCard({
  data,
  isFavorito = false,
  favoritos = [],
  onToggleFavorito,
  onSelecionarCidade,
  onAbrirComparador,
  onAbrirCapsula,
  configVisualizacao,
}: WeatherCardProps) {
  const [isShareModalAberto, setIsShareModalAberto] = useState(false);
  const [isAgroModalAberto, setIsAgroModalAberto] = useState(false);
  const [categoriaRotinaAtiva, setCategoriaRotinaAtiva] = useState<CategoriaRotina>("vestimenta");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const condicao = mapearCodigoClima(data.clima.weathercode, data.clima.is_day);

  // Relógio ao vivo no fuso horário local do município
  const [agora, setAgora] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fusoIana = resolverFusoHorario(data.uf, data.municipio, data.clima.timezone);
  const horaLocalAoVivo = formatarHoraAoVivo(agora, fusoIana);
  const infoFuso = extrairInfoFuso(fusoIana, data.clima.utcOffsetSeconds);

  // Dados astronômicos da Lua
  const faseLua = getFaseDaLua();

  // Índices de Rotina Diária (O que Vestir, Varal, Esportes, Lavar Carro)
  const hojePrevisao = data.previsaoDiaria?.[0];

  const indicesRotina = gerarIndicesRotina({
    tempAtual: data.clima.temperature,
    tempMin: hojePrevisao ? hojePrevisao.tempMin : data.clima.temperature,
    tempMax: hojePrevisao ? hojePrevisao.tempMax : data.clima.temperature,
    probabilidadeChuva: hojePrevisao?.probabilidadeChuva,
    umidade: data.clima.relative_humidity,
    uv: data.qualidadeAr?.uvIndex,
    velocidadeVento: data.clima.windspeed,
    previsaoDiaria: data.previsaoDiaria,
    previsaoHoraria: data.previsaoHoraria,
  });

  const indiceAtivo = indicesRotina.find((i) => i.categoria === categoriaRotinaAtiva) || indicesRotina[0];



  // Formatar horário da medição
  const dataFormatada = new Date(data.clima.time).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

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
      {(configVisualizacao?.mostrarAlertasDefesaCivil ?? true) &&
        data.alertasINMET &&
        data.alertasINMET.some((a) => a.severidade?.toLowerCase().includes("perigo") || a.nivel >= 2) && (
        <div className="space-y-2 w-full">
          {data.alertasINMET
            .filter((a) => a.severidade?.toLowerCase().includes("perigo") || a.nivel >= 2)
            .slice(0, 1)
            .map((alerta, idx) => (
              <div
                key={idx}
                className="w-full p-4 rounded-2xl badge-amber flex items-start gap-3 backdrop-blur-md shadow-lg overflow-hidden"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
                <div className="text-sm min-w-0 flex-1 space-y-1">
                  <div className="font-bold flex items-center gap-2 flex-wrap text-sm leading-snug">
                    <span>Aviso Meteorológico INMET: {alerta.evento} ({alerta.severidade})</span>
                  </div>
                  {alerta.riscos && alerta.riscos.length > 0 && (
                    <p className="opacity-90 text-xs leading-relaxed break-words whitespace-normal">{alerta.riscos[0]}</p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* 🌤️ Card Principal de Clima Atual */}
      <div
        className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-2xl transition-all duration-500 bg-gradient-to-br ${condicao.gradienteFundo} relative overflow-hidden border border-white/20`}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Topo do Card: Localização e Condição em linha limpa */}
        <div className="relative z-10 border-b border-white/20 pb-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow break-words min-w-0">
                  {data.municipio} - {data.uf}
                </h2>
                {onToggleFavorito && (
                  <button
                    type="button"
                    onClick={onToggleFavorito}
                    title={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-all cursor-pointer active:scale-90"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        isFavorito
                          ? "text-amber-300 fill-amber-300 drop-shadow"
                          : "text-white/60 hover:text-white"
                      }`}
                    />
                  </button>
                )}
              </div>
              {/* Metadados: Relógio Local ao Vivo + Horário da Medição Meteorológica */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mt-2">
                {/* Relógio em Tempo Real no Fuso Horário do Município */}
                <div
                  title={`Horário local oficial em ${data.municipio} (${infoFuso.utcLabel})`}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-black/30 hover:bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all select-none"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-300 animate-pulse shrink-0" />
                  <span className="font-mono tracking-tight text-emerald-200 font-bold">
                    {horaLocalAoVivo}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-white/80 font-medium border-l border-white/25 pl-1.5 whitespace-nowrap">
                    {infoFuso.utcLabel} • {infoFuso.relacaoBrasilia}
                  </span>
                </div>

                {/* Momento da medição da estação */}
                <p className="text-white/75 text-[11px] sm:text-xs flex items-center gap-1 font-medium whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span>Medição: {dataFormatada}</span>
                </p>
              </div>
            </div>

            {/* Badge da Condição Climática */}
            <span
              className={`self-start sm:self-auto px-3.5 sm:px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-wide shadow-sm backdrop-blur-md ${condicao.badgeCor}`}
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

            {/* Botão de Painel Agroclimatológico & Solo */}
            {(configVisualizacao?.mostrarAgro ?? true) && (
              <button
                type="button"
                onClick={() => setIsAgroModalAberto(true)}
                title="Abrir painel agroclimatológico: umidade do solo, irrigação e pulverização"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/25 text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Sprout className="w-3.5 h-3.5 text-emerald-300" />
                <span>Agro & Solo</span>
              </button>
            )}

            {/* Botão de Compartilhar Link & Baixar PNG */}
            <button
              type="button"
              onClick={() => setIsShareModalAberto(true)}
              title="Baixar imagem PNG ou compartilhar previsão no WhatsApp"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/20 hover:bg-black/30 backdrop-blur-md border border-white/25 text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 text-sky-300" />
              <span>Baixar / Compartilhar</span>
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

          {/* Sol & Lua (Astronomia) */}
          <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white/70 text-xs font-semibold uppercase">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-300" /> Sol & Lua
              </span>
              <span className="text-xs" title={faseLua.descricao}>
                {faseLua.icone}
              </span>
            </div>
            <div className="text-[11px] font-medium text-white mt-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 opacity-85">
                  <Sunrise className="w-3 h-3 text-amber-300" /> {data.clima.nascerDoSol || "--:--"}
                </span>
                <span className="flex items-center gap-1 opacity-85">
                  <Sunset className="w-3 h-3 text-orange-300" /> {data.clima.porDoSol || "--:--"}
                </span>
              </div>
              <div className="text-[10px] text-white/90 pt-1 border-t border-white/10 font-bold truncate">
                {faseLua.nome} ({faseLua.percentualIluminacao}%)
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

        {/* ✨ Índices de Rotina Diária & Conforto (Zero Poluição - Abas Compactas) */}
        {(configVisualizacao?.mostrarDicasRotina ?? true) && indicesRotina.length > 0 && (
          <div className="relative z-10 pt-4 mt-4 border-t border-white/20 space-y-3">
            {/* Header com Abas Compactas de Rotina */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Rotina & Conforto:</span>
              </div>

              {/* Botões seletores tipo pílula com rolagem suave no mobile */}
              <div className="flex items-center p-1 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 gap-1 overflow-x-auto max-w-full custom-scrollbar flex-nowrap w-full sm:w-auto shrink-0">
                {indicesRotina.map((item) => {
                  const isAtiva = item.categoria === categoriaRotinaAtiva;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCategoriaRotinaAtiva(item.categoria)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                        isAtiva
                          ? "bg-white text-slate-900 shadow-md font-bold scale-[1.02]"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs">{item.emoji}</span>
                      <span>{item.rotuloAba}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Detalhado do Índice Selecionado */}
            {indiceAtivo && (
              <div className="p-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/15 text-white flex items-start gap-3 transition-all duration-200">
                <div className="text-2xl select-none p-2 rounded-xl bg-white/10 shrink-0">
                  {indiceAtivo.emoji}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white text-xs sm:text-sm">{indiceAtivo.titulo}</h4>
                    <span className={`${indiceAtivo.statusCor} text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block`}>
                      {indiceAtivo.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/85 leading-relaxed">
                    {indiceAtivo.mensagem}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ⏰ Previsão Hora a Hora (Próximas 24 horas) com Scroll Aprimorado */}
      {(configVisualizacao?.mostrarHoraAHora ?? true) && data.previsaoHoraria && data.previsaoHoraria.length > 0 && (
        <div
          style={cardStyle}
          className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-4"
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
      {(configVisualizacao?.mostrarGrafico24h ?? true) && data.previsaoHoraria && data.previsaoHoraria.length > 0 && (
        <WeatherChart dados={data.previsaoHoraria} />
      )}

      {/* 🛡️ Radar Ambiental & Defesa Civil (Consolidação de INMET, CEMADEN, Risco de Fogo e Ar/UV) */}
      {(configVisualizacao?.mostrarQualidadeArUV ?? true) && (
        <EnvironmentalRadar
          municipio={data.municipio}
          uf={data.uf}
          alertasINMET={data.alertasINMET}
          alertasCEMADEN={data.alertasCEMADEN}
          riscoFogo={data.riscoFogo}
          qualidadeAr={data.qualidadeAr}
          elNino={data.elNino}
        />
      )}

      {/* 📅 Previsão para os Próximos 7 Dias (Open-Meteo) */}
      {(configVisualizacao?.mostrarHoraAHora ?? true) && data.previsaoDiaria && data.previsaoDiaria.length > 0 && (
        <div
          style={cardStyle}
          className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 border backdrop-blur-xl transition-all duration-300 space-y-4"
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

      {/* 🏛️ Sobre a Cidade (Abas Unificadas: Mapa Interativo, História Wikipedia, Notícias IBGE, Anúncios e Litoral) */}
      {(configVisualizacao?.mostrarInsightsTabs ?? true) && (
        <CityInsightsTabs
          coordenadas={data.coordenadas}
          municipio={data.municipio}
          uf={data.uf}
          temperatura={data.clima.temperature}
          weatherCode={data.clima.weathercode}
          wikipedia={data.wikipedia}
          noticiasIBGE={data.noticiasIBGE}
          favoritos={favoritos}
          condicoesMarinhas={data.condicoesMarinhas}
          onSelecionarCidade={onSelecionarCidade}
          mostrarRadar={configVisualizacao?.mostrarRadarChuva ?? true}
          mostrarAnuncios={configVisualizacao?.mostrarAnunciosMock ?? true}
          mostrarLitoral={configVisualizacao?.mostrarLitoral ?? true}
        />
      )}

      {/* 📸 Modal de Compartilhamento Social & WhatsApp */}
      <ShareModal
        cidade={data}
        isOpen={isShareModalAberto}
        onClose={() => setIsShareModalAberto(false)}
      />

      {/* 🌾 Modal Agroclimatológico & Solo */}
      <AgroModal
        cidade={data}
        isOpen={isAgroModalAberto}
        onClose={() => setIsAgroModalAberto(false)}
      />


    </div>
  );
}
