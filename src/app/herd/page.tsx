import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { HerdExplorer } from "@/components/herd/HerdExplorer";
import { animals, herdStats } from "@/lib/mock-data";

export default function HerdPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>🐄</span> Mon troupeau
        </h1>
        <p className="text-sm text-earth/60">Tous les animaux enregistrés</p>
      </header>

      {/* Quick stats */}
      <section aria-label="Statistiques du troupeau">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard icon="🐄" value={herdStats.total} label="Total animaux" tone="neutral" />
          <SummaryCard icon="🟢" value={herdStats.securises} label="Sécurisés" tone="ok" />
          <SummaryCard icon="🔴" value={herdStats.enAlerte} label="En alerte" tone="alert" />
          <SummaryCard icon="💉" value={herdStats.aSurveiller} label="À surveiller" tone="warning" />
        </div>
      </section>

      {/* Search, filters and animal cards */}
      <HerdExplorer animals={animals} />
    </div>
  );
}
