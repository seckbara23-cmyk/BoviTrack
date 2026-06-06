import Link from "next/link";
import type { VaccineRecord } from "@/lib/mock-data";
import { vaccineStatusMeta, getAnimalById } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/** Large, visual vaccine card. Overdue records stand out with a red ring. */
export function VaccineCard({ vaccine }: { vaccine: VaccineRecord }) {
  const status = vaccineStatusMeta[vaccine.status];
  const animal = getAnimalById(vaccine.animalId);
  const isOverdue = vaccine.status === "en_retard";

  return (
    <Link
      href={`/vaccines/${vaccine.id}`}
      className={`tile-press block rounded-3xl p-4 shadow-card ring-2 transition-shadow hover:shadow-tile ${
        isOverdue ? "bg-alert/5 ring-alert/50" : "bg-white ring-transparent"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
            isOverdue ? "bg-alert/10" : "bg-sand"
          }`}
          aria-hidden
        >
          {vaccine.icon}
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <h3 className="truncate text-base font-bold text-earth">
            {vaccine.name}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/70">
            <span>🐄 {animal ? animal.name : vaccine.animalId}</span>
            <span className="font-mono text-earth/40">{vaccine.animalId}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/60">
            <span>📍 {vaccine.location}</span>
            <span>🩺 {vaccine.agent.name}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge {...status} size="sm" />
            <span className="text-xs font-medium text-earth/60">
              {vaccine.doneDate ? `✅ ${vaccine.doneDate}` : `📅 ${vaccine.dueDate}`}
            </span>
          </div>
        </div>

        <span className="shrink-0 rounded-xl bg-green px-3 py-1.5 text-xs font-bold text-white">
          Voir
        </span>
      </div>
    </Link>
  );
}
