/**
 * Herd data adapter — the single source pages use for the herd module.
 *
 * - Supabase, when configured AND the request is authenticated → live data,
 *   mapped into the existing UI shapes (mock-data types) so NO component or UI
 *   logic changes.
 * - Mock data otherwise (Supabase not configured, build-time, or any failure).
 *
 * Read-only (Phase 9). Every Supabase path is wrapped in try/catch and falls
 * back to mock data, so the app can never break because of the backend.
 */
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getAnimals,
  getAnimalWithRelations,
  getOwnersByIds,
  getAlertsByAnimalIds,
  getLocationsByAnimalIds,
  getCareByAnimalIds,
} from "@/lib/db/queries";
import type {
  Animal as DbAnimal,
  Owner as DbOwner,
  SecurityAlert as DbAlert,
  Location as DbLocation,
  CareRecord as DbCare,
  VaccineRecord as DbVaccine,
  BreedingRecord as DbBreeding,
  BirthRecord as DbBirth,
  SaleRecord as DbSale,
  TimelineEvent as DbTimeline,
} from "@/lib/db/models";
import {
  animals as mockAnimals,
  getAnimalById as mockGetAnimal,
  getCareByAnimal,
  getVaccinesByAnimal,
  getBreedingByFemale,
  getBreedingByFather,
  getBirthsByMother,
  getBirthsByFather,
  getSalesByAnimal,
} from "@/lib/mock-data";
import type {
  Animal as UiAnimal,
  CareRecord as UiCare,
  VaccineRecord as UiVaccine,
  BreedingRecord as UiBreeding,
  BirthRecord as UiBirth,
  SaleRecord as UiSale,
  Breed as UiBreed,
  Location as UiLocation,
  Sex as UiSex,
  SecurityStatus,
  HealthStatus,
  AnimalEventType,
} from "@/lib/mock-data";

/** Everything the animal profile page needs, in UI shapes. */
export type HerdAnimalDetail = {
  animal: UiAnimal;
  care: UiCare[];
  vaccines: UiVaccine[];
  breedingAsFemale: UiBreeding[];
  breedingAsFather: UiBreeding[];
  birthsAsMother: UiBirth[];
  birthsAsFather: UiBirth[];
  sales: UiSale[];
};

/* ------------------------------------------------------------------ */
/* Small mapping helpers                                               */
/* ------------------------------------------------------------------ */

const EVENT_TYPES: AnimalEventType[] = [
  "registered",
  "location",
  "health",
  "alert",
  "movement",
];

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ACTIVE_ALERT = new Set(["nouvelle", "recherche", "autorites"]);

function emojiFor(sex: DbAnimal["sex"]): string {
  return sex === "M" ? "🐂" : "🐄";
}

type AnimalLite = { code: string; name: string; breed: UiBreed; sex: UiSex; emoji: string };

function liteOf(a: DbAnimal): AnimalLite {
  return {
    code: a.animal_code,
    name: a.name ?? a.animal_code,
    breed: (a.breed ?? "Gobra") as UiBreed,
    sex: (a.sex ?? "F") as UiSex,
    emoji: emojiFor(a.sex),
  };
}

/* ------------------------------------------------------------------ */
/* DB → UI mappers                                                     */
/* ------------------------------------------------------------------ */

function mapAnimal(
  a: DbAnimal,
  ctx: {
    owner: DbOwner | null;
    alerts: DbAlert[];
    locations: DbLocation[];
    care: DbCare[];
  },
): UiAnimal {
  const latest = ctx.locations[0] ?? null;
  const activeAlert = ctx.alerts.find((x) => ACTIVE_ALERT.has(x.status));

  const security: SecurityStatus = activeAlert
    ? "alerte"
    : latest && (latest.risk_status === "sortie" || latest.risk_status === "ancienne")
      ? "surveillance"
      : "securise";

  const hasUrgent = ctx.care.some((c) => c.status === "urgent");
  const hasWatch = ctx.care.some(
    (c) => c.status === "en_cours" || c.status === "suivi",
  );
  const health: HealthStatus = hasUrgent ? "malade" : hasWatch ? "surveillance" : "sain";

  const zone = activeAlert?.last_known_location ?? latest?.location_name ?? "—";
  const lastUpdate = latest ? fmtDate(latest.recorded_at) : "—";

  return {
    id: a.animal_code, // routes & lookups key on the human-readable code
    name: a.name ?? a.animal_code,
    emoji: emojiFor(a.sex),
    identity: {
      rfid: a.rfid_tag ?? "—",
      qrCode: a.qr_code ?? "—",
      breed: (a.breed ?? "Gobra") as UiBreed,
      sex: (a.sex ?? "F") as UiSex,
      birthYear: a.birth_year ?? 0,
      color: a.color ?? "—",
      registeredAt: fmtDate(a.created_at),
    },
    ownership: {
      owner: { name: ctx.owner?.full_name ?? "—", phone: ctx.owner?.phone ?? "", role: "Propriétaire" },
      herder: { name: "—", phone: "", role: "Berger" },
      location: (ctx.owner?.village ?? "—") as UiLocation,
    },
    security: {
      status: security,
      alertId: activeAlert?.id,
      lastKnownLocation: zone,
      lastUpdate,
    },
    location: {
      zone: latest?.location_name ?? "—",
      risk: latest?.risk_status ?? "normale",
      lastUpdate,
    },
    health: { status: health },
    reproduction: { pregnant: false },
    timeline: [],
  };
}

function mapTimeline(t: DbTimeline): UiAnimal["timeline"][number] {
  const type = (EVENT_TYPES as string[]).includes(t.event_type)
    ? (t.event_type as AnimalEventType)
    : "movement";
  return {
    id: t.id,
    type,
    time: fmtDate(t.created_at),
    label: t.description ?? t.event_type,
  };
}

function mapCare(c: DbCare, animalCode: string): UiCare {
  return {
    id: c.id,
    animalId: animalCode,
    category: "Soin",
    icon: "🩺",
    reason: c.diagnosis ?? "Soin",
    symptoms: [],
    treatment: c.treatment ?? "—",
    vet: { name: c.veterinarian ?? "—", phone: "", role: "Vétérinaire" },
    date: fmtDate(c.date),
    status: c.status,
  };
}

function mapVaccine(v: DbVaccine, animalCode: string, location: UiLocation): UiVaccine {
  return {
    id: v.id,
    animalId: animalCode,
    name: v.vaccine_name,
    icon: "🧪",
    dueDate: fmtDate(v.due_date),
    doneDate: v.done_date ? fmtDate(v.done_date) : undefined,
    agent: { name: v.agent ?? "—", phone: "", role: "Agent" },
    batchNumber: v.batch_number ?? undefined,
    status: v.status,
    location,
  };
}

function mapBreeding(
  b: DbBreeding,
  lookup: Map<string, AnimalLite>,
  location: UiLocation,
): UiBreeding {
  const female = lookup.get(b.female_animal_id);
  const male = b.male_animal_id ? lookup.get(b.male_animal_id) : undefined;
  return {
    id: b.id,
    femaleId: female?.code ?? b.female_animal_id,
    femaleName: female?.name ?? "—",
    femaleBreed: female?.breed ?? "Gobra",
    fatherId: male?.code,
    method: "Saillie naturelle",
    matingDate: fmtDate(b.created_at),
    status: b.status,
    expectedBirth: b.expected_birth ? fmtDate(b.expected_birth) : undefined,
    vet: { name: "—", phone: "", role: "Vétérinaire" },
    ownerName: "—",
    herderName: "—",
    location,
    timeline: [],
  };
}

function mapBirth(
  b: DbBirth,
  lookup: Map<string, AnimalLite>,
  location: UiLocation,
): UiBirth {
  const mother = lookup.get(b.mother_animal_id);
  const calf = b.calf_animal_id ? lookup.get(b.calf_animal_id) : undefined;
  return {
    id: b.id,
    calfId: calf?.code,
    calfName: calf?.name,
    motherId: mother?.code ?? b.mother_animal_id,
    motherName: mother?.name ?? "—",
    birthDate: fmtDate(b.birth_date),
    sex: calf?.sex ?? "F",
    breed: calf?.breed ?? mother?.breed ?? "Gobra",
    location,
    ownerName: "—",
    herderName: "—",
    status: b.status,
    healthNote: "—",
    breedingId: b.breeding_id ?? undefined,
    icon: b.status === "mort_ne" ? "💔" : calf ? "🐮" : "👶",
  };
}

function mapSale(
  s: DbSale,
  self: AnimalLite,
  location: UiLocation,
): UiSale {
  return {
    id: s.id,
    animalId: self.code,
    animalName: self.name,
    animalBreed: self.breed,
    animalEmoji: self.emoji,
    seller: { name: s.seller_name ?? "—", phone: "", role: "Vendeur" },
    buyer: { name: s.buyer_name ?? "—", phone: "", role: "Acheteur" },
    priceFcfa: s.price_fcfa ?? 0,
    saleDate: fmtDate(s.created_at),
    market: s.market ?? "—",
    location,
    status: s.status,
    paymentStatus: "—",
    timeline: [],
  };
}

/* ------------------------------------------------------------------ */
/* Public adapter                                                      */
/* ------------------------------------------------------------------ */

/** Herd list, in UI shape. Falls back to mock data on any issue. */
export async function getHerdAnimals(): Promise<UiAnimal[]> {
  if (!isSupabaseConfigured) return mockAnimals;

  try {
    const rows = await getAnimals();
    const ids = rows.map((a) => a.id);
    const ownerIds = [
      ...new Set(rows.map((a) => a.owner_id).filter((x): x is string => Boolean(x))),
    ];

    const [owners, alerts, locations, care] = await Promise.all([
      getOwnersByIds(ownerIds),
      getAlertsByAnimalIds(ids),
      getLocationsByAnimalIds(ids),
      getCareByAnimalIds(ids),
    ]);

    const ownerById = new Map(owners.map((o) => [o.id, o]));
    const byAnimal = <T extends { animal_id: string }>(items: T[]) => {
      const m = new Map<string, T[]>();
      for (const it of items) {
        const arr = m.get(it.animal_id) ?? [];
        arr.push(it);
        m.set(it.animal_id, arr);
      }
      return m;
    };
    const alertsBy = byAnimal(alerts);
    const locsBy = byAnimal(locations);
    const careBy = byAnimal(care);

    return rows.map((a) =>
      mapAnimal(a, {
        owner: a.owner_id ? (ownerById.get(a.owner_id) ?? null) : null,
        alerts: alertsBy.get(a.id) ?? [],
        locations: locsBy.get(a.id) ?? [],
        care: careBy.get(a.id) ?? [],
      }),
    );
  } catch {
    return mockAnimals;
  }
}

function mockDetail(code: string): HerdAnimalDetail | null {
  const animal = mockGetAnimal(code);
  if (!animal) return null;
  return {
    animal,
    care: getCareByAnimal(code),
    vaccines: getVaccinesByAnimal(code),
    breedingAsFemale: getBreedingByFemale(code),
    breedingAsFather: getBreedingByFather(code),
    birthsAsMother: getBirthsByMother(code),
    birthsAsFather: getBirthsByFather(code),
    sales: getSalesByAnimal(code),
  };
}

/** One animal profile + related records, in UI shapes. Mock fallback. */
export async function getHerdAnimal(code: string): Promise<HerdAnimalDetail | null> {
  if (!isSupabaseConfigured) return mockDetail(code);

  try {
    const awr = await getAnimalWithRelations(code);
    if (!awr) return null;

    const all = await getAnimals();
    const lookup = new Map<string, AnimalLite>(all.map((a) => [a.id, liteOf(a)]));
    const self = liteOf(awr);
    const location = (awr.owner?.village ?? "—") as UiLocation;

    const animal = mapAnimal(awr, {
      owner: awr.owner,
      alerts: awr.security_alerts,
      locations: awr.locations,
      care: awr.care_records,
    });
    animal.timeline = awr.timeline_events.map(mapTimeline);
    const femaleBreeding = awr.breeding_records.filter(
      (b) => b.female_animal_id === awr.id,
    );
    animal.reproduction = {
      pregnant: femaleBreeding.some(
        (b) => b.status === "gestation" || b.status === "a_surveiller" || b.status === "mise_bas_proche",
      ),
    };

    return {
      animal,
      care: awr.care_records.map((c) => mapCare(c, self.code)),
      vaccines: awr.vaccine_records.map((v) => mapVaccine(v, self.code, location)),
      breedingAsFemale: femaleBreeding.map((b) => mapBreeding(b, lookup, location)),
      breedingAsFather: awr.breeding_records
        .filter((b) => b.male_animal_id === awr.id)
        .map((b) => mapBreeding(b, lookup, location)),
      birthsAsMother: awr.birth_records
        .filter((b) => b.mother_animal_id === awr.id)
        .map((b) => mapBirth(b, lookup, location)),
      birthsAsFather: [], // DB birth_records have no father column
      sales: awr.sale_records.map((s) => mapSale(s, self, location)),
    };
  } catch {
    return mockDetail(code);
  }
}
