/**
 * Mock data for BoviTrack — no database, no backend.
 * All values use a Senegalese livestock context.
 *
 * ARCHITECTURE: the `Animal` entity is the core of the product. Every
 * current and future module attaches to it through a sub-record:
 *   identity      → RFID, QR, breed, sex, age, marks, registration
 *   ownership     → owner, herder, location, contacts
 *   security      → theft status + link to the anti-theft alert module
 *   location      → current zone + risk level (future GPS/LoRa/RFID)
 *   health        → health status, treatments, vaccines (future module)
 *   reproduction  → gestation, parents (future module)
 *   timeline      → chronological events across every module
 * Keeping these as typed sub-records lets future features (sales,
 * documents, etc.) plug in without reshaping the core entity.
 */

/* ------------------------------------------------------------------ */
/* Shared enums & reference lists                                      */
/* ------------------------------------------------------------------ */

export type Sex = "M" | "F";

export const breeds = [
  "Gobra",
  "Ndama",
  "Djakoré",
  "Montbéliarde",
  "Guzerat",
] as const;
export type Breed = (typeof breeds)[number];

export const locations = [
  "Linguère",
  "Dahra",
  "Matam",
  "Kaolack",
  "Thiès",
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

/* ------------------------------------------------------------------ */
/* Status metadata (security / health / location risk / alert)         */
/* ------------------------------------------------------------------ */

export type SecurityStatus = "securise" | "alerte" | "surveillance";

export const securityStatusMeta: Record<
  SecurityStatus,
  { label: string; emoji: string; className: string; ring: string }
> = {
  securise: {
    label: "Sécurisé",
    emoji: "🟢",
    className: "bg-green-50 text-green",
    ring: "ring-green/30",
  },
  alerte: {
    label: "Alerte active",
    emoji: "🔴",
    className: "bg-alert/10 text-alert",
    ring: "ring-alert/50",
  },
  surveillance: {
    label: "À surveiller",
    emoji: "🟡",
    className: "bg-gold/15 text-gold-dark",
    ring: "ring-gold/40",
  },
};

export type HealthStatus = "sain" | "malade" | "surveillance";

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

/* ------------------------------------------------------------------ */
/* Core entity: Animal + sub-records                                   */
/* ------------------------------------------------------------------ */

export type AnimalIdentity = {
  rfid: string;
  qrCode: string; // placeholder value, no image yet
  breed: Breed;
  sex: Sex;
  birthYear: number;
  color: string; // robe / marques distinctives
  registeredAt: string;
};

export type AnimalOwnership = {
  owner: Contact;
  herder: Contact;
  location: Location;
};

export type AnimalSecurity = {
  status: SecurityStatus;
  /** Links to a TheftAlert when status === "alerte". */
  alertId?: string;
  lastKnownLocation: string;
  lastUpdate: string;
};

export type AnimalLocationInfo = {
  zone: string;
  risk: LocationRisk;
  lastUpdate: string;
};

export type AnimalHealthInfo = {
  status: HealthStatus;
  lastTreatment?: string;
  nextVaccine?: string;
};

export type AnimalReproductionInfo = {
  pregnant: boolean;
  expectedBirth?: string;
  motherId?: string;
  fatherId?: string;
};

export type AnimalEventType =
  | "registered"
  | "location"
  | "health"
  | "alert"
  | "movement";

export const eventTypeMeta: Record<
  AnimalEventType,
  { icon: string; tone: string }
> = {
  registered: { icon: "🏷", tone: "bg-green-50 text-green" },
  location: { icon: "📍", tone: "bg-sand text-earth" },
  health: { icon: "💉", tone: "bg-gold/15 text-gold-dark" },
  alert: { icon: "🚨", tone: "bg-alert/10 text-alert" },
  movement: { icon: "🚶", tone: "bg-sand text-earth" },
};

export type AnimalTimelineEvent = {
  id: string;
  type: AnimalEventType;
  time: string;
  label: string;
};

export type Animal = {
  id: string; // e.g. SN-BOV-2026-0001
  name: string;
  emoji: string;
  identity: AnimalIdentity;
  ownership: AnimalOwnership;
  security: AnimalSecurity;
  location: AnimalLocationInfo;
  health: AnimalHealthInfo;
  reproduction: AnimalReproductionInfo;
  timeline: AnimalTimelineEvent[];
};

/* Owner & herder contact directory (reused by alerts for consistency). */
const C = {
  moussaBa: { name: "Moussa Ba", phone: "+221 77 845 19 30", role: "Propriétaire" } as Contact,
  ousmaneSow: { name: "Ousmane Sow", phone: "+221 77 512 04 88", role: "Propriétaire" } as Contact,
  amadouDiallo: { name: "Amadou Diallo", phone: "+221 76 207 41 65", role: "Propriétaire" } as Contact,
  awaNdiaye: { name: "Awa Ndiaye", phone: "+221 78 204 66 17", role: "Propriétaire" } as Contact,
  cheikhFall: { name: "Cheikh Fall", phone: "+221 77 119 52 76", role: "Propriétaire" } as Contact,
  // Herders
  abdouDiop: { name: "Abdou Diop", phone: "+221 77 222 10 09", role: "Berger" } as Contact,
  lamineCisse: { name: "Lamine Cissé", phone: "+221 76 330 71 22", role: "Berger" } as Contact,
  mamadouNdao: { name: "Mamadou Ndao", phone: "+221 76 555 88 12", role: "Berger" } as Contact,
  modouFaye: { name: "Modou Faye", phone: "+221 77 901 38 45", role: "Berger" } as Contact,
  ibrahimaSy: { name: "Ibrahima Sy", phone: "+221 76 488 20 91", role: "Berger" } as Contact,
  saliouKane: { name: "Saliou Kane", phone: "+221 70 612 55 04", role: "Berger" } as Contact,
};

export const animals: Animal[] = [
  {
    id: "SN-BOV-2026-0001",
    name: "Fanta",
    emoji: "🐄",
    identity: {
      rfid: "RFID-SN-784512",
      qrCode: "QR-SN-BOV-2026-0001",
      breed: "Gobra",
      sex: "F",
      birthYear: 2021,
      color: "Robe blanche, bosse marquée",
      registeredAt: "12 jan. 2026",
    },
    ownership: { owner: C.moussaBa, herder: C.abdouDiop, location: "Linguère" },
    security: {
      status: "securise",
      lastKnownLocation: "Linguère — pâturage est",
      lastUpdate: "Il y a 20 min",
    },
    location: { zone: "Linguère — pâturage est", risk: "normale", lastUpdate: "Il y a 20 min" },
    health: { status: "sain", lastTreatment: "Déparasitage — 02 mai 2026", nextVaccine: "PPCB — sept. 2026" },
    reproduction: { pregnant: true, expectedBirth: "Août 2026", fatherId: "SN-BOV-2026-0004" },
    timeline: [
      { id: "f1", type: "registered", time: "12 jan. 2026", label: "Animal enregistré dans le cheptel" },
      { id: "f2", type: "health", time: "02 mai 2026", label: "Déparasitage effectué" },
      { id: "f3", type: "location", time: "Il y a 20 min", label: "Position mise à jour — Linguère" },
    ],
  },
  {
    id: "SN-BOV-2026-0002",
    name: "Samba",
    emoji: "🐂",
    identity: {
      rfid: "RFID-SN-784513",
      qrCode: "QR-SN-BOV-2026-0002",
      breed: "Ndama",
      sex: "M",
      birthYear: 2020,
      color: "Robe fauve, cornes longues",
      registeredAt: "08 fév. 2026",
    },
    ownership: { owner: C.ousmaneSow, herder: C.lamineCisse, location: "Tambacounda" },
    security: {
      status: "alerte",
      alertId: "VOL-2026-014",
      lastKnownLocation: "Tambacounda — piste de Goudiry",
      lastUpdate: "Il y a 3 h",
    },
    location: { zone: "Tambacounda — piste de Goudiry", risk: "alerte", lastUpdate: "Il y a 3 h" },
    health: { status: "surveillance", lastTreatment: "Vaccin fièvre aphteuse — 14 avr. 2026", nextVaccine: "Rappel — oct. 2026" },
    reproduction: { pregnant: false },
    timeline: [
      { id: "s1", type: "registered", time: "08 fév. 2026", label: "Animal enregistré dans le cheptel" },
      { id: "s2", type: "health", time: "14 avr. 2026", label: "Vaccin fièvre aphteuse" },
      { id: "s3", type: "location", time: "Hier", label: "Déplacement vers Goudiry" },
      { id: "s4", type: "alert", time: "Aujourd'hui 06:40", label: "🚨 Signalé manquant — alerte vol VOL-2026-014" },
    ],
  },
  {
    id: "SN-BOV-2026-0003",
    name: "Penda",
    emoji: "🐄",
    identity: {
      rfid: "RFID-SN-784514",
      qrCode: "QR-SN-BOV-2026-0003",
      breed: "Djakoré",
      sex: "F",
      birthYear: 2022,
      color: "Robe pie noire",
      registeredAt: "20 fév. 2026",
    },
    ownership: { owner: C.amadouDiallo, herder: C.mamadouNdao, location: "Kaolack" },
    security: {
      status: "surveillance",
      lastKnownLocation: "Kaolack — parc central",
      lastUpdate: "Il y a 45 min",
    },
    location: { zone: "Kaolack — parc central", risk: "sortie", lastUpdate: "Il y a 45 min" },
    health: { status: "malade", lastTreatment: "Traitement antibiotique — en cours", nextVaccine: "Reportée" },
    reproduction: { pregnant: false },
    timeline: [
      { id: "p1", type: "registered", time: "20 fév. 2026", label: "Animal enregistré dans le cheptel" },
      { id: "p2", type: "health", time: "Il y a 2 jours", label: "Contrôle vétérinaire — traitement débuté" },
      { id: "p3", type: "movement", time: "Il y a 45 min", label: "Sortie de zone détectée — Kaolack" },
    ],
  },
  {
    id: "SN-BOV-2026-0004",
    name: "Demba",
    emoji: "🐂",
    identity: {
      rfid: "RFID-SN-784515",
      qrCode: "QR-SN-BOV-2026-0004",
      breed: "Montbéliarde",
      sex: "M",
      birthYear: 2019,
      color: "Robe pie rouge",
      registeredAt: "05 jan. 2026",
    },
    ownership: { owner: C.awaNdiaye, herder: C.modouFaye, location: "Thiès" },
    security: {
      status: "alerte",
      alertId: "VOL-2026-011",
      lastKnownLocation: "Thiès — marché de Khombole",
      lastUpdate: "Il y a 18 h",
    },
    location: { zone: "Thiès — dernière position connue", risk: "ancienne", lastUpdate: "Il y a 18 h" },
    health: { status: "sain", lastTreatment: "Déparasitage — 10 mars 2026", nextVaccine: "PPCB — sept. 2026" },
    reproduction: { pregnant: false },
    timeline: [
      { id: "d1", type: "registered", time: "05 jan. 2026", label: "Animal enregistré dans le cheptel" },
      { id: "d2", type: "movement", time: "Hier", label: "Déplacement vers le marché de Khombole" },
      { id: "d3", type: "alert", time: "Hier 19:02", label: "🚨 Vol signalé — alerte VOL-2026-011" },
    ],
  },
  {
    id: "SN-BOV-2026-0005",
    name: "Khady",
    emoji: "🐄",
    identity: {
      rfid: "RFID-SN-784516",
      qrCode: "QR-SN-BOV-2026-0005",
      breed: "Gobra",
      sex: "F",
      birthYear: 2023,
      color: "Robe blanche tachetée",
      registeredAt: "18 mars 2026",
    },
    ownership: { owner: C.cheikhFall, herder: C.ibrahimaSy, location: "Linguère" },
    security: {
      status: "securise",
      lastKnownLocation: "Linguère — campement nord",
      lastUpdate: "Il y a 12 min",
    },
    location: { zone: "Linguère — campement nord", risk: "normale", lastUpdate: "Il y a 12 min" },
    health: { status: "sain", lastTreatment: "Aucun", nextVaccine: "PPCB — sept. 2026" },
    reproduction: { pregnant: false },
    timeline: [
      { id: "k1", type: "registered", time: "18 mars 2026", label: "Animal enregistré dans le cheptel" },
      { id: "k2", type: "alert", time: "Il y a 2 jours", label: "Alerte vol — animal retrouvé sain et sauf" },
      { id: "k3", type: "location", time: "Il y a 12 min", label: "Position mise à jour — Linguère" },
    ],
  },
  {
    id: "SN-BOV-2026-0006",
    name: "Yero",
    emoji: "🐂",
    identity: {
      rfid: "RFID-SN-784517",
      qrCode: "QR-SN-BOV-2026-0006",
      breed: "Guzerat",
      sex: "M",
      birthYear: 2021,
      color: "Robe grise, bosse haute",
      registeredAt: "27 jan. 2026",
    },
    ownership: { owner: C.moussaBa, herder: C.saliouKane, location: "Matam" },
    security: {
      status: "alerte",
      alertId: "VOL-2026-013",
      lastKnownLocation: "Matam — abords du fleuve",
      lastUpdate: "Il y a 6 h",
    },
    location: { zone: "Matam — abords du fleuve", risk: "alerte", lastUpdate: "Il y a 6 h" },
    health: { status: "surveillance", lastTreatment: "Vitamines — 28 avr. 2026", nextVaccine: "PPCB — sept. 2026" },
    reproduction: { pregnant: false },
    timeline: [
      { id: "y1", type: "registered", time: "27 jan. 2026", label: "Animal enregistré dans le cheptel" },
      { id: "y2", type: "health", time: "28 avr. 2026", label: "Complément en vitamines" },
      { id: "y3", type: "alert", time: "Aujourd'hui 05:15", label: "🚨 Absent au comptage — alerte VOL-2026-013" },
    ],
  },
];

export function getAnimalById(id: string): Animal | undefined {
  return animals.find((a) => a.id === id);
}

/** Live stats for the herd registry, derived from the registry itself. */
export const herdStats = {
  total: animals.length,
  securises: animals.filter((a) => a.security.status === "securise").length,
  enAlerte: animals.filter((a) => a.security.status === "alerte").length,
  aSurveiller: animals.filter((a) => a.health.status !== "sain").length,
};

/** Current age in years from the birth year (reference year: 2026). */
export function animalAge(birthYear: number): number {
  return 2026 - birthYear;
}

/* ------------------------------------------------------------------ */
/* Dashboard tiles                                                     */
/* ------------------------------------------------------------------ */

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
  badge?: number;
  accent: string;
};

/**
 * Large action tiles shown on the dashboard, in display order.
 * NOTE: "Vol / Alerte" is rendered as a dedicated emergency tile above
 * the grid, so it is intentionally absent here.
 */
export const dashboardActions: DashboardAction[] = [
  { href: "/herd", label: "Mon troupeau", icon: "🐄", accent: "from-green to-green-dark text-white" },
  { href: "/location", label: "Localisation", icon: "📍", accent: "from-white to-sand-dark text-earth" },
  { href: "/care", label: "Soins", icon: "💉", accent: "from-white to-sand-dark text-earth" },
  { href: "/vaccines", label: "Vaccins", icon: "🧪", badge: 12, accent: "from-white to-sand-dark text-earth" },
  { href: "/births", label: "Naissances", icon: "👶", accent: "from-white to-sand-dark text-earth" },
  { href: "/sales", label: "Ventes", icon: "💰", accent: "from-white to-sand-dark text-earth" },
  { href: "/reports", label: "Résultats", icon: "📊", accent: "from-white to-sand-dark text-earth" },
];

/* ------------------------------------------------------------------ */
/* Anti-theft / Vol & Alerte                                           */
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
  nouvelle: { label: "Nouvelle alerte", emoji: "🆕", className: "bg-alert/10 text-alert", dot: "bg-alert" },
  recherche: { label: "Recherche en cours", emoji: "🔎", className: "bg-gold/15 text-gold-dark", dot: "bg-gold" },
  autorites: { label: "Signalée aux autorités", emoji: "👮", className: "bg-earth/10 text-earth", dot: "bg-earth" },
  retrouve: { label: "Retrouvé", emoji: "✅", className: "bg-green-50 text-green", dot: "bg-green" },
  cloturee: { label: "Clôturée", emoji: "📁", className: "bg-earth/10 text-earth/70", dot: "bg-earth/50" },
};

export type AlertEvent = { id: string; time: string; label: string; icon: string };

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
    tag: "RFID-SN-784513",
    status: "recherche",
    reportedAt: "Aujourd'hui · 06:40",
    lastKnownLocation: "Tambacounda — piste de Goudiry",
    lastSeenAgo: "Il y a 3 h",
    owner: C.ousmaneSow,
    herder: C.lamineCisse,
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
    breed: "Guzerat",
    tag: "RFID-SN-784517",
    status: "nouvelle",
    reportedAt: "Aujourd'hui · 05:15",
    lastKnownLocation: "Matam — abords du fleuve",
    lastSeenAgo: "Il y a 6 h",
    owner: C.moussaBa,
    herder: C.saliouKane,
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
    tag: "RFID-SN-784515",
    status: "autorites",
    reportedAt: "Hier · 19:02",
    lastKnownLocation: "Thiès — marché de Khombole",
    lastSeenAgo: "Il y a 18 h",
    owner: C.awaNdiaye,
    herder: C.modouFaye,
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
    tag: "RFID-SN-784516",
    status: "retrouve",
    reportedAt: "Il y a 2 jours",
    lastKnownLocation: "Linguère — campement nord",
    lastSeenAgo: "Retrouvée",
    owner: C.cheikhFall,
    herder: C.ibrahimaSy,
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
/* Localisation — derived from the animal registry (single source)     */
/* ------------------------------------------------------------------ */

export type AnimalLocation = {
  animalId: string;
  name: string;
  emoji: string;
  zone: string;
  risk: LocationRisk;
  lastUpdate: string;
  alertId?: string;
};

export const animalLocations: AnimalLocation[] = animals.map((a) => ({
  animalId: a.id,
  name: a.name,
  emoji: a.emoji,
  zone: a.location.zone,
  risk: a.location.risk,
  lastUpdate: a.location.lastUpdate,
  alertId: a.security.alertId,
}));

/* ------------------------------------------------------------------ */
/* Dashboard tasks                                                     */
/* ------------------------------------------------------------------ */

export type UpcomingTask = { id: string; label: string; due: string; icon: string };

export const upcomingTasks: UpcomingTask[] = [
  { id: "t1", label: "Vaccination PPCB — 12 animaux", due: "Cette semaine", icon: "🧪" },
  { id: "t2", label: "Déparasitage — lot Dahra", due: "Dans 3 jours", icon: "💊" },
  { id: "t3", label: "Contrôle vétérinaire — Penda", due: "Demain", icon: "🩺" },
];
