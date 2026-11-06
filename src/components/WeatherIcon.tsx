import React from "react";
import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  HelpCircle,
  LucideProps,
} from "lucide-react";

interface WeatherIconProps extends LucideProps {
  tipo: "sun" | "moon" | "cloud-sun" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "thunderstorm" | string;
}

export function WeatherIcon({ tipo, className = "w-12 h-12", ...props }: WeatherIconProps) {
  switch (tipo) {
    case "sun":
      return <Sun className={className} {...props} />;
    case "moon":
      return <Moon className={className} {...props} />;
    case "cloud-sun":
      return <CloudSun className={className} {...props} />;
    case "cloud":
      return <Cloud className={className} {...props} />;
    case "fog":
      return <CloudFog className={className} {...props} />;
    case "drizzle":
      return <CloudDrizzle className={className} {...props} />;
    case "rain":
      return <CloudRain className={className} {...props} />;
    case "snow":
      return <CloudSnow className={className} {...props} />;
    case "thunderstorm":
      return <CloudLightning className={className} {...props} />;
    default:
      return <HelpCircle className={className} {...props} />;
  }
}

