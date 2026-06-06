/**
 * Typed domain models for the Supabase schema — kept SEPARATE from the mock
 * data in src/lib/mock-data.ts. Phase 9 will map these to the UI; for now
 * they document the persisted shape and type the data-access layer.
 *
 * Row / Insert / Update aliases are derived from the generated `Database`
 * type so they stay in sync with the schema.
 */
import type { Database } from "@/lib/database.types";

export type {
  UserRole,
  AnimalSex,
  AnimalStatus,
  LocationRisk,
  AlertType,
  AlertStatus,
  AlertSeverity,
  CareStatus,
  VaccineStatus,
  BreedingStatus,
  BirthStatus,
  SaleStatus,
} from "@/lib/database.types";

type Tables = Database["public"]["Tables"];

export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];

// Row models -------------------------------------------------------
export type Profile = Row<"profiles">;
export type Farm = Row<"farms">;
export type Owner = Row<"owners">;
export type Animal = Row<"animals">;
export type Location = Row<"locations">;
export type SecurityAlert = Row<"security_alerts">;
export type CareRecord = Row<"care_records">;
export type VaccineRecord = Row<"vaccine_records">;
export type BreedingRecord = Row<"breeding_records">;
export type BirthRecord = Row<"birth_records">;
export type SaleRecord = Row<"sale_records">;
export type DocumentRecord = Row<"documents">;
export type TimelineEvent = Row<"timeline_events">;

// Insert models ----------------------------------------------------
export type FarmInsert = Insert<"farms">;
export type OwnerInsert = Insert<"owners">;
export type AnimalInsert = Insert<"animals">;
export type LocationInsert = Insert<"locations">;
export type SecurityAlertInsert = Insert<"security_alerts">;
export type CareRecordInsert = Insert<"care_records">;
export type VaccineRecordInsert = Insert<"vaccine_records">;
export type BreedingRecordInsert = Insert<"breeding_records">;
export type BirthRecordInsert = Insert<"birth_records">;
export type SaleRecordInsert = Insert<"sale_records">;

/**
 * Animal with its related records — the aggregate the profile screen will
 * eventually load. Mirrors the "Animal is the core entity" architecture.
 */
export type AnimalWithRelations = Animal & {
  owner: Owner | null;
  farm: Farm | null;
  locations: Location[];
  security_alerts: SecurityAlert[];
  care_records: CareRecord[];
  vaccine_records: VaccineRecord[];
  breeding_records: BreedingRecord[];
  birth_records: BirthRecord[];
  sale_records: SaleRecord[];
  timeline_events: TimelineEvent[];
};
