/**
 * Utilitário: Gerador de Recomendações e Índices de Rotina Diária
 * (O que Vestir, Varal & Secagem, Esportes ao Ar Livre, Lavar o Carro)
 * 
 * Analisa a dinâmica meteorológica (amplitude térmica, probabilidade de chuva,
 * índice UV, umidade, vento e previsão dos próximos dias) sem poluir a interface.
 */

import { PrevisaoDiariaItem, PrevisaoHorariaItem } from "@/types/weather";

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
  const tMax = Math.round(tempMax);
  const tMin = Math.round(tempMin);
  const dicas: DicaDoDia[] = [];

  if (tMin <= 16 && tMax >= 26) {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Vista-se em Camadas",
      mensagem: `Grande variação térmica hoje (mín. ${tMin}°C e máx. ${tMax}°C). Use estilo "cebola": jaqueta leve com roupas frescas por baixo.`,
      icone: "shirt",
      badgeCor: "badge-amber",
    });
  } else if (tMax >= 30) {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Roupas Leves e Frescas",
      mensagem: `Calor intenso com máxima de ${tMax}°C. Dê preferência a tecidos de algodão ou linho em tons claros.`,
      icone: "shirt",
      badgeCor: "badge-orange",
    });
  } else if (tMax <= 18) {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Dia Frio: Agasalhe-se Bem",
      mensagem: `Temperaturas baixas o dia todo com máxima de ${tMax}°C. Casacos mais encorpados e calças quentes são essenciais.`,
      icone: "shirt",
      badgeCor: "badge-sky",
    });
  } else {
    dicas.push({
      id: "vestimenta",
      categoria: "vestimenta",
      titulo: "Roupas Confortáveis",
      mensagem: `Temperatura agradável em torno de ${Math.round(tempAtual)}°C (máx. ${tMax}°C). Camisetas e bermudas caem perfeitamente.`,
      icone: "shirt",
      badgeCor: "badge-emerald",
    });
  }

  if (probabilidadeChuva >= 60) {
    dicas.push({
      id: "chuva",
      categoria: "chuva",
      titulo: "Chuva Quase Certa",
      mensagem: `Probabilidade elevada de chuva (${probabilidadeChuva}%). Leve guarda-chuva reforçado ou capa.`,
      icone: "umbrella",
      badgeCor: "badge-sky",
    });
  }

  return dicas;
}

export type CategoriaRotina = "vestimenta" | "varal" | "esportes" | "carro";

export interface IndiceRotina {
  id: CategoriaRotina;
  categoria: CategoriaRotina;
  rotuloAba: string;
  emoji: string;
  status: "Excelente" | "Favorável" | "Atenção" | "Não recomendado" | "Recomendado" | "Moderado";
  statusCor: string; // Ex: 'badge-emerald' | 'badge-amber' | 'badge-rose' | 'badge-sky'
  titulo: string;
  mensagem: string;
}

export function gerarIndicesRotina({
  tempAtual,
  tempMin,
  tempMax,
  probabilidadeChuva = 0,
  umidade = 50,
  uv = 0,
  velocidadeVento = 10,
  previsaoDiaria = [],
  previsaoHoraria = [],
}: {
  tempAtual: number;
  tempMin: number;
  tempMax: number;
  probabilidadeChuva?: number;
  umidade?: number;
  uv?: number;
  velocidadeVento?: number;
  previsaoDiaria?: PrevisaoDiariaItem[];
  previsaoHoraria?: PrevisaoHorariaItem[];
}): IndiceRotina[] {
  const indices: IndiceRotina[] = [];
  const tMax = Math.round(tempMax);
  const tMin = Math.round(tempMin);

  // -------------------------------------------------------------
  // 1. ÍNDICE DE VESTIMENTA (O que vestir hoje)
  // -------------------------------------------------------------
  let vestStatus: IndiceRotina["status"] = "Favorável";
  let vestCor = "badge-emerald";
  let vestTitulo = "Roupas Confortáveis e Casuais";
  let vestMsg = `Temperatura agradável em torno de ${Math.round(tempAtual)}°C (máx. ${tMax}°C). Camisetas, jeans ou bermudas caem perfeitamente.`;

  if (tMin <= 16 && tMax >= 26) {
    vestStatus = "Atenção";
    vestCor = "badge-amber";
    vestTitulo = "Vista-se em Camadas (Estilo Cebola)";
    vestMsg = `Grande oscilação térmica (mín. ${tMin}°C e máx. ${tMax}°C). Use jaqueta leve ou agasalho pela manhã e roupas frescas por baixo para a tarde.`;
  } else if (tMax >= 30) {
    vestStatus = "Moderado";
    vestCor = "badge-orange";
    vestTitulo = "Roupas Leves e Tecidos Frescos";
    vestMsg = `Calor intenso com máxima de ${tMax}°C. Dê preferência a tecidos de algodão ou linho em tons claros e calçados ventilados.`;
  } else if (tMax <= 18) {
    vestStatus = "Moderado";
    vestCor = "badge-sky";
    vestTitulo = "Dia Frio: Agasalhe-se Bem";
    vestMsg = `Temperaturas baixas o dia todo com máxima de apenas ${tMax}°C. Casacos mais encorpados, suéteres e calças quentes são essenciais.`;
  }

  indices.push({
    id: "vestimenta",
    categoria: "vestimenta",
    rotuloAba: "O que Vestir",
    emoji: "👔",
    status: vestStatus,
    statusCor: vestCor,
    titulo: vestTitulo,
    mensagem: vestMsg,
  });

  // -------------------------------------------------------------
  // 2. ÍNDICE DE VARAL & SECAGEM DE ROUPAS
  // -------------------------------------------------------------
  let varalStatus: IndiceRotina["status"] = "Favorável";
  let varalCor = "badge-emerald";
  let varalTitulo = "Favorável para Secar Roupas";
  let varalMsg = "Condições boas para estender roupas no varal. Aproveite o período do meio do dia para secagem mais rápida.";

  if (probabilidadeChuva >= 50 || umidade >= 85) {
    varalStatus = "Não recomendado";
    varalCor = "badge-rose";
    varalTitulo = "Cuidado: Risco de Chuva ou Umidade Alta";
    varalMsg = `Probabilidade de chuva em ${probabilidadeChuva}% e umidade em ${umidade}%. Roupas no varal externo correm risco de molhar ou demorar muito para secar.`;
  } else if (probabilidadeChuva < 20 && umidade <= 60 && (velocidadeVento >= 8 || tMax >= 24)) {
    varalStatus = "Excelente";
    varalCor = "badge-emerald";
    varalTitulo = "Excelente: Secagem Rápida";
    varalMsg = `Ar seco (${umidade}%), calor (${tMax}°C) e ventilação favorecem a evaporação acelerada. Ótimo momento para lavar lençóis e peças pesadas.`;
  } else if (probabilidadeChuva >= 30) {
    varalStatus = "Atenção";
    varalCor = "badge-amber";
    varalTitulo = "Fique Atento ao Varal Externo";
    varalMsg = `Chance moderada de instabilidade (${probabilidadeChuva}%). É seguro estender, mas mantenha o varal sob vigilância caso o céu escureça.`;
  }

  indices.push({
    id: "varal",
    categoria: "varal",
    rotuloAba: "Varal de Roupas",
    emoji: "🧺",
    status: varalStatus,
    statusCor: varalCor,
    titulo: varalTitulo,
    mensagem: varalMsg,
  });

  // -------------------------------------------------------------
  // 3. ÍNDICE DE ESPORTES AO AR LIVRE & CORRIDA
  // -------------------------------------------------------------
  let espStatus: IndiceRotina["status"] = "Favorável";
  let espCor = "badge-emerald";
  let espTitulo = "Ótimo para Atividades ao Ar Livre";
  let espMsg = "Temperatura amena e condições climáticas propícias para corrida, caminhadas ou pedalada.";

  if (probabilidadeChuva >= 70) {
    espStatus = "Não recomendado";
    espCor = "badge-rose";
    espTitulo = "Prefira Atividades em Ambiente Coberto";
    espMsg = `Chuva iminente (${probabilidadeChuva}%). Pistas e pisos externos escorregadios aumentam o risco de acidentes. Dê preferência a esteira ou treino funcional.`;
  } else if (tMax >= 30 || uv >= 8) {
    espStatus = "Atenção";
    espCor = "badge-amber";
    espTitulo = "Evite os Horários de Pico Solar";
    espMsg = `Calor de ${tMax}°C e UV elevado (${uv.toFixed(1)}). Pratique corrida ou caminhada antes das 8h ou após as 17h30. Redobre a hidratação e use boné/filtro solar.`;
  } else if (tMax <= 14) {
    espStatus = "Moderado";
    espCor = "badge-sky";
    espTitulo = "Frio: Aqueça Articulações";
    espMsg = `Dia frio (${tMax}°C). Faça um aquecimento articular e muscular mais longo antes de acelerar o ritmo na corrida para evitar lesões.`;
  }

  indices.push({
    id: "esportes",
    categoria: "esportes",
    rotuloAba: "Esportes & Corrida",
    emoji: "🏃",
    status: espStatus,
    statusCor: espCor,
    titulo: espTitulo,
    mensagem: espMsg,
  });

  // -------------------------------------------------------------
  // 4. ÍNDICE DE LAVAR O CARRO (Análise de 48h)
  // -------------------------------------------------------------
  // Analisa os próximos 2 dias na previsão diária
  const proxDiasChuva = previsaoDiaria.slice(1, 3);
  const temChuvaNosProxDias = proxDiasChuva.some((d) => (d.probabilidadeChuva ?? 0) >= 40);
  const maxProbabilidadeProx = Math.max(...proxDiasChuva.map((d) => d.probabilidadeChuva ?? 0), 0);

  let carroStatus: IndiceRotina["status"] = "Favorável";
  let carroCor = "badge-emerald";
  let carroTitulo = "Tempo Firme: Vale a Pena Lavar";
  let carroMsg = "Sem previsão expressiva de chuva para as próximas 48 horas. A lataria permanecerá limpa e brilhante.";

  if (probabilidadeChuva >= 50 || temChuvaNosProxDias) {
    carroStatus = "Não recomendado";
    carroCor = "badge-rose";
    carroTitulo = "Adie a Lavagem: Chuva à Vista";
    carroMsg = `Previsão de chuva nas próximas 24h a 48h (até ${Math.max(probabilidadeChuva, maxProbabilidadeProx)}% de chance). Vale a pena adiar a lavagem para economizar água e dinheiro.`;
  } else if (probabilidadeChuva < 20 && maxProbabilidadeProx < 25) {
    carroStatus = "Excelente";
    carroCor = "badge-emerald";
    carroTitulo = "Excelente Momento para Lavar e Encerar";
    carroMsg = "Janela de tempo firme e seco nos próximos dias. Ideal tanto para lavagem simples quanto para polimento ou enceramento.";
  } else if (probabilidadeChuva >= 30) {
    carroStatus = "Atenção";
    carroCor = "badge-amber";
    carroTitulo = "Instabilidade Leve Prevista";
    carroMsg = `Há chance de pancadas isoladas (${probabilidadeChuva}%). Uma limpeza rápida interna ou vidros pode ser melhor que lavagem completa.`;
  }

  indices.push({
    id: "carro",
    categoria: "carro",
    rotuloAba: "Lavar o Carro",
    emoji: "🚗",
    status: carroStatus,
    statusCor: carroCor,
    titulo: carroTitulo,
    mensagem: carroMsg,
  });

  return indices;
}
