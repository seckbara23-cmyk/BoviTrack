import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { AddPlaceholderButton } from "@/components/common/AddPlaceholderButton";
import { SalesExplorer } from "@/components/sales/SalesExplorer";
import { saleRecords, salesKpis, formatFcfa } from "@/lib/mock-data";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>💰</span> Ventes
        </h1>
        <p className="text-sm text-earth/60">
          Ventes et transferts de propriété · données fictives
        </p>
      </header>

      <AddPlaceholderButton
        label="Ajouter vente"
        hint="Bientôt : enregistrer une vente (animal, acheteur, prix, marché)."
      />

      {/* KPI cards */}
      <section aria-label="Indicateurs des ventes">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon="💰" value={salesKpis.ceMois} label="Ventes ce mois" tone="ok" />
          <SummaryCard icon="💵" value={formatFcfa(salesKpis.montantTotal)} label="Montant total" tone="ok" />
          <SummaryCard icon="🔄" value={salesKpis.transfertsEnAttente} label="Transferts en attente" tone="warning" />
          <SummaryCard icon="🐄" value={salesKpis.animauxVendus} label="Animaux vendus" tone="neutral" />
        </div>
      </section>

      <SalesExplorer records={saleRecords} />
    </div>
  );
}
