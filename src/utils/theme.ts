import { TipoTema, DadosClimaCidade } from "@/types/weather";

export interface ConfiguracaoVisualTema {
  temaAtivo: "claro" | "escuro" | "amanhecer" | "anoitecer";
  fundoPrincipal: string;
  corTextoPrincipal: string;
  corSubtexto: string;
  fundoCard: string;
  bordaCard: string;
  fundoInput: string;
  bordaInput: string;
  textoInput: string;
  badgeFundo: string;
  badgeTexto: string;
}

/**
 * Calcula qual é o tema efetivo quando a opção "auto" está selecionada,
 * levando em consideração o horário da cidade pesquisada ou o horário do cliente.
 */
export function resolverTemaEfetivo(
  preferencia: TipoTema,
  dadosClima?: DadosClimaCidade | null
): "claro" | "escuro" | "amanhecer" | "anoitecer" {
  if (preferencia !== "auto") {
    return preferencia;
  }

  // Se estiver no modo automático, determinar pelas horas da cidade ou do relógio local
  let hora = new Date().getHours();
  if (dadosClima?.clima?.time) {
    const dataCidade = new Date(dadosClima.clima.time);
    if (!isNaN(dataCidade.getTime())) {
      hora = dataCidade.getHours();
    }
  }

  // 05h00 às 08h00: Amanhecer
  if (hora >= 5 && hora < 8) {
    return "amanhecer";
  }
  // 08h00 às 17h30: Claro (dia pleno)
  if (hora >= 8 && hora < 18) {
    return "claro";
  }
  // 17h30 às 19h30: Anoitecer / Crepúsculo
  if (hora >= 18 && hora < 20) {
    return "anoitecer";
  }
  // 20h00 às 04h59: Noite / Escuro
  return "escuro";
}

/**
 * Retorna as classes Tailwind adequadas para cada tema.
 */
export function getConfiguracaoTema(
  temaEfetivo: "claro" | "escuro" | "amanhecer" | "anoitecer"
): ConfiguracaoVisualTema {
  switch (temaEfetivo) {
    case "claro":
      return {
        temaAtivo: "claro",
        fundoPrincipal: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200 via-sky-50 to-slate-100",
        corTextoPrincipal: "text-slate-900",
        corSubtexto: "text-slate-600",
        fundoCard: "bg-white/85 backdrop-blur-xl",
        bordaCard: "border-slate-300/80 shadow-xl",
        fundoInput: "bg-slate-100/90",
        bordaInput: "border-slate-300",
        textoInput: "text-slate-900",
        badgeFundo: "bg-sky-100 border border-sky-300",
        badgeTexto: "text-sky-800",
      };

    case "amanhecer":
      return {
        temaAtivo: "amanhecer",
        fundoPrincipal: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/30 via-orange-950/40 to-slate-950",
        corTextoPrincipal: "text-amber-50",
        corSubtexto: "text-amber-200/70",
        fundoCard: "bg-stone-900/80 backdrop-blur-xl",
        bordaCard: "border-amber-900/50 shadow-2xl shadow-orange-950/20",
        fundoInput: "bg-stone-800/90",
        bordaInput: "border-amber-800/50",
        textoInput: "text-amber-100",
        badgeFundo: "bg-amber-500/15 border border-amber-500/30",
        badgeTexto: "text-amber-300",
      };

    case "anoitecer":
      return {
        temaAtivo: "anoitecer",
        fundoPrincipal: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-950/50 via-indigo-950/60 to-slate-950",
        corTextoPrincipal: "text-fuchsia-50",
        corSubtexto: "text-indigo-200/70",
        fundoCard: "bg-slate-900/80 backdrop-blur-xl",
        bordaCard: "border-purple-900/50 shadow-2xl shadow-purple-950/20",
        fundoInput: "bg-slate-800/90",
        bordaInput: "border-purple-800/50",
        textoInput: "text-purple-100",
        badgeFundo: "bg-purple-500/15 border border-purple-500/30",
        badgeTexto: "text-purple-300",
      };

    case "escuro":
    default:
      return {
        temaAtivo: "escuro",
        fundoPrincipal: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black",
        corTextoPrincipal: "text-slate-100",
        corSubtexto: "text-slate-400",
        fundoCard: "bg-slate-900/80 backdrop-blur-xl",
        bordaCard: "border-slate-800 shadow-2xl",
        fundoInput: "bg-slate-800/90",
        bordaInput: "border-slate-700",
        textoInput: "text-slate-100",
        badgeFundo: "bg-emerald-500/10 border border-emerald-500/20",
        badgeTexto: "text-emerald-400",
      };
  }
}

