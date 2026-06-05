import Link from "next/link";
import type { AnimalLocation } from "@/lib/mock-data";
import { locationRiskMeta } from "@/lib/mock-data";

/**
 * Position card for one animal. Colour-coded ring + pill make the risk
 * status readable at a glance. When an alert is active the whole card
 * links to that alert; otherwise it shows position info only.
 */
export function LocationCard({ loc }: { loc: AnimalLocation }) {
  const meta = locationRiskMeta[loc.risk];

  const body = (
    <div
      className={`flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card ring-2 ${meta.ring}`}
    >
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sand text-4xl"
        aria-hidden
      >
        {loc.emoji}
      </span>

      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-bold text-earth">{loc.name}</h3>
          <span className="font-mono text-xs text-earth/40">{loc.animalId}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-earth/70">📍 {loc.zone}</p>
        <p className="text-xs text-earth/50">🕒 {loc.lastUpdate}</p>
        <div className="mt-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </span>
        </div>
      </div>

      {loc.alertId && (
        <span aria-hidden className="text-2xl text-alert/50">
          ›
        </span>
      )}
    </div>
  );

  if (loc.alertId) {
    return (
      <Link href={`/alerts/${loc.alertId}`} className="tile-press block">
        {body}
      </Link>
    );
  }

  return body;
}
