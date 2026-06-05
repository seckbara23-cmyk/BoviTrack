import type { Animal } from "@/lib/mock-data";
import { healthMeta } from "@/lib/mock-data";

/**
 * Visual-first animal card. Avoids dense table rows: large emoji,
 * name, ID, and a colour-coded health pill carry the meaning.
 */
export function AnimalCard({ animal }: { animal: Animal }) {
  const health = healthMeta[animal.health];

  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card transition-shadow hover:shadow-tile">
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl"
        aria-hidden
      >
        {animal.emoji}
      </span>

      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-bold text-earth">
            {animal.name}
          </h3>
          <span className="text-sm text-earth/50" aria-hidden>
            {animal.sex === "F" ? "♀️" : "♂️"}
          </span>
        </div>
        <p className="truncate font-mono text-xs text-earth/50">{animal.id}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-earth/70">
          <span>🧬 {animal.breed}</span>
          <span aria-hidden>·</span>
          <span>📍 {animal.location}</span>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${health.className}`}
      >
        <span aria-hidden>{health.emoji}</span>{" "}
        <span className="hidden sm:inline">{health.label}</span>
      </span>
    </div>
  );
}
