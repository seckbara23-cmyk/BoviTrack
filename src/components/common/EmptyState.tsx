import Link from "next/link";

/**
 * Friendly empty-state used by the Phase 1 placeholder routes.
 * Big pictogram, short message, one clear action back home.
 */
export function EmptyState({
  icon,
  title,
  message,
  hint,
}: {
  icon: string;
  title: string;
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-7xl" aria-hidden>
        {icon}
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-earth">{title}</h1>
      <p className="mt-2 max-w-sm text-earth/70">{message}</p>

      {hint && (
        <p className="mt-3 rounded-full bg-gold/15 px-4 py-1.5 text-sm font-medium text-gold-dark">
          🛠️ {hint}
        </p>
      )}

      <Link
        href="/dashboard"
        className="tile-press mt-6 flex items-center gap-2 rounded-2xl bg-green px-5 py-3 font-semibold text-white shadow-tile hover:bg-green-dark"
      >
        <span aria-hidden>🏠</span> Retour à l&apos;accueil
      </Link>
    </div>
  );
}
