/**
 * Compact summary chip. Big number, big pictogram, tiny label —
 * readable at a glance without needing to parse text.
 */
export function SummaryCard({
  icon,
  value,
  label,
  tone = "neutral",
}: {
  icon: string;
  value: number | string;
  label: string;
  tone?: "neutral" | "alert" | "warning" | "ok";
}) {
  const toneClass = {
    neutral: "bg-white text-earth",
    ok: "bg-green-50 text-green",
    warning: "bg-gold/15 text-gold-dark",
    alert: "bg-alert/10 text-alert",
  }[tone];

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-3 shadow-card ${toneClass}`}
    >
      <span className="text-2xl leading-none sm:text-3xl" aria-hidden>
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-xl font-extrabold sm:text-2xl">{value}</div>
        <div className="text-[11px] font-medium opacity-80 sm:text-xs">
          {label}
        </div>
      </div>
    </div>
  );
}
