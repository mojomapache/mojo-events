export type ThemeKey = "raccoon_bbq" | "garden_party" | "fiesta_night" | "backyard_meeting";

export const THEMES: Record<ThemeKey, {
  label: string;
  heroEmoji: string;
  vars: Record<string, string>;
  eventName: { en: string; es: string };
  backgroundImage?: string;
}> = {
  raccoon_bbq: {
    label: "🦝 Raccoon BBQ",
    heroEmoji: "🦝",
    vars: {
      "--bg": "#1F2A24", "--bg-panel": "#26332B", "--bg-card": "#2E3B32", "--bg-card-hover": "#34423A",
      "--cream": "#F4EEDD", "--cream-dim": "#C9C3AF", "--muted": "#93A594",
      "--accent": "#E8A33D", "--accent-dim": "#7A5B25",
      "--clay": "#C9634A", "--clay-dim": "#6B3529",
      "--sage": "#7FA98A", "--sage-dim": "#33473A",
      "--border": "rgba(244,238,221,0.10)", "--border-strong": "rgba(244,238,221,0.20)"
    },
    eventName: { en: "Ana's Backyard BBQ", es: "El Asado de Ana" },
    backgroundImage: "/backgrounds/raccoon-bbq.jpg"
  },
  garden_party: {
    label: "🌿 Garden Party",
    heroEmoji: "🌿",
    vars: {
      "--bg": "#20261F", "--bg-panel": "#293024", "--bg-card": "#2F382A", "--bg-card-hover": "#374231",
      "--cream": "#F2EEE0", "--cream-dim": "#C7C6B4", "--muted": "#8FA083",
      "--accent": "#B8C77A", "--accent-dim": "#4F5A34",
      "--clay": "#D8828C", "--clay-dim": "#5F3A3E",
      "--sage": "#89B08A", "--sage-dim": "#354731",
      "--border": "rgba(242,238,224,0.10)", "--border-strong": "rgba(242,238,224,0.20)"
    },
    eventName: { en: "Ana's Garden Gathering", es: "La Reunión en el Jardín de Ana" }
  },
  fiesta_night: {
    label: "🪅 Fiesta Night",
    heroEmoji: "🪅",
    vars: {
      "--bg": "#231A2E", "--bg-panel": "#2C2138", "--bg-card": "#332841", "--bg-card-hover": "#3C304C",
      "--cream": "#F5EEE6", "--cream-dim": "#CFC2D6", "--muted": "#9C8AA8",
      "--accent": "#E85D75", "--accent-dim": "#5E2536",
      "--clay": "#F0A23D", "--clay-dim": "#6B4A18",
      "--sage": "#8FC7B8", "--sage-dim": "#2E4B44",
      "--border": "rgba(245,238,230,0.10)", "--border-strong": "rgba(245,238,230,0.20)"
    },
    eventName: { en: "Ana's Fiesta Night", es: "La Fiesta de Ana" }
  },
  backyard_meeting: {
    label: "🌳 Backyard Meeting",
    heroEmoji: "🌳",
    vars: {
      "--bg": "#22282A", "--bg-panel": "#2A3234", "--bg-card": "#313B3D", "--bg-card-hover": "#394447",
      "--cream": "#EDEFE8", "--cream-dim": "#C2C7BF", "--muted": "#8D9793",
      "--accent": "#7FB0C7", "--accent-dim": "#2E4A54",
      "--clay": "#C98F5A", "--clay-dim": "#5C4530",
      "--sage": "#8AAE86", "--sage-dim": "#34432F",
      "--border": "rgba(237,239,232,0.10)", "--border-strong": "rgba(237,239,232,0.20)"
    },
    eventName: { en: "Backyard Meeting", es: "Reunión en el Patio" },
    backgroundImage: "/backgrounds/backyard-meeting.jpg"
  }
};
