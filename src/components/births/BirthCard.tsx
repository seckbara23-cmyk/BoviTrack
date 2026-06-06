import Link from "next/link";
import type { BirthRecord } from "@/lib/mock-data";
import { birthStatusMeta } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/** Large, visual birth card. Stillbirths / follow-ups stand out in red/gold. */
export function BirthCard({ record }: { record: BirthRecord }) {
  const status = birthStatusMeta[record.status];
  const isLoss = record.status === "mort_ne";

  return (
    <Link
      href={`/births/${record.id}`}
      className={`tile-press block rounded-3xl p-4 shadow-card ring-2 transition-shadow hover:shadow-tile ${
        isLoss ? "bg-alert/5 ring-alert/50" : "bg-white ring-transparent"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
            isLoss ? "bg-alert/10" : "bg-sand"
          }`}
          aria-hidden
        >
          {record.icon}
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-earth">
              {record.calfName ?? "Veau"}
            </h3>
            <span className="text-sm text-earth/40" aria-hidden>
              {record.sex === "F" ? "♀️" : "♂️"}
            </span>
            {record.calfId && (
              <span className="font-mono text-xs text-earth/40">{record.calfId}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/70">
            <span>🐄 Mère : {record.motherName}</span>
            <span>🧬 {record.breed}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/60">
            <span>📅 {record.birthDate}</span>
            <span>📍 {record.location}</span>
          </div>
          <div className="mt-1.5">
            <Badge {...status} size="sm" />
          </div>
        </div>

        <span className="shrink-0 rounded-xl bg-green px-3 py-1.5 text-xs font-bold text-white">
          Voir
        </span>
      </div>
    </Link>
  );
}
