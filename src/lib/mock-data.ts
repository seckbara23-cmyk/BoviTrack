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
  role: "Propriétaire" | "Berger" | "Vétérinaire" | "Agent" | "Vendeur" | "Acheteur";
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
/* Santé & Vaccins — Phase 3 (attached to the Animal entity)           */
/* ------------------------------------------------------------------ */

/** Vets & field agents who deliver care and vaccinations. */
const V = {
  drAwa: { name: "Dr Awa Ndiaye", phone: "+221 77 640 22 18", role: "Vétérinaire" } as Contact,
  drCheikh: { name: "Dr Cheikh Fall", phone: "+221 78 911 47 65", role: "Vétérinaire" } as Contact,
  agentOusmane: { name: "Ousmane Sow", phone: "+221 77 512 04 88", role: "Agent" } as Contact,
  agentAmadou: { name: "Amadou Diallo", phone: "+221 76 207 41 65", role: "Agent" } as Contact,
};

/* ---- Care / Soins ---- */

export type CareStatus = "a_faire" | "en_cours" | "termine" | "urgent" | "suivi";

export const careStatusMeta: Record<
  CareStatus,
  { label: string; emoji: string; className: string }
> = {
  a_faire: { label: "À faire", emoji: "📋", className: "bg-sand-dark text-earth" },
  en_cours: { label: "En cours", emoji: "💊", className: "bg-gold/15 text-gold-dark" },
  termine: { label: "Terminé", emoji: "✅", className: "bg-green-50 text-green" },
  urgent: { label: "Urgent", emoji: "🚨", className: "bg-alert/10 text-alert" },
  suivi: { label: "Suivi requis", emoji: "🔁", className: "bg-gold/15 text-gold-dark" },
};

export type CareRecord = {
  id: string; // SOIN-2026-001
  animalId: string;
  category: string; // Fièvre, Boiterie, Plaie…
  icon: string;
  reason: string; // diagnosis / reason
  symptoms: string[];
  treatment: string;
  vet: Contact;
  date: string;
  status: CareStatus;
  followUp?: string;
  documents?: string[];
};

export const careRecords: CareRecord[] = [
  {
    id: "SOIN-2026-001",
    animalId: "SN-BOV-2026-0003",
    category: "Infection",
    icon: "🤒",
    reason: "Infection respiratoire",
    symptoms: ["Fièvre", "Toux", "Perte d'appétit"],
    treatment: "Antibiotique (5 jours) + repos",
    vet: V.drAwa,
    date: "Aujourd'hui · 08:30",
    status: "urgent",
    followUp: "Contrôle de la température dans 3 jours.",
    documents: ["Ordonnance", "Analyse"],
  },
  {
    id: "SOIN-2026-002",
    animalId: "SN-BOV-2026-0002",
    category: "Boiterie",
    icon: "🦵",
    reason: "Boiterie patte avant droite",
    symptoms: ["Boiterie", "Gonflement léger"],
    treatment: "Anti-inflammatoire + repos 1 semaine",
    vet: V.drCheikh,
    date: "02 juin 2026",
    status: "en_cours",
    followUp: "Réexaminer après 7 jours de repos.",
  },
  {
    id: "SOIN-2026-003",
    animalId: "SN-BOV-2026-0006",
    category: "Plaie",
    icon: "🩹",
    reason: "Plaie ouverte au flanc",
    symptoms: ["Plaie", "Saignement léger"],
    treatment: "Désinfection + pansement",
    vet: V.drAwa,
    date: "01 juin 2026",
    status: "suivi",
    followUp: "Changer le pansement tous les 2 jours.",
  },
  {
    id: "SOIN-2026-004",
    animalId: "SN-BOV-2026-0001",
    category: "Suivi gestation",
    icon: "🤰",
    reason: "Suivi de gestation",
    symptoms: [],
    treatment: "Contrôle prénatal + complément minéral",
    vet: V.drCheikh,
    date: "08 juin 2026",
    status: "a_faire",
    followUp: "Examen prénatal programmé.",
  },
  {
    id: "SOIN-2026-005",
    animalId: "SN-BOV-2026-0004",
    category: "Parasites",
    icon: "🐛",
    reason: "Parasites externes (tiques)",
    symptoms: ["Tiques", "Démangeaisons"],
    treatment: "Traitement acaricide",
    vet: V.agentOusmane,
    date: "20 mai 2026",
    status: "termine",
  },
  {
    id: "SOIN-2026-006",
    animalId: "SN-BOV-2026-0005",
    category: "Fièvre",
    icon: "🌡️",
    reason: "Fièvre légère",
    symptoms: ["Fièvre"],
    treatment: "Antipyrétique + hydratation",
    vet: V.drAwa,
    date: "15 mai 2026",
    status: "termine",
  },
  {
    id: "SOIN-2026-007",
    animalId: "SN-BOV-2026-0003",
    category: "Infection",
    icon: "🤒",
    reason: "Suivi de l'infection respiratoire",
    symptoms: ["Fièvre résiduelle"],
    treatment: "Poursuite antibiotique",
    vet: V.drCheikh,
    date: "Aujourd'hui · 10:15",
    status: "suivi",
    followUp: "Arrêt du traitement si température normale.",
  },
  {
    id: "SOIN-2026-008",
    animalId: "SN-BOV-2026-0005",
    category: "Parasites",
    icon: "🐛",
    reason: "Parasites externes",
    symptoms: ["Tiques"],
    treatment: "Traitement acaricide à programmer",
    vet: V.agentAmadou,
    date: "10 juin 2026",
    status: "a_faire",
  },
];

export function getCareById(id: string): CareRecord | undefined {
  return careRecords.find((c) => c.id === id);
}

export function getCareByAnimal(animalId: string): CareRecord[] {
  return careRecords.filter((c) => c.animalId === animalId);
}

export const careKpis = {
  animauxMalades: new Set(
    careRecords
      .filter((c) => c.status === "urgent" || c.status === "en_cours")
      .map((c) => c.animalId),
  ).size,
  aujourdhui: careRecords.filter((c) => c.date.includes("Aujourd'hui")).length,
  enCours: careRecords.filter(
    (c) => c.status === "en_cours" || c.status === "suivi",
  ).length,
  vetAAppeler: careRecords.filter((c) => c.status === "urgent").length,
};

/* ---- Vaccines / Vaccins ---- */

export type VaccineStatus = "a_faire" | "en_retard" | "fait" | "programme";

export const vaccineStatusMeta: Record<
  VaccineStatus,
  { label: string; emoji: string; className: string }
> = {
  a_faire: { label: "À faire", emoji: "📋", className: "bg-gold/15 text-gold-dark" },
  en_retard: { label: "En retard", emoji: "⏰", className: "bg-alert/10 text-alert" },
  fait: { label: "Fait", emoji: "✅", className: "bg-green-50 text-green" },
  programme: { label: "Programmé", emoji: "📅", className: "bg-sand-dark text-earth" },
};

export type VaccineRecord = {
  id: string; // VAC-2026-001
  animalId: string;
  name: string;
  icon: string;
  dueDate: string; // planned date
  doneDate?: string; // actual date if done
  agent: Contact;
  batchNumber?: string;
  nextDose?: string;
  notes?: string;
  status: VaccineStatus;
  location: Location;
};

export const vaccineRecords: VaccineRecord[] = [
  {
    id: "VAC-2026-001",
    animalId: "SN-BOV-2026-0001",
    name: "Vaccin PPCB",
    icon: "🧪",
    dueDate: "Sept. 2026",
    agent: V.drAwa,
    nextDose: "Sept. 2027",
    notes: "Campagne annuelle de péripneumonie.",
    status: "programme",
    location: "Linguère",
  },
  {
    id: "VAC-2026-002",
    animalId: "SN-BOV-2026-0002",
    name: "Vaccin pasteurellose",
    icon: "💉",
    dueDate: "20 mai 2026",
    agent: V.drCheikh,
    notes: "Rappel non effectué — à régulariser.",
    status: "en_retard",
    location: "Tambacounda",
  },
  {
    id: "VAC-2026-003",
    animalId: "SN-BOV-2026-0003",
    name: "Vaccin PPCB",
    icon: "🧪",
    dueDate: "Cette semaine",
    agent: V.agentAmadou,
    status: "a_faire",
    location: "Kaolack",
  },
  {
    id: "VAC-2026-004",
    animalId: "SN-BOV-2026-0004",
    name: "Déparasitage",
    icon: "💊",
    dueDate: "10 mars 2026",
    doneDate: "10 mars 2026",
    agent: V.agentOusmane,
    batchNumber: "LOT-DEP-2026-B07",
    nextDose: "Sept. 2026",
    status: "fait",
    location: "Thiès",
  },
  {
    id: "VAC-2026-005",
    animalId: "SN-BOV-2026-0005",
    name: "Vaccin PPCB",
    icon: "🧪",
    dueDate: "18 mars 2026",
    doneDate: "18 mars 2026",
    agent: V.drAwa,
    batchNumber: "LOT-PPCB-2026-A14",
    nextDose: "Sept. 2026",
    status: "fait",
    location: "Linguère",
  },
  {
    id: "VAC-2026-006",
    animalId: "SN-BOV-2026-0006",
    name: "Rappel annuel (fièvre aphteuse)",
    icon: "💉",
    dueDate: "01 juin 2026",
    agent: V.drCheikh,
    notes: "Rappel en retard — priorité haute.",
    status: "en_retard",
    location: "Matam",
  },
  {
    id: "VAC-2026-007",
    animalId: "SN-BOV-2026-0001",
    name: "Déparasitage",
    icon: "💊",
    dueDate: "02 mai 2026",
    doneDate: "02 mai 2026",
    agent: V.agentOusmane,
    batchNumber: "LOT-DEP-2026-B07",
    nextDose: "Nov. 2026",
    status: "fait",
    location: "Linguère",
  },
  {
    id: "VAC-2026-008",
    animalId: "SN-BOV-2026-0002",
    name: "Vaccin PPCB",
    icon: "🧪",
    dueDate: "Cette semaine",
    agent: V.agentAmadou,
    status: "a_faire",
    location: "Tambacounda",
  },
  {
    id: "VAC-2026-009",
    animalId: "SN-BOV-2026-0003",
    name: "Vaccin pasteurellose",
    icon: "💉",
    dueDate: "Juillet 2026",
    agent: V.drAwa,
    status: "programme",
    location: "Kaolack",
  },
  {
    id: "VAC-2026-010",
    animalId: "SN-BOV-2026-0004",
    name: "Rappel annuel (fièvre aphteuse)",
    icon: "💉",
    dueDate: "Sept. 2026",
    agent: V.drCheikh,
    status: "a_faire",
    location: "Thiès",
  },
];

export function getVaccineById(id: string): VaccineRecord | undefined {
  return vaccineRecords.find((v) => v.id === id);
}

export function getVaccinesByAnimal(animalId: string): VaccineRecord[] {
  return vaccineRecords.filter((v) => v.animalId === animalId);
}

export const vaccineKpis = {
  aFaire: vaccineRecords.filter((v) => v.status === "a_faire").length,
  enRetard: vaccineRecords.filter((v) => v.status === "en_retard").length,
  cetteSemaine: vaccineRecords.filter((v) => v.dueDate.includes("Cette semaine"))
    .length,
  aJour: vaccineRecords.filter((v) => v.status === "fait").length,
};

/** Vaccinations still pending attention (à faire + en retard). */
export const vaccinationsPending = vaccineKpis.aFaire + vaccineKpis.enRetard;

/* ------------------------------------------------------------------ */
/* Reproduction & Naissances — Phase 4 (attached to the Animal entity) */
/* ------------------------------------------------------------------ */

/* ---- Reproduction / Breeding ---- */

export type BreedingStatus =
  | "a_confirmer"
  | "gestation"
  | "a_surveiller"
  | "mise_bas_proche"
  | "terminee"
  | "echec";

export const breedingStatusMeta: Record<
  BreedingStatus,
  { label: string; emoji: string; className: string }
> = {
  a_confirmer: { label: "À confirmer", emoji: "🔎", className: "bg-sand-dark text-earth" },
  gestation: { label: "Gestation", emoji: "🤰", className: "bg-green-50 text-green" },
  a_surveiller: { label: "À surveiller", emoji: "⚠️", className: "bg-gold/15 text-gold-dark" },
  mise_bas_proche: { label: "Mise bas proche", emoji: "🍼", className: "bg-gold/15 text-gold-dark" },
  terminee: { label: "Terminée", emoji: "✅", className: "bg-green-50 text-green" },
  echec: { label: "Échec", emoji: "❌", className: "bg-alert/10 text-alert" },
};

export type BreedingMethod = "Saillie naturelle" | "Insémination";

export type BreedingRecord = {
  id: string; // REPRO-2026-001
  femaleId: string;
  femaleName: string;
  femaleBreed: Breed;
  fatherId?: string; // herd male, if known
  bullName?: string; // external bull, if not in the herd
  method: BreedingMethod;
  matingDate: string;
  status: BreedingStatus;
  expectedBirth?: string;
  overdue?: boolean;
  followUp?: string;
  vet: Contact;
  ownerName: string;
  herderName: string;
  location: Location;
  timeline: { id: string; time: string; label: string; icon: string }[];
};

export const breedingRecords: BreedingRecord[] = [
  {
    id: "REPRO-2026-001",
    femaleId: "SN-BOV-2026-0001",
    femaleName: "Fanta",
    femaleBreed: "Gobra",
    fatherId: "SN-BOV-2026-0004",
    method: "Insémination",
    matingDate: "Nov. 2025",
    status: "gestation",
    expectedBirth: "Août 2026",
    followUp: "Suivi mensuel — gestation normale.",
    vet: V.drCheikh,
    ownerName: "Moussa Ba",
    herderName: "Abdou Diop",
    location: "Linguère",
    timeline: [
      { id: "r1", time: "Nov. 2025", label: "Reproduction enregistrée (insémination)", icon: "📝" },
      { id: "r2", time: "Jan. 2026", label: "Gestation confirmée", icon: "🤰" },
      { id: "r3", time: "Avr. 2026", label: "Suivi vétérinaire — RAS", icon: "🩺" },
      { id: "r4", time: "Août 2026", label: "Mise bas prévue", icon: "🍼" },
    ],
  },
  {
    id: "REPRO-2026-002",
    femaleId: "SN-BOV-2026-0007",
    femaleName: "Aïssata",
    femaleBreed: "Ndama",
    fatherId: "SN-BOV-2026-0002",
    method: "Saillie naturelle",
    matingDate: "Sept. 2025",
    status: "mise_bas_proche",
    expectedBirth: "Juin 2026",
    overdue: true,
    followUp: "Mise bas imminente — surveiller jour et nuit.",
    vet: V.drAwa,
    ownerName: "Ousmane Sow",
    herderName: "Lamine Cissé",
    location: "Dahra",
    timeline: [
      { id: "r1", time: "Sept. 2025", label: "Reproduction enregistrée (saillie)", icon: "📝" },
      { id: "r2", time: "Nov. 2025", label: "Gestation confirmée", icon: "🤰" },
      { id: "r3", time: "Mai 2026", label: "Suivi vétérinaire — mise bas proche", icon: "🩺" },
    ],
  },
  {
    id: "REPRO-2026-003",
    femaleId: "SN-BOV-2026-0008",
    femaleName: "Maïmouna",
    femaleBreed: "Montbéliarde",
    bullName: "Taureau Montbéliard (station)",
    method: "Insémination",
    matingDate: "Jan. 2026",
    status: "a_surveiller",
    expectedBirth: "Oct. 2026",
    followUp: "Amaigrissement léger — renforcer l'alimentation.",
    vet: V.drCheikh,
    ownerName: "Awa Ndiaye",
    herderName: "Modou Faye",
    location: "Thiès",
    timeline: [
      { id: "r1", time: "Jan. 2026", label: "Reproduction enregistrée (insémination)", icon: "📝" },
      { id: "r2", time: "Mars 2026", label: "Gestation confirmée", icon: "🤰" },
      { id: "r3", time: "Mai 2026", label: "Suivi vétérinaire — à surveiller", icon: "🩺" },
    ],
  },
  {
    id: "REPRO-2026-004",
    femaleId: "SN-BOV-2026-0003",
    femaleName: "Penda",
    femaleBreed: "Djakoré",
    bullName: "Taureau Djakoré communautaire",
    method: "Saillie naturelle",
    matingDate: "Mars 2026",
    status: "a_confirmer",
    vet: V.drAwa,
    ownerName: "Amadou Diallo",
    herderName: "Mamadou Ndao",
    location: "Kaolack",
    timeline: [
      { id: "r1", time: "Mars 2026", label: "Reproduction enregistrée (saillie)", icon: "📝" },
      { id: "r2", time: "Avr. 2026", label: "Diagnostic de gestation à réaliser", icon: "🔎" },
    ],
  },
  {
    id: "REPRO-2026-005",
    femaleId: "SN-BOV-2026-0009",
    femaleName: "Bineta",
    femaleBreed: "Guzerat",
    fatherId: "SN-BOV-2026-0006",
    method: "Saillie naturelle",
    matingDate: "Sept. 2025",
    status: "terminee",
    expectedBirth: "Juin 2026",
    followUp: "Mise bas réussie — veau enregistré.",
    vet: V.agentAmadou,
    ownerName: "Moussa Ba",
    herderName: "Saliou Kane",
    location: "Matam",
    timeline: [
      { id: "r1", time: "Sept. 2025", label: "Reproduction enregistrée (saillie)", icon: "📝" },
      { id: "r2", time: "Nov. 2025", label: "Gestation confirmée", icon: "🤰" },
      { id: "r3", time: "02 juin 2026", label: "Mise bas — veau vivant (NAIS-2026-001)", icon: "👶" },
      { id: "r4", time: "02 juin 2026", label: "Reproduction terminée", icon: "✅" },
    ],
  },
  {
    id: "REPRO-2026-006",
    femaleId: "SN-BOV-2026-0005",
    femaleName: "Khady",
    femaleBreed: "Gobra",
    bullName: "Taureau Gobra communautaire",
    method: "Saillie naturelle",
    matingDate: "Fév. 2026",
    status: "echec",
    followUp: "Gestation non confirmée — reprogrammer une saillie.",
    vet: V.drAwa,
    ownerName: "Cheikh Fall",
    herderName: "Ibrahima Sy",
    location: "Linguère",
    timeline: [
      { id: "r1", time: "Fév. 2026", label: "Reproduction enregistrée (saillie)", icon: "📝" },
      { id: "r2", time: "Avr. 2026", label: "Diagnostic négatif — échec", icon: "❌" },
    ],
  },
  {
    id: "REPRO-2026-007",
    femaleId: "SN-BOV-2026-0008",
    femaleName: "Maïmouna",
    femaleBreed: "Montbéliarde",
    bullName: "Taureau Montbéliard (station)",
    method: "Insémination",
    matingDate: "Août 2025",
    status: "terminee",
    expectedBirth: "Mai 2026",
    followUp: "Mise bas réussie — veau enregistré.",
    vet: V.agentOusmane,
    ownerName: "Awa Ndiaye",
    herderName: "Modou Faye",
    location: "Thiès",
    timeline: [
      { id: "r1", time: "Août 2025", label: "Reproduction enregistrée (insémination)", icon: "📝" },
      { id: "r2", time: "Oct. 2025", label: "Gestation confirmée", icon: "🤰" },
      { id: "r3", time: "20 mai 2026", label: "Mise bas — veau vivant (NAIS-2026-002)", icon: "👶" },
      { id: "r4", time: "20 mai 2026", label: "Reproduction terminée", icon: "✅" },
    ],
  },
  {
    id: "REPRO-2026-008",
    femaleId: "SN-BOV-2026-0010",
    femaleName: "Coumba",
    femaleBreed: "Djakoré",
    fatherId: "SN-BOV-2026-0002",
    method: "Saillie naturelle",
    matingDate: "Fév. 2026",
    status: "gestation",
    expectedBirth: "Nov. 2026",
    followUp: "Gestation confirmée — suivi normal.",
    vet: V.drCheikh,
    ownerName: "Amadou Diallo",
    herderName: "Mamadou Ndao",
    location: "Kaolack",
    timeline: [
      { id: "r1", time: "Fév. 2026", label: "Reproduction enregistrée (saillie)", icon: "📝" },
      { id: "r2", time: "Avr. 2026", label: "Gestation confirmée", icon: "🤰" },
    ],
  },
];

export function getBreedingById(id: string): BreedingRecord | undefined {
  return breedingRecords.find((b) => b.id === id);
}

export function getBreedingByFemale(animalId: string): BreedingRecord[] {
  return breedingRecords.filter((b) => b.femaleId === animalId);
}

export function getBreedingByFather(animalId: string): BreedingRecord[] {
  return breedingRecords.filter((b) => b.fatherId === animalId);
}

const breedingActive = (s: BreedingStatus) =>
  s === "gestation" || s === "a_surveiller" || s === "mise_bas_proche";

export const breedingKpis = {
  gestationsEnCours: breedingRecords.filter((b) => b.status === "gestation").length,
  misesBasPrevues: breedingRecords.filter(
    (b) => breedingActive(b.status) && b.expectedBirth,
  ).length,
  aSurveiller: breedingRecords.filter(
    (b) => b.status === "a_surveiller" || b.status === "mise_bas_proche",
  ).length,
  retards: breedingRecords.filter((b) => b.overdue).length,
};

/* ---- Naissances / Births ---- */

export type BirthStatus = "a_enregistrer" | "enregistre" | "suivi_requis" | "mort_ne";

export const birthStatusMeta: Record<
  BirthStatus,
  { label: string; emoji: string; className: string }
> = {
  a_enregistrer: { label: "À enregistrer", emoji: "📋", className: "bg-gold/15 text-gold-dark" },
  enregistre: { label: "Enregistré", emoji: "✅", className: "bg-green-50 text-green" },
  suivi_requis: { label: "Suivi requis", emoji: "🔁", className: "bg-gold/15 text-gold-dark" },
  mort_ne: { label: "Mort-né", emoji: "🔴", className: "bg-alert/10 text-alert" },
};

export type BirthRecord = {
  id: string; // NAIS-2026-001
  calfId?: string; // SN-BOV-2026-1001 (none if mort-né / not yet registered)
  calfName?: string;
  motherId: string;
  motherName: string;
  fatherId?: string;
  fatherName?: string;
  birthDate: string;
  sex: Sex;
  breed: Breed;
  location: Location;
  ownerName: string;
  herderName: string;
  status: BirthStatus;
  healthNote: string;
  breedingId?: string;
  icon: string;
};

export const birthRecords: BirthRecord[] = [
  {
    id: "NAIS-2026-001",
    calfId: "SN-BOV-2026-1001",
    calfName: "Sira",
    motherId: "SN-BOV-2026-0009",
    motherName: "Bineta",
    fatherId: "SN-BOV-2026-0006",
    fatherName: "Yero",
    birthDate: "02 juin 2026",
    sex: "F",
    breed: "Guzerat",
    location: "Matam",
    ownerName: "Moussa Ba",
    herderName: "Saliou Kane",
    status: "enregistre",
    healthNote: "Veau vivant, en bonne santé.",
    breedingId: "REPRO-2026-005",
    icon: "🐮",
  },
  {
    id: "NAIS-2026-002",
    calfId: "SN-BOV-2026-1002",
    calfName: "Modou",
    motherId: "SN-BOV-2026-0008",
    motherName: "Maïmouna",
    fatherName: "Taureau Montbéliard (station)",
    birthDate: "20 mai 2026",
    sex: "M",
    breed: "Montbéliarde",
    location: "Thiès",
    ownerName: "Awa Ndiaye",
    herderName: "Modou Faye",
    status: "enregistre",
    healthNote: "Veau vivant, bon poids de naissance.",
    breedingId: "REPRO-2026-007",
    icon: "🐮",
  },
  {
    id: "NAIS-2026-003",
    calfName: "Fatou",
    motherId: "SN-BOV-2026-0005",
    motherName: "Khady",
    fatherName: "Taureau Gobra communautaire",
    birthDate: "Cette semaine",
    sex: "F",
    breed: "Gobra",
    location: "Linguère",
    ownerName: "Cheikh Fall",
    herderName: "Ibrahima Sy",
    status: "a_enregistrer",
    healthNote: "Naissance signalée — fiche à compléter.",
    icon: "👶",
  },
  {
    id: "NAIS-2026-004",
    calfId: "SN-BOV-2026-1004",
    calfName: "Pathé",
    motherId: "SN-BOV-2026-0001",
    motherName: "Fanta",
    fatherId: "SN-BOV-2026-0004",
    fatherName: "Demba",
    birthDate: "Jan. 2025",
    sex: "M",
    breed: "Gobra",
    location: "Linguère",
    ownerName: "Moussa Ba",
    herderName: "Abdou Diop",
    status: "enregistre",
    healthNote: "Veau sevré, en bonne santé.",
    icon: "🐮",
  },
  {
    id: "NAIS-2026-005",
    motherId: "SN-BOV-2026-0003",
    motherName: "Penda",
    fatherName: "Taureau Djakoré communautaire",
    birthDate: "15 mai 2026",
    sex: "M",
    breed: "Djakoré",
    location: "Kaolack",
    ownerName: "Amadou Diallo",
    herderName: "Mamadou Ndao",
    status: "mort_ne",
    healthNote: "Veau mort-né — suivi sanitaire de la mère recommandé.",
    icon: "💔",
  },
  {
    id: "NAIS-2026-006",
    calfId: "SN-BOV-2026-1006",
    calfName: "Awa",
    motherId: "SN-BOV-2026-0007",
    motherName: "Aïssata",
    fatherId: "SN-BOV-2026-0002",
    fatherName: "Samba",
    birthDate: "Cette semaine",
    sex: "F",
    breed: "Ndama",
    location: "Dahra",
    ownerName: "Ousmane Sow",
    herderName: "Lamine Cissé",
    status: "suivi_requis",
    healthNote: "Veau faible — surveillance rapprochée nécessaire.",
    breedingId: "REPRO-2026-002",
    icon: "🐮",
  },
];

export function getBirthById(id: string): BirthRecord | undefined {
  return birthRecords.find((b) => b.id === id);
}

export function getBirthsByMother(animalId: string): BirthRecord[] {
  return birthRecords.filter((b) => b.motherId === animalId);
}

export function getBirthsByFather(animalId: string): BirthRecord[] {
  return birthRecords.filter((b) => b.fatherId === animalId);
}

export const birthKpis = {
  ceMois: birthRecords.filter(
    (b) => b.birthDate.includes("juin") || b.birthDate.includes("Cette semaine"),
  ).length,
  veauxVivants: birthRecords.filter((b) => b.status !== "mort_ne" && b.calfName).length,
  aEnregistrer: birthRecords.filter((b) => b.status === "a_enregistrer").length,
  suiviMere: birthRecords.filter(
    (b) => b.status === "suivi_requis" || b.status === "mort_ne",
  ).length,
};

/* ------------------------------------------------------------------ */
/* Ventes & Transferts — Phase 5 (attached to the Animal entity)       */
/* ------------------------------------------------------------------ */

/** Format an FCFA amount with thin spaces, e.g. 375000 -> "375 000 FCFA". */
export function formatFcfa(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export type SaleStatus =
  | "negociation"
  | "confirmee"
  | "paiement_attente"
  | "transfert_attente"
  | "transfere"
  | "annule";

export const saleStatusMeta: Record<
  SaleStatus,
  { label: string; emoji: string; className: string }
> = {
  negociation: { label: "En négociation", emoji: "🤝", className: "bg-gold/15 text-gold-dark" },
  confirmee: { label: "Vente confirmée", emoji: "📝", className: "bg-green-50 text-green" },
  paiement_attente: { label: "Paiement en attente", emoji: "💸", className: "bg-alert/10 text-alert" },
  transfert_attente: { label: "Transfert en attente", emoji: "🔄", className: "bg-gold/15 text-gold-dark" },
  transfere: { label: "Transféré", emoji: "✅", className: "bg-green-50 text-green" },
  annule: { label: "Annulé", emoji: "❌", className: "bg-alert/10 text-alert" },
};

/* Buyers (sellers reuse existing owner contacts via the C directory). */
const B = {
  fatouDiop: { name: "Fatou Diop", phone: "+221 77 333 21 09", role: "Acheteur" } as Contact,
  ibrahimaSarr: { name: "Ibrahima Sarr", phone: "+221 76 744 55 80", role: "Acheteur" } as Contact,
  moussaBa: { name: "Moussa Ba", phone: "+221 77 845 19 30", role: "Acheteur" } as Contact,
  awaNdiaye: { name: "Awa Ndiaye", phone: "+221 78 204 66 17", role: "Acheteur" } as Contact,
  cheikhFall: { name: "Cheikh Fall", phone: "+221 77 119 52 76", role: "Acheteur" } as Contact,
};

const seller = (c: Contact): Contact => ({ ...c, role: "Vendeur" });

export type SaleRecord = {
  id: string; // VENTE-2026-001
  animalId: string;
  animalName: string;
  animalBreed: Breed;
  animalEmoji: string;
  seller: Contact;
  buyer: Contact;
  priceFcfa: number;
  saleDate: string;
  market: string;
  location: Location;
  status: SaleStatus;
  paymentStatus: string;
  documents?: string[];
  timeline: { id: string; time: string; label: string; icon: string }[];
};

const saleTimeline = (
  events: [SaleStatus | "base", string, string][],
): { id: string; time: string; label: string; icon: string }[] =>
  events.map(([, time, label], i) => ({
    id: `s${i + 1}`,
    time,
    label,
    icon: ["📝", "💰", "💵", "🔄", "✅"][i] ?? "•",
  }));

export const saleRecords: SaleRecord[] = [
  {
    id: "VENTE-2026-001",
    animalId: "SN-BOV-2026-0005",
    animalName: "Khady",
    animalBreed: "Gobra",
    animalEmoji: "🐄",
    seller: seller(C.cheikhFall),
    buyer: B.fatouDiop,
    priceFcfa: 375000,
    saleDate: "02 juin 2026",
    market: "Marché de Linguère",
    location: "Linguère",
    status: "transfere",
    paymentStatus: "Payé intégralement",
    documents: ["Reçu de vente", "Certificat de propriété", "Pièce d'identité acheteur"],
    timeline: saleTimeline([
      ["base", "28 mai 2026", "Vente enregistrée"],
      ["confirmee", "29 mai 2026", "Prix confirmé"],
      ["paiement_attente", "31 mai 2026", "Paiement reçu"],
      ["transfert_attente", "02 juin 2026", "Propriétaire transféré"],
      ["transfere", "02 juin 2026", "Clôturé"],
    ]),
  },
  {
    id: "VENTE-2026-002",
    animalId: "SN-BOV-2026-0011",
    animalName: "Tassi",
    animalBreed: "Ndama",
    animalEmoji: "🐂",
    seller: seller(C.ousmaneSow),
    buyer: B.ibrahimaSarr,
    priceFcfa: 520000,
    saleDate: "Cette semaine",
    market: "Marché de Dahra",
    location: "Dahra",
    status: "confirmee",
    paymentStatus: "En attente",
    timeline: saleTimeline([
      ["base", "03 juin 2026", "Vente enregistrée"],
      ["confirmee", "04 juin 2026", "Prix confirmé"],
    ]),
  },
  {
    id: "VENTE-2026-003",
    animalId: "SN-BOV-2026-0003",
    animalName: "Penda",
    animalBreed: "Djakoré",
    animalEmoji: "🐄",
    seller: seller(C.amadouDiallo),
    buyer: B.moussaBa,
    priceFcfa: 250000,
    saleDate: "Cette semaine",
    market: "Marché de Kaolack",
    location: "Kaolack",
    status: "negociation",
    paymentStatus: "Non démarré",
    timeline: saleTimeline([["base", "04 juin 2026", "Vente enregistrée"]]),
  },
  {
    id: "VENTE-2026-004",
    animalId: "SN-BOV-2026-0012",
    animalName: "Galo",
    animalBreed: "Guzerat",
    animalEmoji: "🐂",
    seller: seller(C.moussaBa),
    buyer: B.awaNdiaye,
    priceFcfa: 850000,
    saleDate: "30 mai 2026",
    market: "Marché de Matam",
    location: "Matam",
    status: "paiement_attente",
    paymentStatus: "Paiement partiel (400 000 FCFA reçus)",
    timeline: saleTimeline([
      ["base", "28 mai 2026", "Vente enregistrée"],
      ["confirmee", "29 mai 2026", "Prix confirmé"],
      ["paiement_attente", "30 mai 2026", "Paiement partiel reçu"],
    ]),
  },
  {
    id: "VENTE-2026-005",
    animalId: "SN-BOV-2026-0013",
    animalName: "Wouri",
    animalBreed: "Gobra",
    animalEmoji: "🐄",
    seller: seller(C.awaNdiaye),
    buyer: B.cheikhFall,
    priceFcfa: 375000,
    saleDate: "29 mai 2026",
    market: "Marché de Thiès",
    location: "Thiès",
    status: "transfert_attente",
    paymentStatus: "Payé intégralement",
    timeline: saleTimeline([
      ["base", "27 mai 2026", "Vente enregistrée"],
      ["confirmee", "28 mai 2026", "Prix confirmé"],
      ["paiement_attente", "29 mai 2026", "Paiement reçu"],
      ["transfert_attente", "29 mai 2026", "Transfert de propriété en cours"],
    ]),
  },
  {
    id: "VENTE-2026-006",
    animalId: "SN-BOV-2026-0014",
    animalName: "Diam",
    animalBreed: "Djakoré",
    animalEmoji: "🐄",
    seller: seller(B.ibrahimaSarr),
    buyer: B.fatouDiop,
    priceFcfa: 250000,
    saleDate: "25 mai 2026",
    market: "Marché de Tambacounda",
    location: "Tambacounda",
    status: "annule",
    paymentStatus: "Annulé — acheteur désisté",
    timeline: saleTimeline([
      ["base", "24 mai 2026", "Vente enregistrée"],
      ["confirmee", "25 mai 2026", "Vente annulée"],
    ]),
  },
  {
    id: "VENTE-2026-007",
    animalId: "SN-BOV-2026-0015",
    animalName: "Sama",
    animalBreed: "Montbéliarde",
    animalEmoji: "🐂",
    seller: seller(C.cheikhFall),
    buyer: B.ibrahimaSarr,
    priceFcfa: 850000,
    saleDate: "20 mai 2026",
    market: "Marché de Dahra",
    location: "Dahra",
    status: "transfere",
    paymentStatus: "Payé intégralement",
    documents: ["Reçu de vente", "Certificat de propriété", "Pièce d'identité acheteur"],
    timeline: saleTimeline([
      ["base", "16 mai 2026", "Vente enregistrée"],
      ["confirmee", "17 mai 2026", "Prix confirmé"],
      ["paiement_attente", "18 mai 2026", "Paiement reçu"],
      ["transfert_attente", "20 mai 2026", "Propriétaire transféré"],
      ["transfere", "20 mai 2026", "Clôturé"],
    ]),
  },
  {
    id: "VENTE-2026-008",
    animalId: "SN-BOV-2026-0016",
    animalName: "Lewru",
    animalBreed: "Ndama",
    animalEmoji: "🐂",
    seller: seller(C.moussaBa),
    buyer: B.fatouDiop,
    priceFcfa: 520000,
    saleDate: "Cette semaine",
    market: "Marché de Linguère",
    location: "Linguère",
    status: "confirmee",
    paymentStatus: "En attente",
    timeline: saleTimeline([
      ["base", "05 juin 2026", "Vente enregistrée"],
      ["confirmee", "05 juin 2026", "Prix confirmé"],
    ]),
  },
];

export function getSaleById(id: string): SaleRecord | undefined {
  return saleRecords.find((s) => s.id === id);
}

export function getSalesByAnimal(animalId: string): SaleRecord[] {
  return saleRecords.filter((s) => s.animalId === animalId);
}

const salePending = (s: SaleStatus) =>
  s === "confirmee" || s === "paiement_attente" || s === "transfert_attente";

export const salesKpis = {
  ceMois: saleRecords.filter(
    (s) => s.saleDate.includes("juin") || s.saleDate.includes("Cette semaine"),
  ).length,
  montantTotal: saleRecords
    .filter((s) => s.status !== "annule")
    .reduce((sum, s) => sum + s.priceFcfa, 0),
  transfertsEnAttente: saleRecords.filter((s) => salePending(s.status)).length,
  animauxVendus: new Set(
    saleRecords.filter((s) => s.status !== "annule" && s.status !== "negociation").map((s) => s.animalId),
  ).size,
};

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

export type UpcomingTask = {
  id: string;
  label: string;
  due: string;
  icon: string;
  href: string;
};

export const upcomingTasks: UpcomingTask[] = [
  { id: "t1", label: "Naissance à enregistrer — Fatou", due: "Cette semaine", icon: "👶", href: "/births" },
  { id: "t2", label: "Mise bas proche — Aïssata", due: "Imminent", icon: "🍼", href: "/breeding" },
  { id: "t3", label: "Vaccins en retard — 2 animaux", due: "Cette semaine", icon: "🧪", href: "/vaccines" },
  { id: "t4", label: "Soin urgent — Penda", due: "Aujourd'hui", icon: "🤒", href: "/care" },
];

/* ------------------------------------------------------------------ */
/* Résultats / Rapports — Phase 6 (derived from every module)          */
/* ------------------------------------------------------------------ */

/** Distinct females with an ongoing gestation. */
const pregnantFemales = new Set(
  breedingRecords.filter((b) => breedingActive(b.status)).map((b) => b.femaleId),
).size;

/** Headline KPIs for the reports overview. */
export const reportKpis = {
  total: animals.length,
  securises: herdStats.securises,
  alertesVol: activeAlertCount,
  soinsUrgents: careKpis.vetAAppeler,
  vaccinsEnRetard: vaccineKpis.enRetard,
  gestations: pregnantFemales,
  naissances: birthRecords.length,
  ventes: saleRecords.length,
  montantVentes: salesKpis.montantTotal,
};

/** Animal counts by zone, in the canonical Senegal order. */
export const animalsByLocation: { location: Location; count: number }[] =
  locations.map((location) => ({
    location,
    count: animals.filter((a) => a.ownership.location === location).length,
  }));

/** Animal counts by breed. */
export const animalsByBreed: { breed: Breed; count: number }[] = breeds.map(
  (breed) => ({
    breed,
    count: animals.filter((a) => a.identity.breed === breed).length,
  }),
);

/** Security overview: active alerts (listed) + location-risk counts. */
export const securityReport = {
  activeAlerts: theftAlerts.filter(
    (a) => a.status === "nouvelle" || a.status === "recherche" || a.status === "autorites",
  ),
  outsideZone: animalLocations.filter((l) => l.risk === "sortie").length,
  oldPositions: animalLocations.filter((l) => l.risk === "ancienne").length,
};

/** Health & vaccines overview. */
export const healthReport = {
  sick: animals.filter((a) => a.health.status === "malade").length,
  urgentCare: careRecords.filter((c) => c.status === "urgent").length,
  overdueVaccines: vaccineKpis.enRetard,
  nextVaccines: vaccineKpis.aFaire,
};

/** Reproduction & births overview. */
export const reproductionReport = {
  pregnant: pregnantFemales,
  expectedSoon: breedingRecords.filter((b) => b.status === "mise_bas_proche").length,
  birthsThisMonth: birthKpis.ceMois,
  followUp: birthKpis.suiviMere,
};

/** Sales & transfers overview. */
export const salesReport = {
  thisMonth: salesKpis.ceMois,
  totalRevenue: salesKpis.montantTotal,
  pendingTransfers: salesKpis.transfertsEnAttente,
  paymentIssues: saleRecords.filter((s) => s.status === "paiement_attente").length,
};

/* ------------------------------------------------------------------ */
/* Dashboard tiles (defined last — depends on every module's KPIs)     */
/* ------------------------------------------------------------------ */

/**
 * Total number of items across all modules that need attention — used as
 * the badge on the Résultats (reports) tile.
 */
export const reviewCount =
  activeAlertCount +
  careKpis.vetAAppeler +
  vaccineKpis.enRetard +
  birthKpis.aEnregistrer +
  salesKpis.transfertsEnAttente;

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
  { href: "/care", label: "Soins", icon: "💉", badge: careKpis.vetAAppeler, accent: "from-white to-sand-dark text-earth" },
  { href: "/vaccines", label: "Vaccins", icon: "🧪", badge: vaccinationsPending, accent: "from-white to-sand-dark text-earth" },
  { href: "/breeding", label: "Reproduction", icon: "🐄🐂", badge: breedingKpis.retards, accent: "from-white to-sand-dark text-earth" },
  { href: "/births", label: "Naissances", icon: "👶", badge: birthKpis.aEnregistrer, accent: "from-white to-sand-dark text-earth" },
  { href: "/sales", label: "Ventes", icon: "💰", badge: salesKpis.transfertsEnAttente, accent: "from-white to-sand-dark text-earth" },
  { href: "/reports", label: "Résultats", icon: "📊", badge: reviewCount, accent: "from-white to-sand-dark text-earth" },
];
