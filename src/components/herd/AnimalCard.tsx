import Link from "next/link";
import type { Animal } from "@/lib/mock-data";
import { securityStatusMeta } from "@/lib/mock-data";

/**
 * Large, mobile-friendly animal card — never a dense table row.
 * Animals under an active theft alert visually stand out (red ring +
 * tint + last-position warning) so they are impossible to miss.
 */
export function AnimalCard({ animal }: { animal: Animal }) {
  const sec = securityStatusMeta[animal.security.status];
  const isAlert = animal.security.status === "alerte";

  return (
    <Link
      href={`/herd/${animal.id}`}
      className={`tile-press block rounded-3xl p-4 shadow-card ring-2 transition-shadow hover:shadow-tile ${
        isAlert ? "bg-alert/5 " + sec.ring : "bg-white " + sec.ring
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
            isAlert ? "bg-alert/10" : "bg-sand"
          }`}
          aria-hidden
        >
          {animal.emoji}
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-earth">
              {animal.name}
            </h3>
            <span className="text-sm text-earth/40" aria-hidden>
              {animal.identity.sex === "F" ? "♀️" : "♂️"}
            </span>
            <span className="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-earth/70">
              🧬 {animal.identity.breed}
            </span>
          </div>
          <p className="truncate font-mono text-xs text-earth/50">{animal.id}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/70">
            <span>📍 {animal.ownership.location}</span>
            <span>👤 {animal.ownership.owner.name}</span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-earth/40">
            🏷 {animal.identity.rfid}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${sec.className}`}
          >
            <span aria-hidden>{sec.emoji}</span>
            <span className="hidden sm:inline">{sec.label}</span>
          </span>
          <span className="rounded-xl bg-green px-3 py-1.5 text-xs font-bold text-white">
            Voir
          </span>
        </div>
      </div>

      {isAlert && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-alert/10 px-3 py-2 text-xs font-semibold text-alert">
          <span aria-hidden>⚠️</span>
          Dernière position {animal.security.lastUpdate.toLowerCase()} ·{" "}
          {animal.security.lastKnownLocation}
        </div>
      )}
    </Link>
  );
}
