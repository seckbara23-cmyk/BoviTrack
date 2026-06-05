import { LocationCard } from "@/components/location/LocationCard";
import { animalLocations, locationRiskMeta } from "@/lib/mock-data";

export default function LocationPage() {
  // Small legend so the colour code is learnable without reading much.
  const legend = Object.values(locationRiskMeta);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-earth">
          <span aria-hidden>📍</span> Localisation
        </h1>
        <p className="text-sm text-earth/60">
          Positions des animaux · données fictives (GPS à venir)
        </p>
      </header>

      {/* Mock map placeholder */}
      <div className="flex h-40 items-center justify-center rounded-3xl bg-gradient-to-br from-green-50 to-sand-dark text-center text-sm font-medium text-earth/60 shadow-card">
        <span>
          🗺️ Carte interactive bientôt disponible
          <br />
          <span className="text-xs">Intégration GPS / RFID — Phase 2</span>
        </span>
      </div>

      {/* Risk legend */}
      <div className="flex flex-wrap gap-2">
        {legend.map((meta) => (
          <span
            key={meta.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </span>
        ))}
      </div>

      {/* Location cards */}
      <div className="grid gap-3 lg:grid-cols-2">
        {animalLocations.map((loc) => (
          <LocationCard key={loc.animalId} loc={loc} />
        ))}
      </div>
    </div>
  );
}
