/**
 * Supabase `Database` type — mirrors supabase/migrations.
 *
 * Hand-authored for Phase 8 (foundation). Once the project is linked you can
 * regenerate this with:
 *   supabase gen types typescript --local > src/lib/database.types.ts
 *
 * The UI still runs on mock data; this type only powers the typed Supabase
 * clients in src/lib/supabase/*.
 */

export type UserRole =
  | "super_admin"
  | "farm_admin"
  | "field_agent"
  | "veterinarian"
  | "viewer";
export type AnimalSex = "M" | "F";
export type AnimalStatus = "active" | "sold" | "deceased" | "lost";
export type LocationRisk = "normale" | "sortie" | "ancienne" | "alerte";
export type AlertType = "vol" | "disparition" | "intrusion" | "sanitaire";
export type AlertStatus =
  | "nouvelle"
  | "recherche"
  | "autorites"
  | "retrouve"
  | "cloturee";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type CareStatus = "a_faire" | "en_cours" | "termine" | "urgent" | "suivi";
export type VaccineStatus = "a_faire" | "en_retard" | "fait" | "programme";
export type BreedingStatus =
  | "a_confirmer"
  | "gestation"
  | "a_surveiller"
  | "mise_bas_proche"
  | "terminee"
  | "echec";
export type BirthStatus =
  | "a_enregistrer"
  | "enregistre"
  | "suivi_requis"
  | "mort_ne";
export type SaleStatus =
  | "negociation"
  | "confirmee"
  | "paiement_attente"
  | "transfert_attente"
  | "transfere"
  | "annule";

/** Helper to declare a table's Row / Insert / Update shapes. */
type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        {
          id: string;
          email: string | null;
          full_name: string;
          role: UserRole;
          farm_id: string | null;
          created_at: string;
        },
        {
          id: string;
          email?: string | null;
          full_name?: string;
          role?: UserRole;
          farm_id?: string | null;
          created_at?: string;
        },
        {
          email?: string | null;
          full_name?: string;
          role?: UserRole;
          farm_id?: string | null;
        }
      >;
      farms: TableDef<
        {
          id: string;
          name: string;
          region: string | null;
          department: string | null;
          village: string | null;
          owner_name: string | null;
          created_at: string;
        },
        {
          id?: string;
          name: string;
          region?: string | null;
          department?: string | null;
          village?: string | null;
          owner_name?: string | null;
          created_at?: string;
        },
        Partial<{
          name: string;
          region: string | null;
          department: string | null;
          village: string | null;
          owner_name: string | null;
        }>
      >;
      owners: TableDef<
        {
          id: string;
          farm_id: string;
          full_name: string;
          phone: string | null;
          village: string | null;
        },
        {
          id?: string;
          farm_id: string;
          full_name: string;
          phone?: string | null;
          village?: string | null;
        },
        Partial<{ full_name: string; phone: string | null; village: string | null }>
      >;
      animals: TableDef<
        {
          id: string;
          farm_id: string;
          owner_id: string | null;
          animal_code: string;
          rfid_tag: string | null;
          qr_code: string | null;
          name: string | null;
          breed: string | null;
          sex: AnimalSex | null;
          birth_year: number | null;
          color: string | null;
          status: AnimalStatus;
          created_at: string;
        },
        {
          id?: string;
          farm_id: string;
          owner_id?: string | null;
          animal_code: string;
          rfid_tag?: string | null;
          qr_code?: string | null;
          name?: string | null;
          breed?: string | null;
          sex?: AnimalSex | null;
          birth_year?: number | null;
          color?: string | null;
          status?: AnimalStatus;
          created_at?: string;
        },
        Partial<{
          owner_id: string | null;
          animal_code: string;
          rfid_tag: string | null;
          qr_code: string | null;
          name: string | null;
          breed: string | null;
          sex: AnimalSex | null;
          birth_year: number | null;
          color: string | null;
          status: AnimalStatus;
        }>
      >;
      locations: TableDef<
        {
          id: string;
          animal_id: string;
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          risk_status: LocationRisk;
          recorded_at: string;
        },
        {
          id?: string;
          animal_id: string;
          location_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          risk_status?: LocationRisk;
          recorded_at?: string;
        },
        Partial<{
          location_name: string | null;
          latitude: number | null;
          longitude: number | null;
          risk_status: LocationRisk;
        }>
      >;
      security_alerts: TableDef<
        {
          id: string;
          animal_id: string;
          alert_type: AlertType;
          status: AlertStatus;
          severity: AlertSeverity;
          last_known_location: string | null;
          created_at: string;
        },
        {
          id?: string;
          animal_id: string;
          alert_type?: AlertType;
          status?: AlertStatus;
          severity?: AlertSeverity;
          last_known_location?: string | null;
          created_at?: string;
        },
        Partial<{
          alert_type: AlertType;
          status: AlertStatus;
          severity: AlertSeverity;
          last_known_location: string | null;
        }>
      >;
      care_records: TableDef<
        {
          id: string;
          animal_id: string;
          diagnosis: string | null;
          treatment: string | null;
          veterinarian: string | null;
          status: CareStatus;
          date: string;
        },
        {
          id?: string;
          animal_id: string;
          diagnosis?: string | null;
          treatment?: string | null;
          veterinarian?: string | null;
          status?: CareStatus;
          date?: string;
        },
        Partial<{
          diagnosis: string | null;
          treatment: string | null;
          veterinarian: string | null;
          status: CareStatus;
          date: string;
        }>
      >;
      vaccine_records: TableDef<
        {
          id: string;
          animal_id: string;
          vaccine_name: string;
          due_date: string | null;
          done_date: string | null;
          agent: string | null;
          batch_number: string | null;
          status: VaccineStatus;
        },
        {
          id?: string;
          animal_id: string;
          vaccine_name: string;
          due_date?: string | null;
          done_date?: string | null;
          agent?: string | null;
          batch_number?: string | null;
          status?: VaccineStatus;
        },
        Partial<{
          vaccine_name: string;
          due_date: string | null;
          done_date: string | null;
          agent: string | null;
          batch_number: string | null;
          status: VaccineStatus;
        }>
      >;
      breeding_records: TableDef<
        {
          id: string;
          female_animal_id: string;
          male_animal_id: string | null;
          status: BreedingStatus;
          expected_birth: string | null;
          created_at: string;
        },
        {
          id?: string;
          female_animal_id: string;
          male_animal_id?: string | null;
          status?: BreedingStatus;
          expected_birth?: string | null;
          created_at?: string;
        },
        Partial<{
          male_animal_id: string | null;
          status: BreedingStatus;
          expected_birth: string | null;
        }>
      >;
      birth_records: TableDef<
        {
          id: string;
          calf_animal_id: string | null;
          mother_animal_id: string;
          breeding_id: string | null;
          birth_date: string | null;
          status: BirthStatus;
        },
        {
          id?: string;
          calf_animal_id?: string | null;
          mother_animal_id: string;
          breeding_id?: string | null;
          birth_date?: string | null;
          status?: BirthStatus;
        },
        Partial<{
          calf_animal_id: string | null;
          breeding_id: string | null;
          birth_date: string | null;
          status: BirthStatus;
        }>
      >;
      sale_records: TableDef<
        {
          id: string;
          animal_id: string;
          seller_name: string | null;
          buyer_name: string | null;
          price_fcfa: number | null;
          market: string | null;
          status: SaleStatus;
          created_at: string;
        },
        {
          id?: string;
          animal_id: string;
          seller_name?: string | null;
          buyer_name?: string | null;
          price_fcfa?: number | null;
          market?: string | null;
          status?: SaleStatus;
          created_at?: string;
        },
        Partial<{
          seller_name: string | null;
          buyer_name: string | null;
          price_fcfa: number | null;
          market: string | null;
          status: SaleStatus;
        }>
      >;
      documents: TableDef<
        {
          id: string;
          animal_id: string;
          doc_type: string | null;
          title: string | null;
          storage_path: string | null;
          created_at: string;
        },
        {
          id?: string;
          animal_id: string;
          doc_type?: string | null;
          title?: string | null;
          storage_path?: string | null;
          created_at?: string;
        },
        Partial<{
          doc_type: string | null;
          title: string | null;
          storage_path: string | null;
        }>
      >;
      timeline_events: TableDef<
        {
          id: string;
          animal_id: string;
          event_type: string;
          description: string | null;
          created_at: string;
        },
        {
          id?: string;
          animal_id: string;
          event_type: string;
          description?: string | null;
          created_at?: string;
        },
        Partial<{ event_type: string; description: string | null }>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      my_farm_id: { Args: Record<string, never>; Returns: string | null };
      can_access_farm: { Args: { target: string }; Returns: boolean };
      can_access_animal: { Args: { target: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      animal_sex: AnimalSex;
      animal_status: AnimalStatus;
      location_risk: LocationRisk;
      alert_type: AlertType;
      alert_status: AlertStatus;
      alert_severity: AlertSeverity;
      care_status: CareStatus;
      vaccine_status: VaccineStatus;
      breeding_status: BreedingStatus;
      birth_status: BirthStatus;
      sale_status: SaleStatus;
    };
  };
};
