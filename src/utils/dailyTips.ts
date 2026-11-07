/**
 * Utilitário: Gerador de Recomendações e "O que Vestir Hoje"
 * Analisa a dinâmica meteorológica (amplitude térmica, probabilidade de chuva,
 * índice UV e umidade) para gerar orientações práticas para o usuário.
 */

export interface DicaDoDia {
  id: string;
  categoria: "vestimenta" | "chuva" | "sol" | "saude";
  titulo: string;
  mensagem: string;
  icone: "shirt" | "umbrella" | "sun" | "droplets";
  badgeCor: string;
}

export function gerarDicasPraticas({
  tempAtual,
  tempMin,
  tempMax,
  probabilidadeChuva = 0,
  umidade = 50,
  uv = 0,
}: {
  tempAtual: number;
  tempMin: number;
  tempMax: number;
  probabilidadeChuva?: number;
  umidade?: number;
  uv?: number;
}): DicaDoDia[] {
  const dicas: DicaDoDia[] = [];
  const tMax = Math.round(tempMax);
  const tMin = Math.round(tempMin);

  // 1. DICA DE VESTIMENTA (Baseada em mín, máx e amplitude térmica)
  if (tMin <= 16 && tMax >= 26) {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Vista-se em Camadas",
      mensagem: `Grande variação térmica hoje (mín. ${tMin}°C e máx. ${tMax}°C). Use estilo "cebola": jaqueta leve ou agasalho para as primeiras horas, com roupas frescas por baixo para a tarde.`,
      icone: "shirt",
      badgeCor: "badge-amber",
    });
  } else if (tMax >= 30) {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Roupas Leves e Frescas",
      mensagem: `Dia de calor intenso com máxima prevista de ${tMax}°C. Dê preferência a tecidos de algodão ou linho em tons claros para maior conforto térmico.`,
      icone: "shirt",
      badgeCor: "badge-orange",
    });
  } else if (tMax <= 18) {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Dia Frio: Agasalhe-se Bem",
      mensagem: `Temperaturas baixas o dia todo com máxima de apenas ${tMax}°C. Casacos mais encorpados, suéteres e calças quentes são essenciais.`,
      icone: "shirt",
      badgeCor: "badge-sky",
    });
  } else {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Roupas Confortáveis e Casuais",
      mensagem: `Temperatura agradável em torno de ${Math.round(tempAtual)}°C (máx. ${tMax}°C). Camisetas, jeans ou bermudas caem perfeitamente.`,
      icone: "shirt",
      badgeCor: "badge-emerald",
    });
  }

  // 2. DICA DE CHUVA & ACESSÓRIOS
  if (probabilidadeChuva >= 60) {
    dicas.push({
      id: "chuva",
      categoria: "chuva",
      titulo: "Chuva Quase Certa",
      mensagem: `Probabilidade elevada de chuva (${probabilidadeChuva}%). Leve guarda-chuva reforçado ou capa e prefira calçados impermeáveis.`,
      icone: "umbrella",
      badgeCor: "badge-sky",
    });
  } else if (probabilidadeChuva >= 30) {
    dicas.push({
      id: "chuva",
      categoria: "chuva",
      titulo: "Instabilidade à Vista",
      mensagem: `Chance moderada de chuva (${probabilidadeChuva}%). Carregar um guarda-chuva compacto na bolsa ou mochila é prudente.`,
      icone: "umbrella",
      badgeCor: "badge-sky",
    });
  }

  // 3. DICA DE PROTEÇÃO SOLAR (Índice UV)
  if (uv >= 8) {
    dicas.push({
      id: "sol",
      categoria: "sol",
      titulo: "Radiação UV Muito Alta",
      mensagem: `Índice UV em nível perigoso (${uv.toFixed(1)}). Use protetor solar FPS 50+, óculos com proteção UV e evite exposição direta ao sol entre 10h e 16h.`,
      icone: "sun",
      badgeCor: "badge-rose",
    });
  } else if (uv >= 5) {
    dicas.push({
      id: "sol",
      categoria: "sol",
      titulo: "Proteção Solar Recomendada",
      mensagem: `Índice UV moderado a alto (${uv.toFixed(1)}). Aplique filtro solar se for realizar caminhadas ou atividades externas.`,
      icone: "sun",
      badgeCor: "badge-amber",
    });
  }

  // 4. DICA DE HIDRATAÇÃO & SAÚDE RESPIRATÓRIA
  if (umidade <= 30) {
    dicas.push({
      id: "saude",
      categoria: "saude",
      titulo: "Tempo Seco: Hidrate-se",
      mensagem: `Umidade relativa em nível crítico (${umidade}%). Beba água com frequência, use soro fisiológico nas narinas e evite exercícios físicos pesados ao ar livre nas horas mais quentes.`,
      icone: "droplets",
      badgeCor: "badge-rose",
    });
  }

  return dicas;
}

