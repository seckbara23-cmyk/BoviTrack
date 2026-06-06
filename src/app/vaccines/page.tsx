import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { AddPlaceholderButton } from "@/components/common/AddPlaceholderButton";
import { VaccineExplorer } from "@/components/vaccines/VaccineExplorer";
import { animals, vaccineRecords, vaccineKpis } from "@/lib/mock-data";

export default function VaccinesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>💉</span> Vaccins
        </h1>
        <p className="text-sm text-earth/60">
          Calendrier vaccinal du troupeau · données fictives
        </p>
      </header>

      <AddPlaceholderButton
        label="Ajouter vaccin"
        hint="Bientôt : programmer ou enregistrer une vaccination."
      />

      {/* KPI cards */}
      <section aria-label="Indicateurs des vaccins">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon="🧪" value={vaccineKpis.aFaire} label="Vaccins à faire" tone="warning" />
          <SummaryCard icon="⏰" value={vaccineKpis.enRetard} label="En retard" tone="alert" />
          <SummaryCard icon="📅" value={vaccineKpis.cetteSemaine} label="Cette semaine" tone="neutral" />
          <SummaryCard icon="✅" value={vaccineKpis.aJour} label="À jour" tone="ok" />
        </div>
      </section>

      <VaccineExplorer records={vaccineRecords} animals={animals} />
    </div>
  );
}
