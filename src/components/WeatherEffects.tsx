import React from "react";

interface WeatherEffectsProps {
  weatherCode?: number;
  isDay?: number;
}

export function WeatherEffects({ weatherCode, isDay = 1 }: WeatherEffectsProps) {
  if (weatherCode === undefined) return null;

  const isChuva =
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82);
  const isTempestade = weatherCode >= 95;
  const isNoiteEstrelada = isDay === 0 && weatherCode <= 2;
  const isEnsolarado = isDay === 1 && weatherCode === 0;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Efeito de Chuva / Chuvisco */}
      {(isChuva || isTempestade) && (
        <div className="absolute inset-0 opacity-40">
          {Array.from({ length: isTempestade ? 40 : 25 }).map((_, i) => {
            const left = (i * 2.5 + (i % 7) * 0.3) % 100;
            const delay = (i * 0.12) % 1.5;
            const duration = 0.6 + ((i * 0.08) % 0.4);

            return (
              <span
                key={i}
                style={{
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                }}
                className="absolute -top-10 w-[1.5px] h-8 bg-gradient-to-b from-transparent via-sky-300 to-sky-400 animate-rain-drop rounded-full"
              />
            );
          })}
        </div>
      )}

      {/* Efeito de Relâmpago para Tempestade */}
      {isTempestade && (
        <div className="absolute inset-0 bg-white/10 animate-lightning opacity-0 pointer-events-none" />
      )}

      {/* Efeito de Noite Estrelada */}
      {isNoiteEstrelada && (
        <div className="absolute inset-0 opacity-60">
          {Array.from({ length: 30 }).map((_, i) => {
            const top = (i * 3.3 + (i % 5) * 2) % 85;
            const left = (i * 3.5 + (i % 8) * 4) % 95;
            const delay = (i * 0.25) % 3;

            return (
              <span
                key={i}
                style={{
                  top: `${top}%`,
                  left: `${left}%`,
                  animationDelay: `${delay}s`,
                }}
                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle shadow-sm"
              />
            );
          })}
        </div>
      )}

      {/* Efeito de Sol Radiante */}
      {isEnsolarado && (
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl animate-pulse pointer-events-none" />
      )}
    </div>
  );
}

