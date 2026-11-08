"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  Database,
  MapPin,
  ExternalLink,
  Trash2,
  CheckCircle2,
  EyeOff,
  Server,
  FileText,
  Bell,
} from "lucide-react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLimparDadosLocais?: () => void;
}

export function PrivacyModal({
  isOpen,
  onClose,
  onLimparDadosLocais,
}: PrivacyModalProps) {
  const [dadosLimpos, setDadosLimpos] = useState(false);

  // Fecha no Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cardStyle = {
    backgroundColor: "var(--card-bg)",
    borderColor: "var(--card-border)",
    color: "var(--text-main)",
  };

  const handleLimparTudo = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("climabr_favoritos");
        localStorage.removeItem("climabr_historico");
        localStorage.removeItem("climabr_theme");
        localStorage.removeItem("climabr_notificacoes_config");
        sessionStorage.clear();
      } catch {
        // Ignora
      }
    }
    if (onLimparDadosLocais) {
      onLimparDadosLocais();
    }
    setDadosLimpos(true);
    setTimeout(() => setDadosLimpos(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        style={cardStyle}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl p-5 sm:p-7 space-y-6"
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Privacidade & Governança de Dados
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                ClimaBR • Transparência Absoluta, Zero Rastreamento e Conformidade LGPD
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar modal de privacidade"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Rápido de Compromissos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
              <EyeOff className="w-4 h-4 shrink-0" />
              <span>Zero Rastreamento</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">
              Sem Google Analytics, sem pixels do Meta ou cookies de publicidade de terceiros.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
              <Database className="w-4 h-4 shrink-0" />
              <span>Dados 100% Locais</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">
              Favoritos, histórico e temas ficam gravados apenas no seu navegador.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold text-xs">
              <Lock className="w-4 h-4 shrink-0" />
              <span>GPS Anonimizado</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-tight">
              Máscara de privacidade (~1km) com descarte imediato na memória.
            </p>
          </div>
        </div>

        {/* Seção 1: Coleta & LGPD */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>1. Conformidade com a LGPD (Lei nº 13.709/2018)</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            O ClimaBR opera sob os princípios da <strong>finalidade</strong>, <strong>adequação</strong> e <strong>minimização</strong>. Não solicitamos e não armazenamos nenhum dado pessoal identificável — não coletamos nomes, CPFs, e-mails, números de telefone, senhas ou dados bancários. O acesso às informações meteorológicas é 100% anônimo e livre de cadastros.
          </p>
        </div>

        {/* Seção 2: Onde as preferências ficam salvas */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
            <Database className="w-4 h-4 text-sky-400" />
            <span>2. Armazenamento no Navegador (Client-Side)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[var(--card-border)] rounded-xl overflow-hidden">
              <thead className="bg-black/5 dark:bg-white/5 border-b border-[var(--card-border)] font-semibold text-[var(--text-main)]">
                <tr>
                  <th className="p-2.5">Dado</th>
                  <th className="p-2.5">Local</th>
                  <th className="p-2.5">Finalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] text-[var(--text-muted)] text-[11px]">
                <tr>
                  <td className="p-2.5 font-medium text-[var(--text-main)]">Cidades Favoritas</td>
                  <td className="p-2.5"><code>localStorage</code></td>
                  <td className="p-2.5">Acesso rápido às cidades que você favoritou</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-[var(--text-main)]">Últimas 5 Cidades</td>
                  <td className="p-2.5"><code>localStorage</code></td>
                  <td className="p-2.5">Histórico recente para facilitar novas consultas</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-[var(--text-main)]">Tema (Claro / Escuro)</td>
                  <td className="p-2.5"><code>localStorage</code></td>
                  <td className="p-2.5">Manter sua preferência visual na próxima visita</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-[var(--text-main)]">Alertas Diários (08h e 20h)</td>
                  <td className="p-2.5"><code>localStorage</code></td>
                  <td className="p-2.5">Horários e cidade para notificações meteorológicas (100% opt-in)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-[var(--text-main)]">Cache de Previsão</td>
                  <td className="p-2.5"><code>sessionStorage</code></td>
                  <td className="p-2.5">Evitar requisições duplicadas. Apagado ao fechar a aba</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] italic">
            * Nenhum desses dados é transmitido para servidores de banco de dados ou sistemas centrais do ClimaBR.
          </p>
        </div>

        {/* Seção 3: Geolocalização / GPS */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span>3. Como funciona a Localização Atual (GPS)</span>
          </h3>
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
            <p>
              O uso do GPS é <strong>totalmente opcional</strong>. Caso você decida utilizá-lo para evitar digitar o nome do seu município:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] pl-1">
              <li>
                <strong>Máscara de Privacidade:</strong> As coordenadas são arredondadas para 2 casas decimais (~1.1 km de precisão). Isso protege sua privacidade e impede a identificação de ruas ou residências exatas.
              </li>
              <li>
                <strong>Descarte Imediato:</strong> As coordenadas são utilizadas unicamente no momento do clique para identificar a cidade e UF correspondentes via API de geocodificação reversa, sendo descartadas da memória logo em seguida.
              </li>
              <li>
                <strong>Sem Histórico de Rota:</strong> O aplicativo nunca rastreia você em segundo plano nem salva trajetos.
              </li>
            </ul>
          </div>
        </div>

        {/* Seção 4: Notificações Diárias & Alertas */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>4. Notificações Diárias Agendadas (08h e 20h)</span>
          </h3>
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-[var(--card-border)] space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
            <p>
              O sistema de alertas meteorológicos do ClimaBR segue estritamente a LGPD (Lei 13.709/2018):
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] pl-1">
              <li>
                <strong>100% Opt-in (Consentimento Expresso):</strong> Nenhuma notificação é enviada sem que você clique e autorize ativamente no navegador.
              </li>
              <li>
                <strong>Zero Coleta de Dados Pessoais:</strong> Não solicitamos e não armazenamos seu e-mail, telefone, CPF ou cadastro. O envio é anônimo e gerido no seu próprio navegador.
              </li>
              <li>
                <strong>Horários Previsíveis:</strong> Apenas os resumos meteorológicos solicitados (às 08:00 e/ou às 20:00). Nunca enviamos propagandas ou spam.
              </li>
              <li>
                <strong>Revogação Imediata (Opt-out):</strong> Você pode desativar as notificações com um clique a qualquer momento no botão de alertas ou limpando seus dados locais.
              </li>
            </ul>
          </div>
        </div>

        {/* Seção 5: Serviços Externos & APIs Públicas */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-main)]">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>5. APIs Externas e Fontes Governamentais</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Para fornecer as previsões, dados agroclimáticos e alertas de desastres, o ClimaBR consulta fontes abertas e governamentais enviando apenas parâmetros geográficos públicos essenciais:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)]">
            <li className="p-2 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)]">
              <strong>IBGE:</strong> Código do município e UF (malhas e estatísticas).
            </li>
            <li className="p-2 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)]">
              <strong>Open-Meteo & Copernicus:</strong> Latitude/Longitude para modelagem numérica.
            </li>
            <li className="p-2 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)]">
              <strong>INMET & CEMADEN:</strong> Sigla do estado para triagem de alertas severos.
            </li>
            <li className="p-2 rounded-xl bg-black/5 dark:bg-white/[0.02] border border-[var(--card-border)]">
              <strong>EBC & G1 RSS:</strong> Feeds públicos sanitizados contra scripts maliciosos.
            </li>
          </ul>
        </div>

        {/* Seção 5: Controle dos Dados (Botão de Limpeza) */}
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Gerenciar Meus Dados Locais</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Você pode apagar todo o histórico de cidades, favoritos e preferências salvas no seu navegador com um clique.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLimparTudo}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            {dadosLimpos ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Dados Limpos!</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Dados Locais</span>
              </>
            )}
          </button>
        </div>

        {/* Rodapé do Modal: Link do Código Aberto no GitHub */}
        <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--card-border)" }}>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Código 100% Aberto e Auditável</span>
          </div>
          <a
            href="https://github.com/GadiegoN/climabr"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[var(--text-main)] hover:text-emerald-500 transition-colors inline-flex items-center gap-1 text-[11px]"
          >
            <span>Ver repositório no GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

