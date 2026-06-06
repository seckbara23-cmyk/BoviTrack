/**
 * Friendly "no results" block shown by the list explorers when a search
 * or filter matches nothing. Livestock-oriented, never a generic message.
 */
export function NoResults({
  icon = "🔍",
  title,
  message = "Modifiez la recherche ou les filtres.",
}: {
  icon?: string;
  title: string;
  message?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-card">
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-3 font-semibold text-earth">{title}</p>
      <p className="text-sm text-earth/60">{message}</p>
    </div>
  );
}
