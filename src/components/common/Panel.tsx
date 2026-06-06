/**
 * Standard white card with an icon + title heading. Shared across all
 * detail pages for consistent spacing, radius, and typography.
 */
export function Panel({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-earth">
        <span aria-hidden>{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}
