import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { AddPlaceholderButton } from "@/components/common/AddPlaceholderButton";
import { BirthExplorer } from "@/components/births/BirthExplorer";
import { birthRecords, birthKpis } from "@/lib/mock-data";

export default function BirthsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>👶</span> Naissances
        </h1>
        <p className="text-sm text-earth/60">
          Veaux et mises bas du troupeau · données fictives
        </p>
      </header>

      <AddPlaceholderButton
        label="Ajouter naissance"
        hint="Bientôt : enregistrer une naissance (veau, mère, sexe, race)."
      />

      {/* KPI cards */}
      <section aria-label="Indicateurs des naissances">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon="👶" value={birthKpis.ceMois} label="Naissances ce mois" tone="ok" />
          <SummaryCard icon="🐮" value={birthKpis.veauxVivants} label="Veaux vivants" tone="ok" />
          <SummaryCard icon="📋" value={birthKpis.aEnregistrer} label="À enregistrer" tone="warning" />
          <SummaryCard icon="🔁" value={birthKpis.suiviMere} label="Suivi mère" tone="alert" />
        </div>
      </section>

      <BirthExplorer records={birthRecords} />
    </div>
  );
}
