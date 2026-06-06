/**
 * Simple horizontal bar for a distribution (no chart library).
 * Width is relative to the largest value so differences are visible.
 */
export function DistributionBar({
  label,
  count,
  max,
  color = "bg-green",
}: {
  label: string;
  count: number;
  max: number;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm font-semibold text-earth">
        {label}
      </span>
      <div className="h-6 flex-1 overflow-hidden rounded-full bg-sand-dark">
        <div
          className={`flex h-full items-center justify-end rounded-full px-2 text-xs font-bold text-white ${color}`}
          style={{ width: `${Math.max(pct, count > 0 ? 14 : 0)}%` }}
        >
          {count > 0 ? count : ""}
        </div>
      </div>
      {count === 0 && (
        <span className="w-4 text-right text-xs font-bold text-earth/40">0</span>
      )}
    </div>
  );
}
