/**
 * One metric inside a report section: pictogram + short label on the left,
 * a colour-coded value chip on the right. Reads at a glance, no chart.
 */
export function MetricRow({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: string;
  label: string;
  value: number | string;
  tone?: "neutral" | "ok" | "warning" | "alert";
}) {
  const toneClass = {
    neutral: "bg-sand-dark text-earth",
    ok: "bg-green-50 text-green",
    warning: "bg-gold/15 text-gold-dark",
    alert: "bg-alert/10 text-alert",
  }[tone];

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-sand p-3">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-earth">{label}</span>
      <span className={`rounded-full px-3 py-1 text-sm font-bold ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}
