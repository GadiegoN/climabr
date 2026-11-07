/**
 * Utilitário para formatação amigável de datas no padrão brasileiro (pt-BR).
 */

/**
 * Converte qualquer formato de data/hora (ISO, YYYY-MM-DD HH:mm, etc)
 * para exibição elegante: "07/11/2026 às 00:00" ou "07/11/2026".
 */
export function formatarDataHoraBR(dataStr?: string): string {
  if (!dataStr) return "";

  const trimmed = dataStr.trim();
  // Se já estiver no formato DD/MM/AAAA, apenas remove segundos se houver
  if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
    const partes = trimmed.split(" ");
    if (partes.length > 1) {
      const horaMin = partes[1].slice(0, 5);
      return `${partes[0]} às ${horaMin}`;
    }
    return trimmed;
  }

  // Trata formato YYYY-MM-DD HH:mm:ss ou YYYY-MM-DDTHH:mm:ss
  const isoLimpo = trimmed.replace(" ", "T");
  const d = new Date(isoLimpo);

  if (!isNaN(d.getTime())) {
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = d.getFullYear();
    const hora = String(d.getHours()).padStart(2, "0");
    const minuto = String(d.getMinutes()).padStart(2, "0");

    // Se a string original tinha informação de hora
    if (trimmed.includes(":") || trimmed.includes("T")) {
      return `${dia}/${mes}/${ano} às ${hora}:${minuto}`;
    }
    return `${dia}/${mes}/${ano}`;
  }

  // Fallback manual por regex para strings como "2026-11-07 00:00"
  const partes = trimmed.split(/[\sT]+/);
  if (partes[0] && partes[0].includes("-")) {
    const [ano, mes, dia] = partes[0].split("-");
    const hora = partes[1] ? partes[1].slice(0, 5) : "";
    return hora ? `${dia}/${mes}/${ano} às ${hora}` : `${dia}/${mes}/${ano}`;
  }

  return trimmed;
}

/**
 * Formata o período de vigência de alertas meteorológicos (INMET / CEMADEN)
 * Exemplo mesmo dia: "07/11/2026, das 00:00 às 23:59"
 * Exemplo dias diferentes: "De 06/11/2026 às 09:10 até 07/11/2026 às 23:59"
 */
export function formatarIntervaloVigencia(inicio?: string, fim?: string): string {
  if (!inicio && !fim) return "Período em monitoramento contínuo";
  if (inicio && !fim) return `A partir de ${formatarDataHoraBR(inicio)}`;
  if (!inicio && fim) return `Válido até ${formatarDataHoraBR(fim)}`;

  const inicioFmt = formatarDataHoraBR(inicio);
  const fimFmt = formatarDataHoraBR(fim);

  // Se forem do mesmo dia (ex: 07/11/2026 às 00:00 e 07/11/2026 às 23:59)
  const dataInicio = inicioFmt.split(" às ")[0];
  const horaInicio = inicioFmt.split(" às ")[1];
  const dataFim = fimFmt.split(" às ")[0];
  const horaFim = fimFmt.split(" às ")[1];

  if (dataInicio && dataFim && dataInicio === dataFim && horaInicio && horaFim) {
    return `${dataInicio}, das ${horaInicio} às ${horaFim}`;
  }

  return `De ${inicioFmt} até ${fimFmt}`;
}

