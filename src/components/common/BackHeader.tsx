import Link from "next/link";

/**
 * Top row of a detail page: a back link to the parent list on the left
 * and the record's id (monospace) on the right. Keeps every detail page
 * consistent and guarantees a clear way back (no dead ends).
 */
export function BackHeader({
  href,
  label,
  id,
}: {
  href: string;
  label: string;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Link
        href={href}
        className="flex items-center gap-1.5 text-sm font-semibold text-earth/70 hover:text-earth"
      >
        <span aria-hidden>‹</span> {label}
      </Link>
      <span className="font-mono text-xs text-earth/40">{id}</span>
    </div>
  );
}
