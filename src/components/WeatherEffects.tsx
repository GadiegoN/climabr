import React, { useMemo } from "react";

interface WeatherEffectsProps {
  weatherCode?: number;
  isDay?: number;
}

export function WeatherEffects({ weatherCode, isDay = 1 }: WeatherEffectsProps) {
  if (weatherCode === undefined) return null;

  const isChuvisco = weatherCode >= 51 && weatherCode <= 55;
  const isChuva =
    (weatherCode >= 61 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82);
  const isTempestade = weatherCode >= 95;
  const isNeve =
    (weatherCode >= 71 && weatherCode <= 77) ||
    (weatherCode >= 85 && weatherCode <= 86);
  const isNevoeiro = weatherCode === 45 || weatherCode === 48;
  const isNublado = weatherCode === 3;
  const isNoiteEstrelada = isDay === 0 && weatherCode <= 2;
  const isEnsolarado = isDay === 1 && weatherCode === 0;

  // 1. CHUVA / TEMPESTADE / CHUVISCO: Distribuição 100% balanceada em toda a tela (esquerda, centro e direita)
  const raindrops = useMemo(() => {
    if (!isChuva && !isTempestade && !isChuvisco) return [];

    const count = isTempestade ? 65 : isChuvisco ? 25 : 45;
    const step = 98 / count;

    return Array.from({ length: count }).map((_, i) => {
      // Jitter pseudo-aleatório determinístico baseado em primos para evitar repetição artificial
      const jitter = (((i * 17 + 7) % 11) - 5) * 0.35;
      const left = Math.min(99, Math.max(1, 1 + i * step + jitter));
      const delay = ((i * 13 + 5) % 30) / 10;
      const duration = isTempestade
        ? 0.45 + ((i * 7) % 5) * 0.05
        : isChuvisco
        ? 0.9 + ((i * 7) % 5) * 0.08
        : 0.65 + ((i * 7) % 6) * 0.08;
      const height = isTempestade
        ? 36 + (i % 4) * 8
        : isChuvisco
        ? 16 + (i % 3) * 4
        : 26 + (i % 4) * 6;
      const opacity = isTempestade ? 0.6 : isChuvisco ? 0.35 : 0.45;

      return {
        id: i,
        left,
        delay,
        duration,
        height,
        opacity,
      };
    });
  }, [isChuva, isTempestade, isChuvisco]);

  // 2. NOITE ESTRELADA: Cobertura completa e equilibrada do céu noturno (grid 9x5 com dispersão natural)
  const stars = useMemo(() => {
    if (!isNoiteEstrelada) return [];

    const count = 45;
    const cols = 9;
    const rows = 5;
    const colWidth = 96 / cols;
    const rowHeight = 80 / rows;

    return Array.from({ length: count }).map((_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const jitterX = (((i * 19 + 3) % 11) - 5) * 0.7;
      const jitterY = (((i * 23 + 7) % 11) - 5) * 0.7;

      const left = Math.min(98, Math.max(2, 2 + col * colWidth + colWidth / 2 + jitterX));
      const top = Math.min(85, Math.max(4, 4 + row * rowHeight + rowHeight / 2 + jitterY));

      const size = i % 7 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5;
      const delay = ((i * 17) % 35) / 10;
      const duration = 2.0 + ((i * 7) % 4) * 0.5;

      return {
        id: i,
        left,
        top,
        size,
        delay,
        duration,
      };
    });
  }, [isNoiteEstrelada]);

  // 3. NEVE: Flocos flutuantes distribuídos uniformemente
  const snowflakes = useMemo(() => {
    if (!isNeve) return [];

    const count = 35;
    const step = 98 / count;

    return Array.from({ length: count }).map((_, i) => {
      const jitter = (((i * 13 + 5) % 11) - 5) * 0.4;
      const left = Math.min(99, Math.max(1, 1 + i * step + jitter));
      const delay = ((i * 19 + 3) % 40) / 10;
      const duration = 2.8 + ((i * 7) % 5) * 0.4;
      const size = i % 4 === 0 ? 5 : i % 2 === 0 ? 4 : 3;

      return {
        id: i,
        left,
        delay,
        duration,
        size,
      };
    });
  }, [isNeve]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 🌧️ 1. Efeito de Chuva / Tempestade / Chuvisco (Balanceado de ponta a ponta) */}
      {(isChuva || isTempestade || isChuvisco) && (
        <div className="absolute inset-0">
          {raindrops.map((drop) => (
            <span
              key={drop.id}
              style={{
                left: `${drop.left}%`,
                animationDelay: `${drop.delay}s`,
                animationDuration: `${drop.duration}s`,
                height: `${drop.height}px`,
                opacity: drop.opacity,
              }}
              className="absolute -top-12 w-[1.5px] bg-gradient-to-b from-transparent via-sky-300 to-sky-400 animate-rain-drop rounded-full"
            />
          ))}
        </div>
      )}

      {/* ⚡ 2. Relâmpago para Tempestade com Trovoadas */}
      {isTempestade && (
        <div className="absolute inset-0 bg-white/12 animate-lightning opacity-0 pointer-events-none" />
      )}

      {/* ❄️ 3. Efeito de Neve Flutuante */}
      {isNeve && (
        <div className="absolute inset-0">
          {snowflakes.map((flake) => (
            <span
              key={flake.id}
              style={{
                left: `${flake.left}%`,
                width: `${flake.size}px`,
                height: `${flake.size}px`,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration}s`,
              }}
              className="absolute -top-6 bg-white/80 rounded-full animate-snow-fall shadow-sm"
            />
          ))}
        </div>
      )}

      {/* ✨ 4. Noite Estrelada (Distribuída por todo o céu visível) */}
      {isNoiteEstrelada && (
        <div className="absolute inset-0 opacity-75">
          {stars.map((star) => (
            <span
              key={star.id}
              style={{
                top: `${star.top}%`,
                left: `${star.left}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
              className="absolute bg-white rounded-full animate-twinkle shadow-sm"
            />
          ))}
        </div>
      )}

      {/* ☀️ 5. Sol Radiante (Aura Solar Centralizada & Atmosférica) */}
      {isEnsolarado && (
        <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none">
          {/* Brilho Solar Central no topo da página */}
          <div className="w-[850px] max-w-[95vw] h-[380px] -top-24 rounded-full bg-gradient-to-b from-amber-400/20 via-orange-300/10 to-transparent blur-3xl animate-sun-glow pointer-events-none" />
        </div>
      )}

      {/* 🌫️ 6. Nevoeiro / Neblina Atmosférica */}
      {isNevoeiro && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-slate-400/20 via-slate-300/10 to-transparent blur-3xl animate-fog-drift" />
        </div>
      )}

      {/* ☁️ 7. Nublado / Encoberto */}
      {isNublado && (
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-slate-500/15 via-slate-600/5 to-transparent blur-2xl pointer-events-none" />
      )}
    </div>
  );
}
