/**
 * Supabase data-access layer (read-only, Phase 9).
 *
 * Returns rows typed with the domain models. RLS scopes every result to the
 * caller's farm (super_admin sees all). Pages never import this directly —
 * they go through the source adapter in src/lib/herd-data.ts, which falls back
 * to mock data when Supabase is not configured.
 */
import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Farm,
  Owner,
  Animal,
  Location,
  SecurityAlert,
  CareRecord,
  VaccineRecord,
  BreedingRecord,
  BirthRecord,
  SaleRecord,
  TimelineEvent,
  AnimalWithRelations,
} from "@/lib/db/models";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
}

/** All animals visible to the caller (RLS-scoped), ordered by code. */
export async function getAnimals(): Promise<Animal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("animals")
    .select("*")
    .order("animal_code", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAnimalByCode(
  animalCode: string,
): Promise<Animal | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("animals")
    .select("*")
    .eq("animal_code", animalCode)
    .maybeSingle();

  return data ?? null;
}

/* ---- Batched helpers used to enrich the herd list ---- */

export async function getOwnersByIds(ids: string[]): Promise<Owner[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("owners").select("*").in("id", ids);
  return data ?? [];
}

export async function getAlertsByAnimalIds(
  ids: string[],
): Promise<SecurityAlert[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("security_alerts")
    .select("*")
    .in("animal_id", ids);
  return data ?? [];
}

export async function getLocationsByAnimalIds(
  ids: string[],
): Promise<Location[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("locations")
    .select("*")
    .in("animal_id", ids)
    .order("recorded_at", { ascending: false });
  return data ?? [];
}

export async function getCareByAnimalIds(ids: string[]): Promise<CareRecord[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("care_records")
    .select("*")
    .in("animal_id", ids);
  return data ?? [];
}

/**
 * One animal plus every related record (Phase 9 aggregate). Returns null when
 * the code is not found / not accessible. `breeding_records` covers the animal
 * as female OR male; `birth_records` covers it as mother OR calf.
 */
export async function getAnimalWithRelations(
  animalCode: string,
): Promise<AnimalWithRelations | null> {
  const supabase = await createClient();

  const animal = await getAnimalByCode(animalCode);
  if (!animal) return null;

  const id = animal.id;

  const [
    ownerRes,
    farmRes,
    locationsRes,
    alertsRes,
    careRes,
    vaccineRes,
    breedingRes,
    birthRes,
    saleRes,
    timelineRes,
  ] = await Promise.all([
    animal.owner_id
      ? supabase.from("owners").select("*").eq("id", animal.owner_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("farms").select("*").eq("id", animal.farm_id).maybeSingle(),
    supabase.from("locations").select("*").eq("animal_id", id).order("recorded_at", { ascending: false }),
    supabase.from("security_alerts").select("*").eq("animal_id", id),
    supabase.from("care_records").select("*").eq("animal_id", id),
    supabase.from("vaccine_records").select("*").eq("animal_id", id),
    supabase.from("breeding_records").select("*").or(`female_animal_id.eq.${id},male_animal_id.eq.${id}`),
    supabase.from("birth_records").select("*").or(`mother_animal_id.eq.${id},calf_animal_id.eq.${id}`),
    supabase.from("sale_records").select("*").eq("animal_id", id),
    supabase.from("timeline_events").select("*").eq("animal_id", id).order("created_at", { ascending: true }),
  ]);

  return {
    ...animal,
    owner: (ownerRes.data as Owner | null) ?? null,
    farm: (farmRes.data as Farm | null) ?? null,
    locations: (locationsRes.data as Location[]) ?? [],
    security_alerts: (alertsRes.data as SecurityAlert[]) ?? [],
    care_records: (careRes.data as CareRecord[]) ?? [],
    vaccine_records: (vaccineRes.data as VaccineRecord[]) ?? [],
    breeding_records: (breedingRes.data as BreedingRecord[]) ?? [],
    birth_records: (birthRes.data as BirthRecord[]) ?? [],
    sale_records: (saleRes.data as SaleRecord[]) ?? [],
    timeline_events: (timelineRes.data as TimelineEvent[]) ?? [],
  };
}
