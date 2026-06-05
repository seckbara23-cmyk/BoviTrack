/**
 * Mock data for Phase 1 — no database, no backend.
 * All values use a Senegalese livestock context.
 */

export type HealthStatus = "sain" | "malade" | "surveillance";
export type Sex = "M" | "F";

export type Animal = {
  id: string; // e.g. SN-BOV-2026-0001
  name: string;
  breed: Breed;
  sex: Sex;
  birthYear: number;
  location: Location;
  owner: string;
  health: HealthStatus;
  weightKg: number;
  emoji: string;
};

export const breeds = ["Gobra", "Ndama", "Djakoré", "Montbéliarde"] as const;
export type Breed = (typeof breeds)[number];

export const locations = [
  "Thiès",
  "Kaolack",
  "Linguère",
  "Matam",
  "Dahra",
  "Tambacounda",
] as const;
export type Location = (typeof locations)[number];

export const owners = [
  "Moussa Ba",
  "Ousmane Sow",
  "Amadou Diallo",
  "Awa Ndiaye",
  "Cheikh Fall",
] as const;

export const animals: Animal[] = [
  {
    id: "SN-BOV-2026-0001",
    name: "Fanta",
    breed: "Gobra",
    sex: "F",
    birthYear: 2021,
    location: "Dahra",
    owner: "Moussa Ba",
    health: "sain",
    weightKg: 312,
    emoji: "🐄",
  },
  {
    id: "SN-BOV-2026-0002",
    name: "Samba",
    breed: "Ndama",
    sex: "M",
    birthYear: 2020,
    location: "Tambacounda",
    owner: "Ousmane Sow",
    health: "surveillance",
    weightKg: 388,
    emoji: "🐂",
  },
  {
    id: "SN-BOV-2026-0003",
    name: "Penda",
    breed: "Djakoré",
    sex: "F",
    birthYear: 2022,
    location: "Kaolack",
    owner: "Amadou Diallo",
    health: "malade",
    weightKg: 274,
    emoji: "🐄",
  },
  {
    id: "SN-BOV-2026-0004",
    name: "Demba",
    breed: "Montbéliarde",
    sex: "M",
    birthYear: 2019,
    location: "Thiès",
    owner: "Awa Ndiaye",
    health: "sain",
    weightKg: 451,
    emoji: "🐂",
  },
  {
    id: "SN-BOV-2026-0005",
    name: "Khady",
    breed: "Gobra",
    sex: "F",
    birthYear: 2023,
    location: "Linguère",
    owner: "Cheikh Fall",
    health: "sain",
    weightKg: 198,
    emoji: "🐄",
  },
  {
    id: "SN-BOV-2026-0006",
    name: "Yero",
    breed: "Ndama",
    sex: "M",
    birthYear: 2021,
    location: "Matam",
    owner: "Moussa Ba",
    health: "surveillance",
    weightKg: 330,
    emoji: "🐂",
  },
];

export const healthMeta: Record<
  HealthStatus,
  { label: string; emoji: string; className: string }
> = {
  sain: {
    label: "En bonne santé",
    emoji: "🟢",
    className: "bg-green-50 text-green",
  },
  surveillance: {
    label: "À surveiller",
    emoji: "🟡",
    className: "bg-gold/15 text-gold-dark",
  },
  malade: {
    label: "Malade",
    emoji: "🔴",
    className: "bg-alert/10 text-alert",
  },
};

/** Headline figures for the dashboard summary cards. */
export const herdSummary = {
  totalAnimaux: 128,
  animauxMalades: 4,
  vaccinationsAFaire: 12,
  alertesSecurite: 2,
};

export type DashboardAction = {
  href: string;
  label: string;
  icon: string;
  /** Optional badge count rendered on the tile. */
  badge?: number;
  /** Tailwind accent classes for the tile. */
  accent: string;
};

/** Large action tiles shown on the dashboard, in display order. */
export const dashboardActions: DashboardAction[] = [
  {
    href: "/herd",
    label: "Mon troupeau",
    icon: "🐄",
    accent: "from-green to-green-dark text-white",
  },
  {
    href: "/care",
    label: "Soins",
    icon: "💉",
    accent: "from-white to-sand-dark text-earth",
  },
  {
    href: "/vaccines",
    label: "Vaccins",
    icon: "🧪",
    badge: 12,
    accent: "from-white to-sand-dark text-earth",
  },
  {
    href: "/births",
    label: "Naissances",
    icon: "👶",
    accent: "from-white to-sand-dark text-earth",
  },
  {
    href: "/location",
    label: "Localisation",
    icon: "📍",
    accent: "from-white to-sand-dark text-earth",
  },
  {
    href: "/alerts",
    label: "Alertes",
    icon: "🚨",
    badge: 2,
    accent: "from-alert to-alert-dark text-white",
  },
  {
    href: "/sales",
    label: "Ventes",
    icon: "💰",
    accent: "from-white to-sand-dark text-earth",
  },
  {
    href: "/reports",
    label: "Résultats",
    icon: "📊",
    accent: "from-white to-sand-dark text-earth",
  },
  {
    href: "/herd/new",
    label: "Ajouter un animal",
    icon: "➕",
    accent: "from-gold to-gold-dark text-earth",
  },
];

export type AlertItem = {
  id: string;
  level: "danger" | "warning";
  title: string;
  detail: string;
  location: Location;
  icon: string;
};

export const alerts: AlertItem[] = [
  {
    id: "a1",
    level: "danger",
    title: "Animal hors zone",
    detail: "SN-BOV-2026-0002 (Samba) détecté hors du parcours habituel.",
    location: "Tambacounda",
    icon: "📍",
  },
  {
    id: "a2",
    level: "warning",
    title: "Foyer sanitaire signalé",
    detail: "Cas suspects de fièvre aphteuse signalés dans la zone.",
    location: "Kaolack",
    icon: "🦠",
  },
];

export type UpcomingTask = {
  id: string;
  label: string;
  due: string;
  icon: string;
};

export const upcomingTasks: UpcomingTask[] = [
  { id: "t1", label: "Vaccination PPCB — 12 animaux", due: "Cette semaine", icon: "🧪" },
  { id: "t2", label: "Déparasitage — lot Dahra", due: "Dans 3 jours", icon: "💊" },
  { id: "t3", label: "Contrôle vétérinaire — Penda", due: "Demain", icon: "🩺" },
];
