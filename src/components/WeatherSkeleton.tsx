import React from "react";

export function WeatherSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 bg-slate-900/60 backdrop-blur-md border border-slate-700/60 shadow-2xl animate-pulse space-y-5 sm:space-y-6">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-700/70 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-800 rounded"></div>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-slate-800"></div>
      </div>

      {/* Destaque da Temperatura */}
      <div className="flex flex-col md:flex-row items-baseline gap-4 py-4">
        <div className="h-20 w-36 bg-slate-700/80 rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-6 w-44 bg-slate-700/60 rounded-full"></div>
          <div className="h-4 w-28 bg-slate-800 rounded"></div>
        </div>
      </div>

      {/* Grid de Métricas / Coordenadas e Vento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/40 space-y-2">
          <div className="h-4 w-24 bg-slate-700/60 rounded"></div>
          <div className="h-6 w-32 bg-slate-700 rounded"></div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/40 space-y-2">
          <div className="h-4 w-32 bg-slate-700/60 rounded"></div>
          <div className="h-6 w-40 bg-slate-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}

