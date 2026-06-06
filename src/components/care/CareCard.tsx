import Link from "next/link";
import type { CareRecord } from "@/lib/mock-data";
import { careStatusMeta, getAnimalById } from "@/lib/mock-data";
import { Badge } from "@/components/common/Badge";

/** Large, visual care card. Urgent records stand out with a red ring. */
export function CareCard({ care }: { care: CareRecord }) {
  const status = careStatusMeta[care.status];
  const animal = getAnimalById(care.animalId);
  const isUrgent = care.status === "urgent";

  return (
    <Link
      href={`/care/${care.id}`}
      className={`tile-press block rounded-3xl p-4 shadow-card ring-2 transition-shadow hover:shadow-tile ${
        isUrgent ? "bg-alert/5 ring-alert/50" : "bg-white ring-transparent"
      }`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl ${
            isUrgent ? "bg-alert/10" : "bg-sand"
          }`}
          aria-hidden
        >
          {care.icon}
        </span>

        <div className="min-w-0 flex-1 leading-tight">
          <h3 className="truncate text-base font-bold text-earth">
            {care.reason}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/70">
            <span>🐄 {animal ? animal.name : care.animalId}</span>
            <span className="font-mono text-earth/40">{care.animalId}</span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-earth/60">
            <span>🩺 {care.vet.name}</span>
            <span>📅 {care.date}</span>
          </div>
          <div className="mt-2">
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
