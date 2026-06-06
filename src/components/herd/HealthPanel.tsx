import Link from "next/link";
import type { Animal, CareRecord, VaccineRecord } from "@/lib/mock-data";
import { healthMeta, careStatusMeta, vaccineStatusMeta } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/**
 * Animal health summary on the profile, backed by real linked care &
 * vaccine records (Phase 3). Shows health status, active treatment, last
 * care, and the next due vaccine, each linking to its detail page.
 */
export function HealthPanel({
  animal,
  care,
  vaccines,
}: {
  animal: Animal;
  care: CareRecord[];
  vaccines: VaccineRecord[];
}) {
  const health = healthMeta[animal.health.status];

  const activeTreatment = care.find(
    (c) => c.status === "urgent" || c.status === "en_cours" || c.status === "suivi",
  );
  const lastCare = care.find((c) => c.status === "termine") ?? care[0];
  const nextVaccine =
    vaccines.find((v) => v.status === "en_retard") ??
    vaccines.find((v) => v.status === "a_faire") ??
    vaccines.find((v) => v.status === "programme");

  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-earth">
          <span aria-hidden>💉</span> Santé
        </h2>
        <span className="text-xs font-medium text-earth/50">
          {care.length} soin{care.length > 1 ? "s" : ""} · {vaccines.length} vaccin
          {vaccines.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Status */}
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-sand p-3">
        <span className="text-xs font-semibold text-earth/50">Statut :</span>
        <Badge {...health} size="sm" />
      </div>

      <div className="space-y-2">
        {/* Active treatment */}
        {activeTreatment && (
          <Link
            href={`/care/${activeTreatment.id}`}
            className="flex items-center gap-3 rounded-2xl bg-gold/15 p-3"
          >
            <span className="text-2xl" aria-hidden>
              {activeTreatment.icon}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-xs font-semibold text-earth/50">
                Traitement actif
              </div>
              <div className="truncate text-sm font-bold text-earth">
                {activeTreatment.reason}
              </div>
              <div className="mt-1">
                <Badge {...careStatusMeta[activeTreatment.status]} size="sm" />
              </div>
            </div>
            <span aria-hidden className="text-earth/30">›</span>
          </Link>
        )}

        {/* Last care */}
        {lastCare && (
          <Link
            href={`/care/${lastCare.id}`}
            className="flex items-center gap-3 rounded-2xl bg-sand p-3"
          >
            <span className="text-2xl" aria-hidden>
              {lastCare.icon}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-xs font-semibold text-earth/50">Dernier soin</div>
              <div className="truncate text-sm font-bold text-earth">
                {lastCare.reason}
              </div>
              <div className="text-xs text-earth/60">📅 {lastCare.date}</div>
            </div>
            <span aria-hidden className="text-earth/30">›</span>
          </Link>
        )}

        {/* Next vaccine */}
        {nextVaccine && (
          <Link
            href={`/vaccines/${nextVaccine.id}`}
            className="flex items-center gap-3 rounded-2xl bg-sand p-3"
          >
            <span className="text-2xl" aria-hidden>
              {nextVaccine.icon}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-xs font-semibold text-earth/50">
                Prochain vaccin
              </div>
              <div className="truncate text-sm font-bold text-earth">
                {nextVaccine.name}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge {...vaccineStatusMeta[nextVaccine.status]} size="sm" />
                <span className="text-xs text-earth/60">📅 {nextVaccine.dueDate}</span>
              </div>
            </div>
            <span aria-hidden className="text-earth/30">›</span>
          </Link>
        )}
      </div>

      {/* Links to modules */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/care"
          className="tile-press flex items-center justify-center gap-2 rounded-2xl bg-green px-4 py-3 text-sm font-bold text-white shadow-tile hover:bg-green-dark"
        >
          <span aria-hidden>💉</span> Tous les soins
        </Link>
        <Link
          href="/vaccines"
          className="tile-press flex items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-bold text-earth shadow-tile hover:bg-gold-dark hover:text-white"
        >
          <span aria-hidden>🧪</span> Tous les vaccins
        </Link>
      </div>
    </section>
  );
}
