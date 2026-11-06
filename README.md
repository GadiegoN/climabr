# ⛅ ClimaBR — Previsão do Tempo para Municípios Brasileiros

Um sistema web moderno, responsivo e de alta performance para consulta meteorológica em tempo real de qualquer município do Brasil, integrando as APIs públicas do **IBGE**, **Open-Meteo**, **Wikipedia** e **INMET**, sem necessidade de tokens ou chaves de acesso.

---

## 🚀 Demonstração das Funcionalidades

- 🏛️ **Seleção Dinâmica por Localidades (IBGE):** Carregamento de estados e municípios ordenados por nome.
- 📍 **Centroide e Coordenadas Geográficas (IBGE Malhas):** Extração precisa de latitude e longitude do município selecionado.
- 🛰️ **Previsão em Tempo Real (Open-Meteo):** Temperatura atual, sensação térmica, umidade relativa, velocidade e direção do vento.
- 📈 **Gráfico Interativo de Curva Térmica e Chuva (24h):** Gráfico SVG nativo em curva suave com área gradiente e barras de probabilidade de chuva, com tooltip interativo.
- ⏰ **Previsão Hora a Hora e Semanal (7 dias):** Carrossel horizontal deslizável com destaque no momento presente ("Agora") e navegação lateral.
- ☀️ **Radiação Solar & Qualidade do Ar:** Índice UV atual com nível de risco e European AQI (qualidade do ar e $PM_{2.5}$).
- 🌅 **Nascer e Pôr do Sol:** Horários exatos locais calculados para o município.
- 📚 **Enciclopédia Municipal (Wikipedia):** Imagem oficial e resumo histórico e geográfico da cidade.
- ⚠️ **Alertas da Defesa Civil (INMET):** Avisos de tempo severo ativos na região.
- 📍 **GPS do Navegador:** Botão "Usar minha localização atual" com reverse geocoding automático.
- 🔗 **Compartilhamento com Link Direto:** URL sincronizada para compartilhamento instantâneo de uma cidade específica.
- 💾 **Histórico Local Persistido:** Salva as últimas cidades pesquisadas no `localStorage`.
- 🎨 **Sistema Dinâmico de Temas:** Claro, Escuro, Amanhecer, Anoitecer e Automático (baseado no horário do sol da cidade).
- 📱 **PWA (Progressive Web App):** Instalável no celular e desktop como aplicativo nativo.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack, SSR, Static Generation)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estrita para todas as APIs)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com variáveis CSS nativas para alternância de temas
- **Ícones:** [Lucide React](https://lucide.dev/)
- **PWA:** `manifest.ts` e `icon.tsx` dinâmicos do Next.js
- **APIs Públicas Integradas:**
  - [IBGE Localidades](https://servicodados.ibge.gov.br/api/docs/localidades)
  - [IBGE Malhas Geográficas](https://servicodados.ibge.gov.br/api/docs/malhas)
  - [Open-Meteo Weather Forecast](https://open-meteo.com/en/docs)
  - [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api)
  - [Wikipedia REST API](https://pt.wikipedia.org/api/rest_v1/)
  - [Agência IBGE Notícias](https://servicodados.ibge.gov.br/api/docs/noticias)
  - [INMET Avisos](https://apiprevmet3.inmet.gov.br/)

---

## 📦 Como Rodar Localmente

1. Clone o repositório ou acesse a pasta do projeto:
   ```bash
   cd climabr
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra no navegador:
   [http://localhost:3000](http://localhost:3000)

---

## 🚀 Como Subir para a Vercel

O projeto está 100% pronto e otimizado para deploy na **Vercel** sem precisar de nenhuma variável de ambiente (`.env`):

### Opção 1: Via GitHub (Recomendado)
1. Suba o código para o seu repositório no GitHub:
   ```bash
   git add .
   git commit -m "feat: ClimaBR com graficos, temas e suporte PWA"
   git push origin main
   ```
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New"** > **"Project"**.
3. Selecione o repositório `climabr`.
4. Clique em **"Deploy"** (as configurações do Next.js serão detectadas automaticamente).

### Opção 2: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 📄 Licença
Distribuído sob a licença MIT.
