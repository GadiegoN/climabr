/**
 * Utilitário Astronômico: Cálculo preciso das fases da Lua
 * Baseado no ciclo sinódico lunar (29.53058867 dias).
 */

export interface DadosFaseLua {
  nome: string;
  icone: string;
  percentualIluminacao: number;
  descricao: string;
}

export function getFaseDaLua(data: Date = new Date()): DadosFaseLua {
  const LUNAR_MONTH = 29.53058867;
  // Época de referência de Lua Nova: 11 de janeiro de 2024, 11:57 UTC
  const epochNewMoon = new Date("2024-01-11T11:57:00Z").getTime();
  const diffMs = data.getTime() - epochNewMoon;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const ciclo = ((diffDays % LUNAR_MONTH) + LUNAR_MONTH) % LUNAR_MONTH;
  const percentualIluminacao = Math.round(
    ((1 - Math.cos((ciclo / LUNAR_MONTH) * 2 * Math.PI)) / 2) * 100
  );

  if (ciclo < 1.84 || ciclo >= 27.69) {
    return {
      nome: "Lua Nova",
      icone: "🌑",
      percentualIluminacao,
      descricao: "Céu escuro ideal para observação de estrelas e nebulosas.",
    };
  }
  if (ciclo < 7.38) {
    return {
      nome: "Crescente Côncava",
      icone: "🌒",
      percentualIluminacao,
      descricao: "Um fino crescente visível logo após o pôr do sol no horizonte oeste.",
    };
  }
  if (ciclo < 9.23) {
    return {
      nome: "Quarto Crescente",
      icone: "🌓",
      percentualIluminacao,
      descricao: "Metade do disco lunar iluminado no início da noite.",
    };
  }
  if (ciclo < 14.76) {
    return {
      nome: "Crescente Gibosa",
      icone: "🌔",
      percentualIluminacao,
      descricao: "Mais da metade do disco iluminado, visível durante quase toda a noite.",
    };
  }
  if (ciclo < 16.61) {
    return {
      nome: "Lua Cheia",
      icone: "🌕",
      percentualIluminacao,
      descricao: "Disco 100% visível, iluminando a noite do nascer ao pôr do sol.",
    };
  }
  if (ciclo < 22.15) {
    return {
      nome: "Minguante Gibosa",
      icone: "🌖",
      percentualIluminacao,
      descricao: "Início do recuo da iluminação, nascendo após o anoitecer.",
    };
  }
  if (ciclo < 23.99) {
    return {
      nome: "Quarto Minguante",
      icone: "🌗",
      percentualIluminacao,
      descricao: "Metade do disco iluminado, nascendo por volta da meia-noite.",
    };
  }
  return {
    nome: "Minguante Côncava",
    icone: "🌘",
    percentualIluminacao,
    descricao: "Fino filete visível de madrugada pouco antes do nascer do sol.",
  };
}

