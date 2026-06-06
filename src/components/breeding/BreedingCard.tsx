import Link from "next/link";
import type { BreedingRecord } from "@/lib/mock-data";
import { breedingStatusMeta, getAnimalById } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/** Large, visual breeding card. Late / failed records stand out in red. */
export function BreedingCard({ record }: { record: BreedingRecord }) {
  const status = breedingStatusMeta[record.status];
  const father = record.fatherId
    ? getAnimalById(record.fatherId)?.name
    : record.bullName;
  const isAlert = record.status === "echec" || record.overdue;

  return (
    <Link
      href={`/breeding/${record.id}`}
      className={`tile-press block rounded-3xl p-4 shadow-card ring-2 transition-shadow hover:shadow-tile ${
        isAlert ? "bg-alert/5 ring-alert/50" : "bg-white ring-transparent"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
            isAlert ? "bg-alert/10" : "bg-sand"
          }`}
          aria-hidden
        >
          {record.status === "echec" ? "❌" : "🤰"}
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-earth">
              {record.femaleName}
            </h3>
            <span className="font-mono text-xs text-earth/40">{record.femaleId}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/70">
            <span>🐂 {father ?? "Père inconnu"}</span>
            {record.expectedBirth && <span>🍼 {record.expectedBirth}</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/60">
            <span>👤 {record.ownerName}</span>
            <span>📍 {record.location}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge {...status} size="sm" />
            {record.overdue && (
              <span className="text-xs font-bold text-alert">⚠️ En retard</span>
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-xl bg-green px-3 py-1.5 text-xs font-bold text-white">
          Voir
        </span>
      </div>
    </Link>
  );
}
