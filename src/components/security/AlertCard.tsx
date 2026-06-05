import Link from "next/link";
import type { TheftAlert } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadge";

/** Tappable summary card for one theft alert, linking to its detail page. */
export function AlertCard({ alert }: { alert: TheftAlert }) {
  return (
    <Link
      href={`/alerts/${alert.id}`}
      className="tile-press flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card hover:shadow-tile"
    >
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-alert/10 text-4xl"
        aria-hidden
      >
        {alert.animalEmoji}
      </span>

      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-bold text-earth">
            {alert.animalName}
          </h3>
          <span className="font-mono text-xs text-earth/40">
            {alert.animalId}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-earth/70">
          📍 {alert.lastKnownLocation}
        </p>
        <p className="text-xs text-earth/50">🕒 {alert.lastSeenAgo}</p>
        <div className="mt-2">
          <StatusBadge status={alert.status} size="sm" />
        </div>
      </div>

      <span aria-hidden className="text-2xl text-earth/30">
        ›
      </span>
    </Link>
  );
}
