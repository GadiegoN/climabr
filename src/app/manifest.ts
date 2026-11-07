import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClimaBR - Previsão do Tempo para Municípios Brasileiros",
    short_name: "ClimaBR",
    description:
      "Consulte a previsão meteorológica em tempo real, curva térmica 24h, radiação UV e dados oficiais de qualquer município do Brasil.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#10b981",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

