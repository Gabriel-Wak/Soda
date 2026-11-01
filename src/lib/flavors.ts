export type FlavorId = "guarana" | "berry" | "solar";

export interface Flavor {
  id: FlavorId;
  name: string;
  /** Ambient glow color (hex, used by three.js) */
  glow: string;
  /** Can body base color */
  can: string;
  /** Label accent color */
  accent: string;
  /** Floating fruit color */
  fruit: string;
  /** Cursive brand line printed on the can */
  script: string;
  /** Small caps line under the script name */
  brand: string;
  /** Line printed across the shoulder of the can */
  top: string;
  /** Antarctica plate, berries and Brazil flag */
  antarctica: boolean;
}

export const FLAVORS: readonly Flavor[] = [
  {
    id: "guarana",
    name: "Guaraná",
    glow: "#0fa968",
    can: "#0e6f39",
    accent: "#2fa863",
    fruit: "#d22027",
    script: "Guaraná",
    brand: "ANTARCTICA",
    top: "ORIGINAL DO BRASIL",
    antarctica: true,
  },
  {
    id: "berry",
    name: "Frutas Silvestres",
    glow: "#9b7bff",
    can: "#2b1660",
    accent: "#c9b8ff",
    fruit: "#7b3ff2",
    script: "Frutas",
    brand: "SILVESTRES",
    top: "EDIÇÃO LIMITADA",
    antarctica: false,
  },
  {
    id: "solar",
    name: "Faísca Solar",
    glow: "#ffa31a",
    can: "#8a4104",
    accent: "#ffd27a",
    fruit: "#ff8a1a",
    script: "Faísca",
    brand: "SOLAR",
    top: "EDIÇÃO LIMITADA",
    antarctica: false,
  },
] as const;

export const SHIFT_MS = 600;
