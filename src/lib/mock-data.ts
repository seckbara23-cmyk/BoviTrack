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
  /** Physical tag identifier (RFID / QR / boucle) — future integration. */
  tag: string;
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

export type Contact = {
  name: string;
  phone: string;
  role: "Propriétaire" | "Berger" | "Vétérinaire" | "Agent";
};

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
    tag: "RFID-982 0001 4471",
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
    tag: "RFID-982 0002 1180",
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
    tag: "RFID-982 0003 7702",
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
    tag: "RFID-982 0004 5093",
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
    tag: "RFID-982 0005 6614",
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
    tag: "RFID-982 0006 2257",
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
  alertesVol: 2,
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

/**
 * Large action tiles shown on the dashboard, in display order.
 * NOTE: "Vol / Alerte" is intentionally NOT in this list — it is rendered
 * as a dedicated, oversized emergency tile above the grid.
 */
export const dashboardActions: DashboardAction[] = [
  {
    href: "/herd",
    label: "Mon troupeau",
    icon: "🐄",
    accent: "from-green to-green-dark text-white",
  },
  {
    href: "/location",
    label: "Localisation",
    icon: "📍",
    accent: "from-white to-sand-dark text-earth",
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
];

/* ------------------------------------------------------------------ */
/* Anti-theft / Vol & Alerte — priority feature                        */
/* ------------------------------------------------------------------ */

export type AlertStatus =
  | "nouvelle"
  | "recherche"
  | "autorites"
  | "retrouve"
  | "cloturee";

export const alertStatusMeta: Record<
  AlertStatus,
  { label: string; emoji: string; className: string; dot: string }
> = {
  nouvelle: {
    label: "Nouvelle alerte",
    emoji: "🆕",
    className: "bg-alert/10 text-alert",
    dot: "bg-alert",
  },
  recherche: {
    label: "Recherche en cours",
    emoji: "🔎",
    className: "bg-gold/15 text-gold-dark",
    dot: "bg-gold",
  },
  autorites: {
    label: "Signalée aux autorités",
    emoji: "👮",
    className: "bg-earth/10 text-earth",
    dot: "bg-earth",
  },
  retrouve: {
    label: "Retrouvé",
    emoji: "✅",
    className: "bg-green-50 text-green",
    dot: "bg-green",
  },
  cloturee: {
    label: "Clôturée",
    emoji: "📁",
    className: "bg-earth/10 text-earth/70",
    dot: "bg-earth/50",
  },
};

export type AlertEvent = {
  id: string;
  time: string;
  label: string;
  icon: string;
};

export type TheftAlert = {
  id: string;
  animalId: string;
  animalName: string;
  animalEmoji: string;
  breed: Breed;
  tag: string;
  status: AlertStatus;
  reportedAt: string;
  lastKnownLocation: string;
  lastSeenAgo: string;
  owner: Contact;
  herder: Contact;
  timeline: AlertEvent[];
};

export const theftAlerts: TheftAlert[] = [
  {
    id: "VOL-2026-014",
    animalId: "SN-BOV-2026-0002",
    animalName: "Samba",
    animalEmoji: "🐂",
    breed: "Ndama",
    tag: "RFID-982 0002 1180",
    status: "recherche",
    reportedAt: "Aujourd'hui · 06:40",
    lastKnownLocation: "Tambacounda — piste de Goudiry",
    lastSeenAgo: "Il y a 3 h",
    owner: { name: "Ousmane Sow", phone: "+221 77 512 04 88", role: "Propriétaire" },
    herder: { name: "Lamine Cissé", phone: "+221 76 330 71 22", role: "Berger" },
    timeline: [
      { id: "e1", time: "06:40", label: "Animal signalé manquant par le berger", icon: "🚨" },
      { id: "e2", time: "07:10", label: "Alerte créée — recherche lancée", icon: "🔎" },
      { id: "e3", time: "08:25", label: "Dernière position connue enregistrée", icon: "📍" },
    ],
  },
  {
    id: "VOL-2026-013",
    animalId: "SN-BOV-2026-0006",
    animalName: "Yero",
    animalEmoji: "🐂",
    breed: "Ndama",
    tag: "RFID-982 0006 2257",
    status: "nouvelle",
    reportedAt: "Aujourd'hui · 05:15",
    lastKnownLocation: "Matam — abords du fleuve",
    lastSeenAgo: "Il y a 6 h",
    owner: { name: "Moussa Ba", phone: "+221 77 845 19 30", role: "Propriétaire" },
    herder: { name: "Saliou Kane", phone: "+221 70 612 55 04", role: "Berger" },
    timeline: [
      { id: "e1", time: "05:15", label: "Animal absent au comptage du matin", icon: "🚨" },
      { id: "e2", time: "05:20", label: "Alerte créée", icon: "🆕" },
    ],
  },
  {
    id: "VOL-2026-011",
    animalId: "SN-BOV-2026-0004",
    animalName: "Demba",
    animalEmoji: "🐂",
    breed: "Montbéliarde",
    tag: "RFID-982 0004 5093",
    status: "autorites",
    reportedAt: "Hier · 19:02",
    lastKnownLocation: "Thiès — marché de Khombole",
    lastSeenAgo: "Il y a 18 h",
    owner: { name: "Awa Ndiaye", phone: "+221 78 204 66 17", role: "Propriétaire" },
    herder: { name: "Modou Faye", phone: "+221 77 901 38 45", role: "Berger" },
    timeline: [
      { id: "e1", time: "Hier 19:02", label: "Vol signalé par la propriétaire", icon: "🚨" },
      { id: "e2", time: "Hier 19:30", label: "Recherche communautaire lancée", icon: "🔎" },
      { id: "e3", time: "Aujourd'hui 08:00", label: "Plainte déposée à la brigade", icon: "👮" },
    ],
  },
  {
    id: "VOL-2026-009",
    animalId: "SN-BOV-2026-0005",
    animalName: "Khady",
    animalEmoji: "🐄",
    breed: "Gobra",
    tag: "RFID-982 0005 6614",
    status: "retrouve",
    reportedAt: "Il y a 2 jours",
    lastKnownLocation: "Linguère — campement nord",
    lastSeenAgo: "Retrouvée",
    owner: { name: "Cheikh Fall", phone: "+221 77 119 52 76", role: "Propriétaire" },
    herder: { name: "Ibrahima Sy", phone: "+221 76 488 20 91", role: "Berger" },
    timeline: [
      { id: "e1", time: "J-2 14:10", label: "Animal signalé manquant", icon: "🚨" },
      { id: "e2", time: "J-2 16:00", label: "Recherche en cours", icon: "🔎" },
      { id: "e3", time: "J-1 09:45", label: "Animal retrouvé sain et sauf", icon: "✅" },
    ],
  },
];

export function getAlertById(id: string): TheftAlert | undefined {
  return theftAlerts.find((a) => a.id === id);
}

/** Count of alerts that still need attention (not retrouvé / clôturée). */
export const activeAlertCount = theftAlerts.filter(
  (a) => a.status === "nouvelle" || a.status === "recherche" || a.status === "autorites",
).length;

/* ------------------------------------------------------------------ */
/* Localisation — mock position cards with risk status                 */
/* ------------------------------------------------------------------ */

export type LocationRisk = "normale" | "sortie" | "ancienne" | "alerte";

export const locationRiskMeta: Record<
  LocationRisk,
  { label: string; emoji: string; className: string; ring: string }
> = {
  normale: {
    label: "Zone normale",
    emoji: "🟢",
    className: "bg-green-50 text-green",
    ring: "ring-green/30",
  },
  sortie: {
    label: "Sorti de zone",
    emoji: "🟠",
    className: "bg-gold/15 text-gold-dark",
    ring: "ring-gold/40",
  },
  ancienne: {
    label: "Position ancienne",
    emoji: "⏳",
    className: "bg-earth/10 text-earth",
    ring: "ring-earth/30",
  },
  alerte: {
    label: "Alerte active",
    emoji: "🚨",
    className: "bg-alert/10 text-alert",
    ring: "ring-alert/50",
  },
};

export type AnimalLocation = {
  animalId: string;
  name: string;
  emoji: string;
  zone: string;
  risk: LocationRisk;
  lastUpdate: string;
  /** Linked theft alert id, when risk === "alerte". */
  alertId?: string;
};

export const animalLocations: AnimalLocation[] = [
  {
    animalId: "SN-BOV-2026-0001",
    name: "Fanta",
    emoji: "🐄",
    zone: "Dahra — pâturage est",
    risk: "normale",
    lastUpdate: "Il y a 20 min",
  },
  {
    animalId: "SN-BOV-2026-0002",
    name: "Samba",
    emoji: "🐂",
    zone: "Tambacounda — piste de Goudiry",
    risk: "alerte",
    lastUpdate: "Il y a 3 h",
    alertId: "VOL-2026-014",
  },
  {
    animalId: "SN-BOV-2026-0006",
    name: "Yero",
    emoji: "🐂",
    zone: "Matam — abords du fleuve",
    risk: "alerte",
    lastUpdate: "Il y a 6 h",
    alertId: "VOL-2026-013",
  },
  {
    animalId: "SN-BOV-2026-0003",
    name: "Penda",
    emoji: "🐄",
    zone: "Kaolack — parc central",
    risk: "sortie",
    lastUpdate: "Il y a 45 min",
  },
  {
    animalId: "SN-BOV-2026-0004",
    name: "Demba",
    emoji: "🐂",
    zone: "Thiès — dernière position connue",
    risk: "ancienne",
    lastUpdate: "Il y a 18 h",
  },
  {
    animalId: "SN-BOV-2026-0005",
    name: "Khady",
    emoji: "🐄",
    zone: "Linguère — campement nord",
    risk: "normale",
    lastUpdate: "Il y a 12 min",
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
