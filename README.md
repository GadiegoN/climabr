# ⛅ ClimaBR — Inteligência Meteorológica para os 5.570 Municípios Brasileiros

[![Deploy with Vercel](https://vercel.com/button)](https://climabr-two.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![LGPD Compliant](https://img.shields.io/badge/LGPD-Conformidade%20Total-blue.svg)](#-privacidade-seguran%C3%A7a--governan%C3%A7a-de-dados-lgpd)
[![Zero Trackers](https://img.shields.io/badge/Rastreadores-Zero%20(No%20Ads)-success.svg)](#-privacidade-seguran%C3%A7a--governan%C3%A7a-de-dados-lgpd)

> Uma plataforma web moderna, rápida e 100% livre de anúncios intrusivos ou pop-ups, desenvolvida para entregar previsões do tempo confiáveis, monitoramento ambiental e alertas de defesa civil para qualquer município do Brasil.

🌐 **Acesse a versão ao vivo:** [climabr-two.vercel.app](https://climabr-two.vercel.app/)

---

## 🎯 Por que o ClimaBR foi criado?

Consultar o clima na internet tornou-se uma experiência frustrante: pop-ups cobrindo a tela inteira, dezenas de banners publicitários disputando atenção, consumo excessivo de dados móveis e a informação meteorológica enterrada no meio da poluição visual.

O **ClimaBR** nasceu como um contraponto:
- **Zero anúncios intrusivos ou pop-ups.**
- **Zero rastreadores de marketing** (sem Google Analytics, sem pixels de redes sociais).
- **Dados oficiais e transparentes** provenientes de instituições governamentais e científicas.
- **Interface rápida, acessível e responsiva** para celulares, tablets e computadores.

---

## 🛡️ Privacidade, Segurança & Governança de Dados (LGPD)

O ClimaBR foi concebido com a privacidade como requisito central (Privacy by Design), em total conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**.

### 1. Ausência de Coleta de Dados Pessoais
- Não solicitamos nem armazenamos nome, e-mail, telefone, CPF ou senhas.
- Não existem telas de login ou formulários obrigatórios para consulta.

### 2. Armazenamento 100% no Navegador (Client-Side)
Toda e qualquer preferência do usuário é guardada estritamente no armazenamento local do próprio navegador (`localStorage` / `sessionStorage`), sem envio para servidores de bancos de dados:

| Dado Salvo | Local de Armazenamento | Finalidade |
| :--- | :--- | :--- |
| **Cidades Favoritas** | `localStorage` (`climabr_cidades_favoritas`) | Atalho rápido para municípios favoritados |
| **Últimas 5 Cidades** | `localStorage` (`climabr_cidades_recentes`) | Histórico recente para agilizar nova pesquisa |
| **Tema Visual** | `localStorage` (`climabr_tema_preferido`) | Preservar preferência de tema (Claro / Escuro / Auto) |
| **Alertas Customizados** | `localStorage` (`climabr_notificacoes_config`) | Alarmes programados com horários e tópicos independentes |
| **Exibição Modular** | `localStorage` (`climabr_config_visualizacao`) | Preferências de ativação/desativação dos cards da tela |
| **Cache de Previsão** | `sessionStorage` | Evitar requisições duplicadas (descartado ao fechar a aba) |

> 💡 O usuário pode apagar 100% de seus dados a qualquer momento clicando em **"Privacidade & LGPD"** no rodapé do site e utilizando o botão **"Limpar Dados Locais"**.

### 3. Localização Atual por GPS com Anonimização Espacial
- O uso do GPS é **estritamente opcional**.
- **Máscara de Privacidade:** As coordenadas obtidas pelo navegador são arredondadas para 2 casas decimais (~1.1 km de raio). Isso impede que a rua ou residência exata do usuário sejam expostas a serviços de geocodificação.
- **Descarte Imediato:** As coordenadas aproximadas são usadas unicamente na requisição pontual para descobrir o município correspondente e são descartadas da memória em seguida. Não há gravação de trajetos ou histórico de deslocamento.

### 4. Sistema de Alertas & Notificações Customizáveis sob a LGPD
- **Opt-in Expresso (Art. 7º, I da LGPD):** Nenhuma notificação é disparada sem o consentimento voluntário e explícito do usuário no navegador.
- **Privacidade Preservada:** Não há coleta de e-mail, telefone, CPF ou login. As notificações operam de forma 100% anônima através da API nativa do navegador e do Service Worker local.
- **Controle Total por Alarme:** O usuário escolhe o horário exato e o tópico específico de cada alarme (Previsão do tempo, O que vestir/rotina, Alertas da Defesa Civil/INMET, Riscos/UV, Notícias locais, etc.).
- **Tolerância e Zero Acúmulo Atrasado:** O sistema não acumula notificações velhas caso o dispositivo seja aberto fora do horário programado.
- **Revogação Instantânea (Opt-out):** O usuário pode pausar, editar ou excluir qualquer alerta com um único clique na Central de Configurações.

### 5. Sanitização Ativa de Conteúdo Externo (Anti-XSS)
- Notícias e conteúdos de terceiros (G1 Meio Ambiente, Agência Brasil/EBC, Wikipédia) passam por sanitização em rotas de API do servidor, removendo tags de script, iframes e atributos perigosos.
- Links externos são restritos ao protocolo `https://` e contam com o atributo de segurança `rel="noopener noreferrer"`.

---

## 🛰️ Fontes de Dados e APIs Oficiais Integradas

O ClimaBR integra um ecossistema de APIs públicas e abertas, sem necessidade de chaves proprietárias ou intermediação de dados privados:

- **[IBGE Localidades & Malhas](https://servicodados.ibge.gov.br/api/docs/localidades):** Nomes, códigos municipais oficiais e centróides geográficos de todos os 5.570 municípios.
- **[Open-Meteo Weather](https://open-meteo.com/):** Modelagem numérica de alta resolução (ECMWF, GFS, ICON) para previsão horária, semanal, radiação UV e vento.
- **[Copernicus CAMS & Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api):** European AQI, concentração de $PM_{2.5}$, $PM_{10}$, ozônio e gases poluentes.
- **[INMET (Instituto Nacional de Meteorologia)](https://apiprevmet3.inmet.gov.br/):** Alertas meteorológicos severos e avisos da Defesa Civil nacional.
- **[CEMADEN & INPE](https://www.gov.br/cemaden/pt-br):** Monitoramento de riscos hidrológicos, deslizamentos e focos de queimadas.
- **[NOAA Climate Prediction Center (CPC)](https://www.cpc.ncep.noaa.gov/):** Índices oceânicos do Pacífico (ENSO / El Niño e La Niña).
- **[RainViewer](https://www.rainviewer.com/api.html):** Mosaico de radar meteorológico ao vivo com histórico de precipitação e projeção de deslocamento.
- **[Wikipédia REST API](https://pt.wikipedia.org/api/rest_v1/):** Resumo enciclopédico oficial, história e dados culturais da cidade.
- **[Agência Brasil (EBC) & G1](https://agenciabrasil.ebc.com.br/):** Feeds jornalísticos com foco em clima, sustentabilidade e cidades.

---

## ⚡ Módulos & Recursos da Aplicação

1. **Dashboard Meteorológico Completo:**
   - Temperatura atual, sensação térmica, umidade, pressão atmosférica e vento com rosa dos ventos.
   - Índice UV com classificação de risco e horários de pico.
   - Qualidade do ar com escala internacional (AQI) e detalhamento de partículas.
   - Horários precisos de nascer e pôr do sol.

2. **Gráfico Interativo de Curva Térmica & Chuva (24 Horas):**
   - Curva suave (SVG) com gradiente térmico e barras de probabilidade de chuva com tooltip dinâmico.

3. **Radar Meteorológico RainViewer ao Vivo:**
   - Mapa interativo (Leaflet) com camada de radar Doppler, controle de reprodução temporal e nível de zoom otimizado para o Brasil.

4. **Painel Agroclimático & Manejo de Solo (FAO-56):**
   - Evapotranspiração de referência ($ET_0$), umidade do solo em diferentes camadas (0-7cm a 28-100cm) e índice de seca SPI.

5. **Modo Litoral & Marés:**
   - Altura de ondas, período marítimo, direção do swell e temperatura da superfície do mar para cidades costeiras.

6. **Batalha do Clima (Comparador de Cidades):**
   - Comparação lado a lado de dois municípios brasileiros avaliando temperatura, umidade, vento e qualidade do ar.

7. **Cápsula do Tempo Histórica:**
   - Consulta climatológica comparativa retrospectiva (como estava o tempo na mesma data há 5, 10, 15, 20 e 30 anos atrás).

8. **PWA (Progressive Web App):**
   - Instalável em dispositivos móveis e desktop, com ícone adaptativo e carregamento offline-first.

9. **Central de Configurações (⚙️):**
   - **Dashboard Modular:** Liga ou desliga qualquer bloco da tela (curva térmica 24h, dicas de rotina, radar Doppler ao vivo, agroclimatologia, modo litoral, anúncios demonstrativos e avisos severos).
   - **Seletor de Temas:** 5 opções dinâmicas (Automático solar, Claro, Escuro, Amanhecer e Anoitecer).
   - **Gestão LGPD:** Reset de padrões e limpeza completa de dados locais em 1 clique.

10. **Sistema de Alertas & Notificações Customizáveis:**
    - O usuário cria alarmes com **horários livres** e **tópicos independentes por alarme** (ex: 07:30 para dicas de vestimenta, 12:00 para previsão do tempo, 18:00 para alertas da Defesa Civil).
    - Monitoramento em tempo real a cada 10 segundos no navegador, com disparo pontual e botão para teste imediato de cada alarme.

---

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estrita para todas as respostas das APIs)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com variáveis semânticas CSS
- **Mapas:** [Leaflet](https://leafletjs.com/) & React-Leaflet
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Hospedagem:** [Vercel](https://vercel.com/) (Edge Network & Serverless Functions)

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ instalado.
- Gerenciador de pacotes `npm` ou `yarn` / `pnpm`.

### Instalação
```bash
# 1. Clone o repositório
git clone https://github.com/GadiegoN/climabr.git

# 2. Acesse o diretório
cd climabr

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra no navegador em [http://localhost:3000](http://localhost:3000).

> ℹ️ **Nota:** O ClimaBR não necessita de chaves de API secretas ou arquivos `.env` para rodar na sua máquina. Todas as APIs integradas operam em endpoints públicos abertos.

---

## 👨‍💻 Autor

Desenvolvido no Brasil por **Gadiego Nogueira**:
- **Website:** [gadiegon.com](https://gadiegon.com)
- **GitHub:** [@GadiegoN](https://github.com/GadiegoN)

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais detalhes.
