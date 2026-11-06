import React from "react";
import { TipoTema } from "@/types/weather";
import { Sun, Moon, Sunrise, Sunset, Sparkles } from "lucide-react";

interface ThemeSelectorProps {
  temaSelecionado: TipoTema;
  temaEfetivo: "claro" | "escuro" | "amanhecer" | "anoitecer";
  onTemaChange: (tema: TipoTema) => void;
}

export function ThemeSelector({
  temaSelecionado,
  temaEfetivo,
  onTemaChange,
}: ThemeSelectorProps) {
  const opcoes: { id: TipoTema; label: string; icone: React.ReactNode }[] = [
    {
      id: "auto",
      label: `Auto (${temaEfetivo})`,
      icone: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: "claro",
      label: "Claro",
      icone: <Sun className="w-3.5 h-3.5" />,
    },
    {
      id: "escuro",
      label: "Escuro",
      icone: <Moon className="w-3.5 h-3.5" />,
    },
    {
      id: "amanhecer",
      label: "Amanhecer",
      icone: <Sunrise className="w-3.5 h-3.5" />,
    },
    {
      id: "anoitecer",
      label: "Anoitecer",
      icone: <Sunset className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex items-center justify-center">
      <div
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--card-shadow)",
        }}
        className="inline-flex items-center gap-1 p-1 rounded-2xl backdrop-blur-xl border shadow-lg"
      >
        {opcoes.map((opcao) => {
          const isAtivo = temaSelecionado === opcao.id;

          return (
            <button
              key={opcao.id}
              type="button"
              onClick={() => onTemaChange(opcao.id)}
              style={
                isAtivo
                  ? {
                      backgroundColor: "var(--accent-color)",
                      color: "#ffffff",
                    }
                  : {
                      color: "var(--text-muted)",
                    }
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                isAtivo
                  ? "shadow-md"
                  : "hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {opcao.icone}
              <span className="hidden sm:inline capitalize">{opcao.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
