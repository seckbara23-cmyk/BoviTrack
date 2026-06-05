import Link from "next/link";

/**
 * BoviTrack wordmark. A small cattle pictogram inside a rounded green
 * badge, with a gold accent — Senegalese identity without copying the flag.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green text-xl shadow-tile ring-2 ring-gold/40">
        🐄
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight text-green">
            Bovi<span className="text-gold">Track</span>
          </span>
          <span className="block text-[11px] font-medium text-earth/60">
            Suivi du cheptel
          </span>
        </span>
      )}
      {compact && (
        <span className="text-lg font-extrabold tracking-tight text-green">
          Bovi<span className="text-gold">Track</span>
        </span>
      )}
    </Link>
  );
}
