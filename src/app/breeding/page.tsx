import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { AddPlaceholderButton } from "@/components/common/AddPlaceholderButton";
import { BreedingExplorer } from "@/components/breeding/BreedingExplorer";
import { breedingRecords, breedingKpis } from "@/lib/mock-data";

export default function BreedingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>🐄🐂</span> Reproduction
        </h1>
        <p className="text-sm text-earth/60">
          Saillies, gestations et mises bas · données fictives
        </p>
      </header>

      <AddPlaceholderButton
        label="Ajouter reproduction"
        hint="Bientôt : enregistrer une saillie ou une insémination."
      />

      {/* KPI cards */}
      <section aria-label="Indicateurs de reproduction">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon="🤰" value={breedingKpis.gestationsEnCours} label="Gestations en cours" tone="ok" />
          <SummaryCard icon="🍼" value={breedingKpis.misesBasPrevues} label="Mises bas prévues" tone="warning" />
          <SummaryCard icon="⚠️" value={breedingKpis.aSurveiller} label="À surveiller" tone="warning" />
          <SummaryCard icon="⏰" value={breedingKpis.retards} label="Retards" tone="alert" />
        </div>
      </section>

      <BreedingExplorer records={breedingRecords} />
    </div>
  );
}
