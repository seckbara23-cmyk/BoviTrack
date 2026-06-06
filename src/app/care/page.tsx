import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { AddPlaceholderButton } from "@/components/common/AddPlaceholderButton";
import { CareExplorer } from "@/components/care/CareExplorer";
import { animals, careRecords, careKpis } from "@/lib/mock-data";

export default function CarePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>💉</span> Soins
        </h1>
        <p className="text-sm text-earth/60">
          Suivi sanitaire du troupeau · données fictives
        </p>
      </header>

      <AddPlaceholderButton
        label="Nouveau soin"
        hint="Bientôt : enregistrer un nouveau soin (diagnostic, traitement, vétérinaire)."
      />

      {/* KPI cards */}
      <section aria-label="Indicateurs des soins">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon="🤒" value={careKpis.animauxMalades} label="Animaux malades" tone="alert" />
          <SummaryCard icon="📅" value={careKpis.aujourdhui} label="Soins aujourd'hui" tone="neutral" />
          <SummaryCard icon="💊" value={careKpis.enCours} label="Traitements en cours" tone="warning" />
          <SummaryCard icon="📞" value={careKpis.vetAAppeler} label="Vétérinaire à appeler" tone="alert" />
        </div>
      </section>

      <CareExplorer records={careRecords} animals={animals} />
    </div>
  );
}
