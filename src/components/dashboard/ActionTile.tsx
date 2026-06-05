import Link from "next/link";
import type { DashboardAction } from "@/lib/mock-data";

/**
 * Large, touch-friendly action tile. Icon-led with a short label,
 * following the "Zéro lecture obligatoire" principle.
 */
export function ActionTile({ action }: { action: DashboardAction }) {
  return (
    <Link
      href={action.href}
      className={`tile-press group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br p-3 text-center shadow-tile hover:shadow-tile-hover ${action.accent}`}
    >
      {typeof action.badge === "number" && action.badge > 0 && (
        <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-alert px-1.5 text-xs font-bold text-white shadow-card">
          {action.badge}
        </span>
      )}

      <span className="text-4xl leading-none sm:text-5xl" aria-hidden>
        {action.icon}
      </span>
      <span className="text-sm font-semibold leading-tight sm:text-base">
        {action.label}
      </span>
    </Link>
  );
}
