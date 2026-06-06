import Link from "next/link";

/**
 * Card wrapper for a report section: icon + title, content, and one or
 * more clear action links at the bottom.
 */
export function ReportSection({
  icon,
  title,
  links,
  children,
}: {
  icon: string;
  title: string;
  links: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-earth">
        <span aria-hidden>{icon}</span> {title}
      </h2>

      {children}

      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className="tile-press flex items-center gap-1.5 rounded-2xl bg-green px-4 py-2.5 text-sm font-bold text-white shadow-tile hover:bg-green-dark"
          >
            {link.label} ›
          </Link>
        ))}
      </div>
    </section>
  );
}
