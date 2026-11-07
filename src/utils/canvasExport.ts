import { DadosClimaCidade, CondicaoVisualClima } from "@/types/weather";
import { getFaseDaLua } from "@/utils/astronomy";
import { gerarDicasPraticas } from "@/utils/dailyTips";

/**
 * Utilitário para exportar a previsão climática como imagem PNG de alta definição (1080x1080)
 * utilizando a API nativa HTML5 Canvas 2D (zero dependências externas, compatível com todos navegadores).
 */

// Helper para desenhar retângulos com cantos arredondados compatível com qualquer navegador
function desenharRetanguloArredondado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function gerarImagemPrevisaoPNG(
  cidade: DadosClimaCidade,
  condicao: CondicaoVisualClima
): string {
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const isDay = cidade.clima.is_day === 1;
  const tempAtual = Math.round(cidade.clima.temperature);
  const hoje = cidade.previsaoDiaria?.[0];
  const max = hoje ? Math.round(hoje.tempMax) : tempAtual;
  const min = hoje ? Math.round(hoje.tempMin) : tempAtual;
  const chuva = hoje?.probabilidadeChuva ?? 0;
  const sensacao = Math.round(cidade.clima.apparent_temperature ?? tempAtual);
  const umidade = Math.round(cidade.clima.relative_humidity ?? 70);
  const vento = Math.round(cidade.clima.windspeed);

  const faseLua = getFaseDaLua();
  const dicas = gerarDicasPraticas({
    tempAtual,
    tempMin: min,
    tempMax: max,
    probabilidadeChuva: chuva,
    umidade,
    uv: cidade.qualidadeAr?.uvIndex ?? 0,
  });
  const dicaPrincipal = dicas[0]?.mensagem || "Mantenha-se hidratado e acompanhe as atualizações.";

  // 1. FUNDO COM GRADIENTE ATMOSFÉRICO
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (condicao.icone === "thunderstorm") {
    bgGrad.addColorStop(0, "#1e1b4b");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#030712");
  } else if (condicao.icone === "rain" || condicao.icone === "drizzle") {
    bgGrad.addColorStop(0, "#083344");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
  } else if (isDay) {
    bgGrad.addColorStop(0, "#0284c7");
    bgGrad.addColorStop(0.5, "#0369a1");
    bgGrad.addColorStop(1, "#0f172a");
  } else {
    bgGrad.addColorStop(0, "#1e1b4b");
    bgGrad.addColorStop(0.5, "#0f172a");
    bgGrad.addColorStop(1, "#020617");
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. ORBES LUMINOSOS DECORATIVOS (GLOW)
  const orb1 = ctx.createRadialGradient(880, 200, 10, 880, 200, 400);
  orb1.addColorStop(0, isDay ? "rgba(56, 189, 248, 0.35)" : "rgba(139, 92, 246, 0.3)");
  orb1.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, width, height);

  const orb2 = ctx.createRadialGradient(200, 880, 10, 200, 880, 450);
  orb2.addColorStop(0, "rgba(16, 185, 129, 0.2)");
  orb2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, width, height);

  // 3. CARD CENTRAL EM VIDRO (GLASSMORPHISM)
  const cardX = 60;
  const cardY = 60;
  const cardW = 960;
  const cardH = 960;
  const cardRadius = 36;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  desenharRetanguloArredondado(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.fill();
  ctx.restore();

  // Borda sutil do card
  ctx.save();
  desenharRetanguloArredondado(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 4. HEADER: LOGO CLIMABR + DATA
  // Badge ClimaBR
  const badgeX = 110;
  const badgeY = 110;
  const badgeW = 150;
  const badgeH = 44;
  desenharRetanguloArredondado(ctx, badgeX, badgeY, badgeW, badgeH, 22);
  ctx.fillStyle = "rgba(56, 189, 248, 0.18)";
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CLIMABR", badgeX + badgeW / 2, badgeY + badgeH / 2);

  // Data formatada no topo direito
  const dataHojeStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.textAlign = "right";
  ctx.fillText(dataHojeStr.charAt(0).toUpperCase() + dataHojeStr.slice(1), 970, 132);

  // Linha divisória sutil
  ctx.beginPath();
  ctx.moveTo(110, 180);
  ctx.lineTo(970, 180);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 5. LOCALIZAÇÃO (CIDADE E ESTADO)
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Ajuste dinâmico de tamanho da fonte para o nome da cidade
  const nomeCidade = `${cidade.municipio} - ${cidade.uf}`;
  let tamanhoFonteCidade = 54;
  if (nomeCidade.length > 22) tamanhoFonteCidade = 44;
  if (nomeCidade.length > 30) tamanhoFonteCidade = 36;

  ctx.font = `bold ${tamanhoFonteCidade}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(nomeCidade, 110, 215);

  ctx.font = "500 22px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("Previsão Meteorológica Oficial em Tempo Real", 110, 280);

  // 6. DESTAQUE PRINCIPAL: TEMPERATURA + CONDIÇÃO + MÁX/MÍN
  // Temperatura Atual
  ctx.font = "900 130px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${tempAtual}°`, 110, 325);

  // Condição Climática
  ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(condicao.descricao, 430, 360);

  // Pílula de Amplitude Térmica (Mín / Máx)
  const pillX = 430;
  const pillY = 415;
  const pillW = 320;
  const pillH = 46;
  desenharRetanguloArredondado(ctx, pillX, pillY, pillW, pillH, 23);
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = "600 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`▲ Máx ${max}°C   •   ▼ Mín ${min}°C`, pillX + pillW / 2, pillY + pillH / 2);

  // 7. GRID DE 4 MÉTRICAS (CHUVA, UMIDADE, VENTO, SENSAÇÃO)
  const gridY = 505;
  const colW = 405;
  const boxH = 110;
  const gapX = 50;
  const gapY = 24;

  const metricas = [
    {
      titulo: "Probabilidade de Chuva",
      valor: `${chuva}%`,
      sub: chuva > 60 ? "Alta chance de chuva" : "Sem previsão de chuva forte",
      icone: "🌧️",
      cor: "#38bdf8",
    },
    {
      titulo: "Sensação Térmica",
      valor: `${sensacao}°C`,
      sub: sensacao > tempAtual ? "Mais quente que o termômetro" : "Sensação agradável",
      icone: "🌡️",
      cor: "#fbbf24",
    },
    {
      titulo: "Vento Atual",
      valor: `${vento} km/h`,
      sub: `Direção: ${cidade.clima.winddirection}°`,
      icone: "💨",
      cor: "#34d399",
    },
    {
      titulo: "Umidade Relativa",
      valor: `${umidade}%`,
      sub: umidade < 30 ? "Atenção: ar seco" : "Nível adequado",
      icone: "💧",
      cor: "#60a5fa",
    },
  ];

  metricas.forEach((m, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 110 + col * (colW + gapX);
    const by = gridY + row * (boxH + gapY);

    // Box container
    desenharRetanguloArredondado(ctx, bx, by, colW, boxH, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ícone da métrica
    ctx.font = "32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(m.icone, bx + 22, by + boxH / 2);

    // Título
    ctx.font = "500 17px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(m.titulo, bx + 75, by + 34);

    // Valor
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(m.valor, bx + 75, by + 68);

    // Subtítulo
    ctx.font = "400 14px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = m.cor;
    ctx.fillText(m.sub, bx + 75, by + 94);
  });

  // 8. FAIXA INFERIOR: FASE DA LUA E DICA PRÁTICA
  const dicaY = 790;
  const dicaW = 860;
  const dicaH = 100;
  desenharRetanguloArredondado(ctx, 110, dicaY, dicaW, dicaH, 22);
  ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Lua e Dica
  ctx.font = "30px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(faseLua.icone, 135, dicaY + 50);

  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(`Lua: ${faseLua.nome} (${faseLua.percentualIluminacao}% visível)`, 185, dicaY + 36);

  // Quebra de texto suave para a dica do dia
  let dicaTexto = dicaPrincipal;
  if (dicaTexto.length > 70) dicaTexto = dicaTexto.slice(0, 67) + "...";
  ctx.font = "400 16px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`💡 Dica: ${dicaTexto}`, 185, dicaY + 66);

  // 9. RODAPÉ INSTITUCIONAL COM LINK
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 17px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(
    "Acesse: climabr-two.vercel.app  •  Dados oficiais: Open-Meteo, INMET e IBGE",
    540,
    955
  );

  return canvas.toDataURL("image/png");
}

export function baixarPrevisaoComoPNG(
  cidade: DadosClimaCidade,
  condicao: CondicaoVisualClima
): boolean {
  try {
    const dataUrl = gerarImagemPrevisaoPNG(cidade, condicao);
    if (!dataUrl) return false;

    const link = document.createElement("a");
    const nomeArquivo = `climabr-${cidade.municipio.toLowerCase().replace(/\s+/g, "-")}-${cidade.uf.toLowerCase()}.png`;
    link.href = dataUrl;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("Erro ao gerar/baixar PNG:", err);
    return false;
  }
}

