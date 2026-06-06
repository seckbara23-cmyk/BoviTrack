import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { HerdExplorer } from "@/components/herd/HerdExplorer";
import { getHerdAnimals } from "@/lib/herd-data";

export default async function HerdPage() {
  const animals = await getHerdAnimals();

  // Stats derived from the loaded herd, so they match whichever source
  // (Supabase or mock) supplied the data.
  const stats = {
    total: animals.length,
    securises: animals.filter((a) => a.security.status === "securise").length,
    enAlerte: animals.filter((a) => a.security.status === "alerte").length,
    aSurveiller: animals.filter((a) => a.health.status !== "sain").length,
  };

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
          <SummaryCard icon="🐄" value={stats.total} label="Total animaux" tone="neutral" />
          <SummaryCard icon="🟢" value={stats.securises} label="Sécurisés" tone="ok" />
          <SummaryCard icon="🔴" value={stats.enAlerte} label="En alerte" tone="alert" />
          <SummaryCard icon="💉" value={stats.aSurveiller} label="À surveiller" tone="warning" />
        </div>
      </section>

      {/* Search, filters and animal cards */}
      <HerdExplorer animals={animals} />
    </div>
  );
}
