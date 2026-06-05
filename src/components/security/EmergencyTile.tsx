import Link from "next/link";
import { activeAlertCount } from "@/lib/mock-data";

/**
 * Oversized, high-priority anti-theft tile for the dashboard.
 * Deliberately the loudest element on the screen: red gradient,
 * emergency pictogram, pulsing badge, and a clear "Signaler un vol" CTA.
 */
export function EmergencyTile() {
  return (
    <Link
      href="/alerts"
      className="tile-press relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-alert to-alert-dark p-5 text-white shadow-tile-hover ring-2 ring-alert-light/40 sm:gap-5 sm:p-6"
    >
      {/* Pulsing siren */}
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-4xl sm:h-20 sm:w-20 sm:text-5xl">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-white/10" />
        <span aria-hidden>🚨</span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            Vol / Alerte
          </h2>
          {activeAlertCount > 0 && (
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-sm font-bold text-alert">
              {activeAlertCount}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-white/90">
          {activeAlertCount > 0
            ? `${activeAlertCount} alerte(s) en cours`
            : "Aucune alerte active"}
        </p>

        <span className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-base font-bold text-alert shadow-card">
          <span aria-hidden>🚨</span> Signaler un vol
        </span>
      </div>

      <span aria-hidden className="hidden text-3xl text-white/60 sm:block">
        ›
      </span>
    </Link>
  );
}
