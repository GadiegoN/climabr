import { CondicaoVisualClima } from "@/types/weather";

/**
 * Mapeia os códigos meteorológicos WMO (World Meteorological Organization)
 * para descrições em português, ícones e esquemas de cores do Tailwind CSS.
 */
export function mapearCodigoClima(code: number, isDay: number = 1): CondicaoVisualClima {
  const dia = isDay === 1;

  switch (code) {
    case 0: // Céu limpo
      return {
        descricao: dia ? "Céu limpo e ensolarado" : "Céu estrelado e limpo",
        icone: dia ? "sun" : "moon",
        gradienteFundo: dia
          ? "from-amber-400 via-orange-400 to-amber-600"
          : "from-indigo-900 via-slate-900 to-blue-950",
        badgeCor: dia ? "bg-amber-100 text-amber-800" : "bg-indigo-950/80 text-indigo-200 border border-indigo-800",
        corTexto: "text-amber-500",
      };

    case 1: // Principalmente limpo
    case 2: // Parcialmente nublado
      return {
        descricao: "Parcialmente nublado",
        icone: dia ? "cloud-sun" : "cloud",
        gradienteFundo: dia
          ? "from-sky-400 via-blue-500 to-indigo-600"
          : "from-slate-800 via-blue-950 to-slate-900",
        badgeCor: "bg-sky-100 text-sky-800",
        corTexto: "text-sky-500",
      };

    case 3: // Encoberto / Nublado
      return {
        descricao: "Nublado / Encoberto",
        icone: "cloud",
        gradienteFundo: "from-slate-500 via-gray-600 to-zinc-700",
        badgeCor: "bg-slate-100 text-slate-800",
        corTexto: "text-slate-500",
      };

    case 45: // Nevoeiro
    case 48: // Nevoeiro com depósito de gelo
      return {
        descricao: "Nevoeiro / Neblina",
        icone: "fog",
        gradienteFundo: "from-zinc-400 via-slate-500 to-stone-600",
        badgeCor: "bg-zinc-100 text-zinc-800",
        corTexto: "text-zinc-500",
      };

    case 51: // Chuvisco leve
    case 53: // Chuvisco moderado
    case 55: // Chuvisco denso
      return {
        descricao: "Chuvisco / Garôa",
        icone: "drizzle",
        gradienteFundo: "from-cyan-600 via-sky-700 to-blue-800",
        badgeCor: "bg-cyan-100 text-cyan-800",
        corTexto: "text-cyan-500",
      };

    case 61: // Chuva fraca
    case 63: // Chuva moderada
    case 65: // Chuva forte
    case 80: // Pancadas de chuva leves
    case 81: // Pancadas de chuva moderadas
    case 82: // Pancadas de chuva violentas
      return {
        descricao: "Chuvoso",
        icone: "rain",
        gradienteFundo: "from-blue-600 via-indigo-700 to-slate-900",
        badgeCor: "bg-blue-100 text-blue-800",
        corTexto: "text-blue-500",
      };

    case 71: // Neve leve
    case 73: // Neve moderada
    case 75: // Neve intensa
    case 85: // Pancadas de neve leves
    case 86: // Pancadas de neve fortes
      return {
        descricao: "Neve",
        icone: "snow",
        gradienteFundo: "from-blue-200 via-slate-300 to-indigo-400",
        badgeCor: "bg-indigo-100 text-indigo-800",
        corTexto: "text-indigo-400",
      };

    case 95: // Tempestade
    case 96: // Tempestade com granizo leve
    case 99: // Tempestade com granizo forte
      return {
        descricao: "Tempestade com trovoadas",
        icone: "thunderstorm",
        gradienteFundo: "from-purple-900 via-slate-900 to-gray-950",
        badgeCor: "bg-purple-100 text-purple-900",
        corTexto: "text-purple-400",
      };

    default:
      return {
        descricao: "Tempo estável",
        icone: dia ? "sun" : "moon",
        gradienteFundo: "from-blue-500 via-teal-600 to-cyan-700",
        badgeCor: "bg-teal-100 text-teal-800",
        corTexto: "text-teal-500",
      };
  }
}

